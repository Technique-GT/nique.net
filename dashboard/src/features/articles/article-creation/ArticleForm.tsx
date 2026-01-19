import { useEffect, useMemo, useState } from "react";
import { $getRoot } from "lexical";

import { Editor } from "@/components/blocks/editor-00/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info, Search, X, ChevronDown, Check, AlertCircle, Eye, ShieldAlert } from "lucide-react";

import { MediaPicker } from "@/components/media/media-picker";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  type Article,
  type Author,
  type Category,
  type FieldErrorKey,
  type MediaItem,
  type SerializedEditorState,
  type SubCategory,
  type Tag,
} from "./types";
import { apiClient } from "@/lib/api-client";

interface ArticleFormProps {
  categories: Category[];
  subcategories: SubCategory[];
  tags: Tag[];
  authors: Author[];
  mediaLibrary: MediaItem[];
  initialArticle?: Article | null;
  isLoadingData?: boolean;
  onLastSavedChange?: (date: Date) => void;
}

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/use-queries";

export default function ArticleForm({
  categories,
  subcategories,
  tags,
  authors,
  mediaLibrary,
  initialArticle,
  isLoadingData,
  onLastSavedChange,
}: ArticleFormProps) {
  const { user: me } = useAuthStore((state) => state.auth);
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(initialArticle?.title || "");
  const [content, setContent] = useState<SerializedEditorState | undefined>(
    initialArticle?.editorState,
  );
  const [contentText, setContentText] = useState("");
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || "");
  const [category, setCategory] = useState(initialArticle?.category?._id || "");
  const [subcategory, setSubcategory] = useState(
    initialArticle?.subcategory?._id || "",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialArticle?.tags?.map((t) => t._id) || [],
  );
  const [selectedAuthors, setSelectedAuthors] = useState<Author[]>(
    initialArticle?.authors || [],
  );
  const [featuredMediaId, setFeaturedMediaId] = useState<string>(
    initialArticle?.featuredMedia?.id || "",
  );
  const [isPublished, setIsPublished] = useState(initialArticle?.isPublished || false);
  const [isFeatured, setIsFeatured] = useState(initialArticle?.isFeatured || false);
  const [isSticky, setIsSticky] = useState(initialArticle?.isSticky || false);
  const [reviewStatus, setReviewStatus] = useState<
    "draft" | "in_review" | "changes_requested" | "published"
  >(initialArticle?.reviewStatus || "draft");
  const [hasPendingChanges, setHasPendingChanges] = useState(initialArticle?.hasPendingChanges || false);

  const isOwner = me?.id === initialArticle?.ownerId;
  const isAdmin = !!me?.isAdmin;
  const isLocked = reviewStatus === "in_review" && !isAdmin;
  const canManageAuthorsPerm = isAdmin || isOwner;

  // Determine available actions
  const canRequestReview = reviewStatus !== 'in_review' && (reviewStatus === 'draft' || reviewStatus === 'changes_requested' || (reviewStatus === 'published' && hasPendingChanges)) && (isOwner || isAdmin);
  const canCancelReview = reviewStatus === 'in_review' && (isOwner || isAdmin);
  const canRequestChanges = isAdmin && reviewStatus === 'in_review';
  const canPublish = isAdmin && (reviewStatus === 'in_review' || reviewStatus === 'changes_requested' || (reviewStatus === 'published' && hasPendingChanges));
  const canUnpublish = isAdmin && reviewStatus === 'published';

  // "Request Review" is the only option if:
  // 1. It is available
  // 2. We are NOT an admin (admins always have "Publish" available when "Request Review" is available, except maybe purely new draft? but Admin can publish draft)
  // Actually, even easier:
  const showRequestReviewDirectly = canRequestReview && !canPublish && !canUnpublish && !canCancelReview && !canRequestChanges;
  const showCancelReviewDirectly = canCancelReview && !canPublish && !canUnpublish && !canRequestReview && !canRequestChanges;
  const showUnpublishDirectly = canUnpublish && !canPublish && !canRequestReview && !canCancelReview && !canRequestChanges;

  // Sync state with initialArticle when it's loaded
  useEffect(() => {
    if (initialArticle) {
      setTitle(initialArticle.title || "");
      setContent(initialArticle.editorState);
      setExcerpt(initialArticle.excerpt || "");
      setCategory(initialArticle.category?._id || "");
      setSubcategory(initialArticle.subcategory?._id || "");
      setSelectedTags(initialArticle.tags?.map((t) => t._id) || []);
      setSelectedAuthors(initialArticle.authors || []);
      setFeaturedMediaId(initialArticle.featuredMedia?.id || "");
      setIsPublished(initialArticle.isPublished || false);
      setIsFeatured(initialArticle.isFeatured || false);
      setIsSticky(initialArticle.isSticky || false);
      setReviewStatus(initialArticle.reviewStatus || "draft");
      setHasPendingChanges(initialArticle.hasPendingChanges || false);
      setEditorResetKey((prev) => prev + 1);
    }
  }, [initialArticle]);

  // Enhanced Lexical to HTML conversion that preserves all formatting
  const convertLexicalToHtml = (editorState: SerializedEditorState): string => {
    try {
      const extractFormattedTextFromNode = (node: any): string => {
        // Handle text nodes with formatting
        if (node.type === 'text') {
          let textContent = node.text || '';
          
          // Apply text formatting
          if (node.format & 1) { // Bold
            textContent = `<strong>${textContent}</strong>`;
          }
          if (node.format & 2) { // Italic
            textContent = `<em>${textContent}</em>`;
          }
          if (node.format & 4) { // Underline
            textContent = `<u>${textContent}</u>`;
          }
          if (node.format & 8) { // Strikethrough
            textContent = `<s>${textContent}</s>`;
          }
          if (node.format & 16) { // Code
            textContent = `<code>${textContent}</code>`;
          }
          if (node.format & 32) { // Subscript
            textContent = `<sub>${textContent}</sub>`;
          }
          if (node.format & 64) { // Superscript
            textContent = `<sup>${textContent}</sup>`;
          }
          
          return textContent;
        }
        
        // Handle paragraph nodes
        if (node.type === 'paragraph') {
          if (node.children && Array.isArray(node.children)) {
            const paragraphContent = node.children.map(extractFormattedTextFromNode).join('');
            
            // Handle text alignment
            const format = node.format || 0;
            let alignClass = '';
            if (format & 1) alignClass = ' style="text-align: left;"';
            if (format & 2) alignClass = ' style="text-align: center;"';
            if (format & 3) alignClass = ' style="text-align: right;"';
            if (format & 4) alignClass = ' style="text-align: justify;"';
            
            return paragraphContent ? `<p${alignClass}>${paragraphContent}</p>` : '<p><br></p>';
          }
          return '<p><br></p>';
        }
        
        // Handle heading nodes
        if (node.type === 'heading') {
          if (node.children && Array.isArray(node.children)) {
            const headingContent = node.children.map(extractFormattedTextFromNode).join('');
            const tag = node.tag || 'h1';
            return `<${tag}>${headingContent}</${tag}>`;
          }
          return '';
        }
        
        // Handle list nodes
        if (node.type === 'list') {
          if (node.children && Array.isArray(node.children)) {
            const listItems = node.children.map(extractFormattedTextFromNode).join('');
            const listTag = node.listType === 'bullet' ? 'ul' : 'ol';
            return `<${listTag}>${listItems}</${listTag}>`;
          }
          return '';
        }
        
        // Handle list item nodes
        if (node.type === 'listitem') {
          if (node.children && Array.isArray(node.children)) {
            const itemContent = node.children.map(extractFormattedTextFromNode).join('');
            return `<li>${itemContent}</li>`;
          }
          return '<li></li>';
        }
        
        // Handle quote nodes
        if (node.type === 'quote') {
          if (node.children && Array.isArray(node.children)) {
            const quoteContent = node.children.map(extractFormattedTextFromNode).join('');
            return `<blockquote>${quoteContent}</blockquote>`;
          }
          return '<blockquote></blockquote>';
        }
        
        // Handle code nodes
        if (node.type === 'code') {
          if (node.children && Array.isArray(node.children)) {
            const codeContent = node.children.map(extractFormattedTextFromNode).join('');
            return `<pre><code>${codeContent}</code></pre>`;
          }
          return '<pre><code></code></pre>';
        }
        
        // Handle line break nodes
        if (node.type === 'linebreak') {
          return '<br>';
        }
        
        // Handle link nodes
        if (node.type === 'link') {
          if (node.children && Array.isArray(node.children)) {
            const linkContent = node.children.map(extractFormattedTextFromNode).join('');
            const url = node.url || '#';
            const title = node.title ? ` title="${node.title}"` : '';
            return `<a href="${url}"${title}>${linkContent}</a>`;
          }
          return '';
        }
        
        // Recursively process children for other node types
        if (node.children && Array.isArray(node.children)) {
          return node.children.map(extractFormattedTextFromNode).join('');
        }
        
        return '';
      };

      if (editorState?.root?.children) {
        const htmlContent = editorState.root.children
          .map(extractFormattedTextFromNode)
          .filter(Boolean)
          .join('\n');
        
        return htmlContent || '<p></p>';
      }
      
      return '<p></p>';
    } catch (error) {
      console.error('Error converting Lexical to HTML:', error);
      return '<p></p>';
    }
  };  

  // Autosave logic
   useEffect(() => {
     if (!initialArticle?._id || reviewStatus === 'in_review') return;

     // Don't autosave until required backend validators will pass
     // Relaxed for drafts: allow saving even with partial data
     // if (!category) return;
     // if (!excerpt?.trim()) return;
     // if (!selectedAuthors?.some((a) => !!a?._id)) return;

     const timer = setTimeout(async () => {
       try {
         const htmlContent = content ? convertLexicalToHtml(content) : ""
         const articleData = {
           title,
           content: htmlContent,
           editorState: content,
           ...(excerpt?.trim() ? { excerpt: excerpt.trim() } : {}),
           ...(category ? { categoryId: category } : {}),
           ...(subcategory ? { subcategoryId: subcategory } : {}),
           ...(selectedTags?.length ? { tagIds: selectedTags } : {}),
           // Only include authors if user has permission to manage them
           ...(canManageAuthorsPerm && selectedAuthors?.length
             ? { authors: selectedAuthors.filter((a) => !!a?._id).map((a) => ({ authorId: a._id })) }
             : {}),
           ...(featuredMediaId ? { featuredMediaId } : {}),
         };

          await apiClient.put(`/admin/articles/${initialArticle._id}`, articleData);
          
          onLastSavedChange?.(new Date());

          // Invalidate query to keep state fresh, but do it silently without triggering loading states if possible.
         // However, useAdminArticle has staleTime: 0, so invalidating will trigger refetch.
         // This might cause UI flicker if not handled gracefully, but ensures consistency.
         await queryClient.invalidateQueries({ queryKey: queryKeys.adminArticle(initialArticle._id) });

       } catch (error) {
         console.error('Autosave failed:', error);
       }
     }, 2000); // 2 second debounce

     return () => clearTimeout(timer);
   }, [title, content, excerpt, category, subcategory, selectedTags, selectedAuthors, featuredMediaId, initialArticle?._id, reviewStatus]);

  const [formErrors, setFormErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(0);
  
  // Search functionality
  const [authorSearch, setAuthorSearch] = useState("");
  const [showAuthorResults, setShowAuthorResults] = useState(false);

  // Filter authors based on search
  const filteredAuthors = useMemo(() => {
    if (!authorSearch.trim()) return [];

    const list = Array.isArray(authors) ? authors : [];
    const searchTerm = authorSearch.toLowerCase();

    return list.filter((author) => {
      const firstName = typeof author?.firstName === 'string' ? author.firstName : '';
      const lastName = typeof author?.lastName === 'string' ? author.lastName : '';
      const username = typeof author?.username === 'string' ? author.username : '';
      const email = typeof author?.email === 'string' ? author.email : '';

      return (
        firstName.toLowerCase().includes(searchTerm) ||
        lastName.toLowerCase().includes(searchTerm) ||
        username.toLowerCase().includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm)
      );
    });
  }, [authorSearch, authors]);

  const handleRequestReview = async () => {
    if (!initialArticle?._id) return;
    try {
      setIsSubmitting(true);
      await apiClient.post(`/admin/articles/${initialArticle._id}/request-review`);
      setReviewStatus('in_review');
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminArticle(initialArticle._id) });
      toast.success("Review requested");
    } catch (error) {
      console.error('Failed to request review:', error);
      toast.error("Failed to request review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnrequestReview = async () => {
    if (!initialArticle?._id) return;
    try {
      setIsSubmitting(true);
      await apiClient.post(`/admin/articles/${initialArticle._id}/unrequest-review`);
      setReviewStatus('draft');
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminArticle(initialArticle._id) });
      toast.success("Review cancelled");
    } catch (error) {
      console.error('Failed to cancel review:', error);
      toast.error("Failed to cancel review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!initialArticle?._id) return;
    // Prompt for notes? For now just simple request
    const notes = prompt("Enter notes for requested changes (optional):");
    try {
      setIsSubmitting(true);
      await apiClient.post(`/admin/articles/${initialArticle._id}/request-changes`, { reviewNotes: notes });
      setReviewStatus('changes_requested');
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminArticle(initialArticle._id) });
      toast.success("Changes requested");
    } catch (error) {
      console.error('Failed to request changes:', error);
      toast.error("Failed to request changes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminPublish = async () => {
    if (!initialArticle?._id) return;

    const errors = validateRequiredFields();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in required fields before publishing.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await apiClient.post(`/admin/articles/${initialArticle._id}/publish`);
      setReviewStatus('published');
      setIsPublished(true);
      setHasPendingChanges(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminArticle(initialArticle._id) });
      toast.success("Article published");
    } catch (error) {
      console.error('Failed to publish:', error);
      toast.error("Failed to publish");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminUnpublish = async () => {
    if (!initialArticle?._id) return;
    try {
      setIsSubmitting(true);
      await apiClient.post(`/admin/articles/${initialArticle._id}/unpublish`);
      setReviewStatus('draft');
      setIsPublished(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminArticle(initialArticle._id) });
      toast.success("Article unpublished");
    } catch (error) {
      console.error('Failed to unpublish:', error);
      toast.error("Failed to unpublish");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get display names for selected items
  const selectedCategoryName = useMemo(() => {
    const found = categories.find(cat => cat._id === category);
    return found ? found.name : "";
  }, [category, categories]);

  const selectedSubcategoryName = useMemo(() => {
    const found = subcategories.find(sub => sub._id === subcategory);
    return found ? found.name : "";
  }, [subcategory, subcategories]);

  const selectedTagNames = useMemo(() => {
    return selectedTags.map(tagId => {
      const found = tags.find(tag => tag._id === tagId);
      return found ? found.name : tagId;
    });
  }, [selectedTags, tags]);

  // Transform data for frontend use
  const availableTags = useMemo(() => 
    tags.map(tag => ({
      id: tag._id,
      name: tag.name
    })), [tags]);

  const categoriesData = useMemo(() => 
    categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      slug: cat.slug
    })), [categories]);

  // Get subcategories for the selected category
  const availableSubcategories = useMemo(() => {
    if (!category) return [];
    
    return subcategories
      .filter(sub => {
        const catId =
          sub.categoryId ??
          (typeof sub.category === 'object' ? sub.category?._id : sub.category);
        return catId === category;
      })
      .map(sub => ({
        id: sub._id,
        name: sub.name,
        slug: sub.slug
      }));
  }, [category, subcategories]);

  const isSubcategoryRequired = availableSubcategories.length > 0;
  const subcategoryPlaceholder = useMemo(() => {
    if (!category) {
      return "Select a category first";
    }
    if (!isSubcategoryRequired) {
      return "No sub-categories available";
    }
    return "Select sub-category";
  }, [category, isSubcategoryRequired]);

  const isContentEmpty = useMemo(
    () => contentText.trim().length === 0,
    [contentText],
  );

  const clearFieldError = (field: FieldErrorKey) => {
    setFormErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Author selection functions
  const handleAuthorSearch = (searchTerm: string) => {
    setAuthorSearch(searchTerm);
    setShowAuthorResults(searchTerm.length > 0);
  };

  const handleAuthorSelect = (author: Author) => {
    if (!selectedAuthors.find(a => a._id === author._id)) {
      setSelectedAuthors(prev => [...prev, author]);
    }
    setAuthorSearch("");
    setShowAuthorResults(false);
    if (formErrors.authors) {
      clearFieldError("authors");
    }
  };

  const handleAuthorRemove = (authorId: string) => {
    setSelectedAuthors(prev => prev.filter(a => a._id !== authorId));
  };

  // Tag selection functions
  const handleTagSelect = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev : [...prev, tagId]
    );
    if (formErrors.tags && selectedTags.length > 0) {
      clearFieldError("tags");
    }
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags((prev) => prev.filter(id => id !== tagId));
  };

  // Display functions for selected items
  const getAuthorDisplayName = (author: Author) => {
    return `${author.firstName} ${author.lastName} (${author.role})`;
  };

  const validateRequiredFields = () => {
    const errors: Partial<Record<FieldErrorKey, string>> = {};

    if (!title.trim()) {
      errors.title = "Title is required.";
    }

    if (isContentEmpty) {
      errors.content = "Content is required.";
    }

    if (!selectedAuthors.some((a) => !!a?._id)) {
      errors.authors = "At least one author must be selected.";
    }

    if (!category) {
      errors.category = "Category is required.";
    }

    return errors;
  };

  const handleSaveChanges = async () => {
    if (!initialArticle?._id) return;
    if (isLocked && !isAdmin) {
      toast.error("This article is locked for review.");
      return;
    }

    const errors = validateRequiredFields();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const htmlContent = content ? convertLexicalToHtml(content) : "<p></p>";

      const articleData = {
        title: title.trim(),
        content: htmlContent,
        editorState: content,
        ...(excerpt.trim() ? { excerpt: excerpt.trim() } : {}),
        ...(category ? { categoryId: category } : {}),
        ...(subcategory ? { subcategoryId: subcategory } : {}),
        ...(selectedTags.length ? { tagIds: selectedTags } : {}),
        // Only include authors if user has permission to manage them
        ...(canManageAuthorsPerm ? { 
          authors: selectedAuthors.filter((a) => !!a?._id).map((a) => a._id) 
        } : {}),
        ...(featuredMediaId ? { featuredMediaId } : {}),
        published: isPublished,
        isFeatured: isPublished ? isFeatured : false,
        isSticky: isPublished ? isSticky : false,
      };

      await apiClient.put(`/admin/articles/${initialArticle._id}`, articleData);

      onLastSavedChange?.(new Date());

      await queryClient.invalidateQueries({ queryKey: queryKeys.adminArticle(initialArticle._id) });

      setSubmitMessage({ type: 'success', message: 'Changes saved.' });
    } catch (error: any) {
      console.error('Save failed:', error);
      const msg = error?.response?.data?.message || 'Failed to save changes.';
      setSubmitMessage({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    // Existing articles: Save immediately (no confirm dialog flow)
    if (initialArticle?._id) {
      if (isLocked && !isAdmin) {
        toast.error("This article is locked for review.");
        return;
      }
      handleSaveChanges();
      return;
    }

    const errors = validateRequiredFields();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Convert Lexical content to HTML using enhanced conversion
    // const htmlContent = content ? convertLexicalToHtml(content) : "";

    // setPendingSubmission({
    //   title,
    //   content: htmlContent,
    //   categoryId: category,
    //   subcategoryId: subcategory,
    //   tagIds: selectedTags,
    //   authors: selectedAuthors.filter((a) => !!a?._id).map((author) => author._id),
    //   featuredMediaId,
    //   imageCaption: excerpt,
    //   published: isPublished,
    //   isFeatured: isPublished ? isFeatured : false,
    //   isSticky: isPublished ? isSticky : false,
    // });
    // setConfirmOpen(true);
    // Since we are not using ArticleSubmission anymore, we just call handleSaveChanges.
    handleSaveChanges();
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      {/* Success/Error Message */}
      {submitMessage && (
        <div className={`mb-4 p-4 rounded-md ${
          submitMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {submitMessage.message}
        </div>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 pt-6">
            {isLocked && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span className="text-sm">This article is currently locked for review.</span>
              </div>
            )}
            {reviewStatus === 'changes_requested' && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2 rounded-md flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span className="text-sm">Changes requested by admin. {initialArticle?.reviewNotes ? `Note: ${initialArticle.reviewNotes}` : ''}</span>
              </div>
            )}
            {hasPendingChanges && reviewStatus === 'published' && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-md flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span className="text-sm">This article has pending changes that are not yet live. Request review to publish updates.</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title" className='gap-0'>Title<span className='text-destructive'>*</span></Label>
              <Input
                id="title"
                value={title}
                disabled={isLocked}
                onChange={(e) => {
                  const value = e.target.value;
                  setTitle(value);
                  if (formErrors.title && value.trim()) {
                    clearFieldError("title");
                  }
                }}
                placeholder="Enter article title"
                className={cn(
                  "text-8xl font-semibold",
                  formErrors.title && "border-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={Boolean(formErrors.title)}
              />
              {formErrors.title && (
                <p className="text-xs text-destructive">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label id="content-label" className='gap-0'>Content<span className='text-destructive'>*</span></Label>
              <div role="group" aria-labelledby="content-label">
                <Editor
                  key={editorResetKey}
                  editorSerializedState={content}
                  initialHtml={!content && initialArticle?.content ? initialArticle.content : undefined}
                  onSerializedChange={setContent}
                  onChange={(editorState) => {
                    editorState.read(() => {
                      const text = $getRoot().getTextContent().trim();
                      setContentText(text);
                      if (formErrors.content && text.length > 0) {
                        clearFieldError("content");
                      }
                    });
                  }}
                />
              </div>
              {formErrors.content && (
                <p className="text-xs text-destructive">{formErrors.content}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatting (headings, lists, bold, italic, alignment) will be preserved in the final article.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Featured Media */}
              <div className="space-y-2">
                <Label htmlFor="featured-media" className='gap-0'>Featured Media</Label>
                <MediaPicker
                  value={featuredMediaId || undefined}
                  items={mediaLibrary}
                  disabled={isLocked}
                  onChange={(id) => {
                    setFeaturedMediaId(id || "");
                    if (formErrors.featuredMedia && id) {
                      clearFieldError("featuredMedia");
                    }
                  }}
                  placeholder="Choose featured media"
                  error={Boolean(formErrors.featuredMedia)}
                />
                {formErrors.featuredMedia && (
                  <p className="text-xs text-destructive">{formErrors.featuredMedia}</p>
                )}
              </div>
              
              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="excerpt" className='gap-0'>Caption</Label>
                <Input
                  id="excerpt"
                  value={excerpt}
                  disabled={isLocked}
                  onChange={(e) => {
                    const value = e.target.value;
                    setExcerpt(value);
                    if (formErrors.excerpt && value.trim()) {
                      clearFieldError("excerpt");
                    }
                  }}
                  placeholder="Enter caption"
                  className={cn(
                    "italic",
                    formErrors.excerpt && "border-destructive focus-visible:ring-destructive"
                  )}
                  aria-invalid={Boolean(formErrors.excerpt)}
                />
                {formErrors.excerpt && (
                  <p className="text-xs text-destructive">{formErrors.excerpt}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-6">
                {/* Authors - Searchable Input */}
                <div className="space-y-2">
                  <Label htmlFor="authors" className='gap-0'>Author(s)<span className='text-destructive'>*</span></Label>
                  
                  {/* Selected Authors */}
                  <div className={cn(
                    "flex flex-wrap gap-2 p-2 border rounded-md min-h-10",
                    formErrors.authors && "border-destructive"
                  )}>
                     {selectedAuthors.map((author, idx) => (
                       <Badge
                         key={author._id || `${idx}`}
                         variant="secondary"
                         className="px-3 py-1 text-sm flex items-center gap-1"
                       >
                        {getAuthorDisplayName(author)}
                        {!isLocked && canManageAuthorsPerm && (
                          <button
                            type="button"
                            onClick={() => handleAuthorRemove(author._id)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    {selectedAuthors.length === 0 && (
                      <span className="text-muted-foreground text-sm">No authors selected</span>
                    )}
                  </div>
                  {formErrors.authors && (
                    <p className="text-xs text-destructive">{formErrors.authors}</p>
                  )}

                  {/* Author Search */}
                  {!isLocked && canManageAuthorsPerm && (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={authorSearch}
                          onChange={(e) => handleAuthorSearch(e.target.value)}
                          placeholder="Search for authors by name, username, or email..."
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Search Results */}
                      {showAuthorResults && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredAuthors.length > 0 ? (
                            filteredAuthors.map((author) => (
                              <div
                                key={author._id}
                                className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                onClick={() => handleAuthorSelect(author)}
                              >
                                <div className="font-medium">
                                  {getAuthorDisplayName(author)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {author.username} • {author.email}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-muted-foreground text-center">
                              No authors found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Category & sub-category */}
                <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-row sm:gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="category" className='gap-0'>Category<span className='text-destructive'>*</span></Label>
                    <Select
                      value={category}
                      disabled={isLocked}
                      onValueChange={(value) => {
                        setCategory(value);
                        setSubcategory(""); // Reset subcategory when category changes
                        if (formErrors.category && value) {
                          clearFieldError("category");
                        }
                        if (formErrors.subcategory) {
                          clearFieldError("subcategory");
                        }
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          formErrors.category && "border-destructive focus:ring-destructive"
                        )}
                        aria-invalid={Boolean(formErrors.category)}
                      >
                        <SelectValue placeholder={category ? selectedCategoryName : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <p className="text-xs text-destructive">{formErrors.category}</p>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <Label htmlFor="subcategory">
                      Sub-category
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/50 text-[10px] text-muted-foreground cursor-help">
                            ?
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className='max-w-64 flex-wrap'>
                          {availableSubcategories.length > 0 
                            ? "Select a sub-category to further classify this article"
                            : "No sub-categories available for the selected category"
                          }
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select
                      value={subcategory}
                      onValueChange={(value) => {
                        setSubcategory(value);
                        if (formErrors.subcategory && value) {
                          clearFieldError("subcategory");
                        }
                      }}
                      disabled={!isSubcategoryRequired || isLocked}
                    >
                      <SelectTrigger
                        className={cn(
                          formErrors.subcategory &&
                            "border-destructive focus:ring-destructive",
                          !isSubcategoryRequired && "text-muted-foreground"
                        )}
                        aria-invalid={Boolean(formErrors.subcategory)}
                        disabled={!isSubcategoryRequired || isLocked}
                      >
                        <SelectValue placeholder={subcategory ? selectedSubcategoryName : subcategoryPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubcategories.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.subcategory && (
                      <p className="text-xs text-destructive">{formErrors.subcategory}</p>
                    )}
                  </div>
                </div>

                {/* New Featured and Sticky Controls */}
                {isAdmin && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={isFeatured}
                        onCheckedChange={setIsFeatured}
                        disabled={!isPublished || !isAdmin}
                      />
                      <Label htmlFor="featured" className={(!isPublished || !isAdmin) ? "text-muted-foreground" : ""}>
                        Featured article
                        {(!isPublished) && <span className="text-xs text-muted-foreground ml-1">(requires publishing)</span>}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sticky"
                        checked={isSticky}
                        onCheckedChange={setIsSticky}
                        disabled={!isPublished || !isAdmin}
                      />
                      <Label htmlFor="sticky" className={(!isPublished || !isAdmin) ? "text-muted-foreground" : ""}>
                        Sticky article (pinned to top)
                        {(!isPublished) && <span className="text-xs text-muted-foreground ml-1">(requires publishing)</span>}
                      </Label>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {/* Common Save/Create button (only for drafts/published, not in_review unless admin) */}
                  {(!isLocked || isAdmin) && (
                    <Button
                      type={initialArticle?._id ? "button" : "submit"}
                      onClick={initialArticle?._id ? handleSaveChanges : undefined}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : (initialArticle?._id ? "Save Changes" : "Create Article")}
                    </Button>
                  )}

                  {/* Workflow Actions */}
                  {initialArticle?._id && (
                    <>
                      {/* Direct Button: Request Review (if only option) */}
                      {showRequestReviewDirectly && (
                        <Button type="button" variant="outline" onClick={handleRequestReview} disabled={isSubmitting}>
                          Request Review
                        </Button>
                      )}

                      {/* Direct Button: Cancel Review (if only option) */}
                      {showCancelReviewDirectly && (
                        <Button type="button" variant="outline" onClick={handleUnrequestReview} disabled={isSubmitting}>
                          Cancel Review Request
                        </Button>
                      )}

                      {/* Direct Button: Unpublish (if only option) */}
                      {showUnpublishDirectly && (
                        <Button type="button" variant="destructive" onClick={handleAdminUnpublish} disabled={isSubmitting}>
                          Unpublish
                        </Button>
                      )}

                      {/* Dropdown: If multiple options or specific admin actions */}
                      {!showRequestReviewDirectly && !showCancelReviewDirectly && !showUnpublishDirectly && (canRequestReview || canCancelReview || canRequestChanges || canPublish || canUnpublish) && (
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                              Review Actions
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Manage Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {/* Request Review */}
                            {canRequestReview && (
                              <DropdownMenuItem onClick={handleRequestReview} disabled={isSubmitting} className="text-blue-600 focus:text-blue-700 focus:bg-blue-50 dark:focus:bg-blue-950/50">
                                <Eye className="mr-2 h-4 w-4" />
                                Request Review
                              </DropdownMenuItem>
                            )}

                            {/* Cancel Review */}
                            {canCancelReview && (
                              <DropdownMenuItem onClick={handleUnrequestReview} disabled={isSubmitting}>
                                <X className="mr-2 h-4 w-4 text-muted-foreground" />
                                Cancel Review Request
                              </DropdownMenuItem>
                            )}

                            {/* Admin: Request Changes */}
                            {canRequestChanges && (
                              <DropdownMenuItem onClick={handleRequestChanges} disabled={isSubmitting} className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 dark:focus:bg-orange-950/50">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Request Changes
                              </DropdownMenuItem>
                            )}

                            {/* Admin: Publish */}
                            {canPublish && (
                              <DropdownMenuItem onClick={handleAdminPublish} disabled={isSubmitting} className="text-green-600 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-950/50">
                                <Check className="mr-2 h-4 w-4" />
                                {reviewStatus === 'published' ? 'Publish Updates' : 'Approve & Publish'}
                              </DropdownMenuItem>
                            )}

                            {/* Admin: Unpublish */}
                            {canUnpublish && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleAdminUnpublish} disabled={isSubmitting} variant="destructive">
                                  <ShieldAlert className="mr-2 h-4 w-4" />
                                  Unpublish Article
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  )}

                  {!initialArticle?._id && (
                    <div className="text-muted-foreground">Initializing draft...</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className='gap-0'>Tags</Label>
                <div className={cn(
                  "flex flex-wrap gap-2 p-2 border rounded-md min-h-10",
                  formErrors.tags && "border-destructive"
                )}>
                  {selectedTagNames.map((tagName, index) => (
                    <Badge
                      key={selectedTags[index]}
                      variant="secondary"
                      className="px-3 py-1 text-sm cursor-pointer"
                      onClick={() => !isLocked && handleTagRemove(selectedTags[index])}
                    >
                      {tagName} {!isLocked && "×"}
                    </Badge>
                  ))}
                  {selectedTags.length === 0 && (
                    <span className="text-muted-foreground text-sm">No tags selected</span>
                  )}
                </div>
                {formErrors.tags && (
                  <p className="text-xs text-destructive">{formErrors.tags}</p>
                )}
                {!isLocked && (
                  <div className="flex flex-wrap gap-2">
                    {availableTags
                      .filter((tag) => !selectedTags.includes(tag.id))
                      .map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="cursor-pointer px-3 py-1 text-sm hover:bg-secondary"
                          onClick={() => handleTagSelect(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    {availableTags.length === 0 && (
                      <p className="text-muted-foreground">No tags available</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
