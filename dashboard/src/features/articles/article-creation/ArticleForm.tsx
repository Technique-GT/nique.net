import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  $getRoot,
  IS_BOLD,
  IS_CODE,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_SUBSCRIPT,
  IS_SUPERSCRIPT,
  IS_UNDERLINE,
} from "lexical";

import { Editor } from "@/components/blocks/editor-00/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Image } from 'lucide-react';
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
import { MediaDropZone } from "@/components/media-drop-zone";
import { Info, Search, X, ChevronDown, Check, AlertCircle, ImagePlus } from "lucide-react";

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
  type SerializedEditorNode,
  type SerializedEditorState,
  type SubCategory,
  type Tag,
} from "./types";
import { apiClient } from "@/lib/api-client";
import { createAdminArticle } from "@/services/articles";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ArticleFormProps {
  categories: Category[];
  subcategories: SubCategory[];
  tags: Tag[];
  authors: Author[];
  initialArticle?: Article | null;
  isLoadingData?: boolean;
  onLastSavedChange?: (date: Date) => void;
}

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/use-queries";
import { withMediaSessionRevalidation } from "@/lib/media-url";
import { MediaPickerSheet } from "./MediaPickerSheet";
import { getMediaImages, type MediaImagesResponse } from "@/services/media";

const MEDIA_PICKER_PAGE_SIZE = 12;
const MEDIA_PICKER_STALE_TIME_MS = 5 * 60 * 1000;
const MEDIA_PICKER_GC_TIME_MS = 15 * 60 * 1000;

type LexicalNode = SerializedEditorNode & {
  text?: string;
  format?: number | string;
  style?: string;
  children?: LexicalNode[];
  tag?: string;
  listType?: string;
  url?: string;
  title?: string;
};

export default function ArticleForm({
  categories,
  subcategories,
  tags,
  authors,
  initialArticle,
  isLoadingData,
  onLastSavedChange,
}: ArticleFormProps) {
  const { user: me } = useAuthStore((state) => state.auth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [title, setTitle] = useState(initialArticle?.title || "");
  const [content, setContent] = useState<SerializedEditorState | undefined>(
    initialArticle?.editorState,
  );
  const [contentText, setContentText] = useState("");
  const [imageCaption, setImageCaption] = useState(initialArticle?.imageCaption || "");
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
  const [featuredMediaUrl, setFeaturedMediaUrl] = useState<string>(
    initialArticle?.featuredMediaUrl || "",
  );
  const [isPublished, setIsPublished] = useState(initialArticle?.isPublished || false);
  const [allowComments, setAllowComments] = useState(initialArticle?.allowComments ?? true);
  const [isFeatured, setIsFeatured] = useState(initialArticle?.isFeatured || false);
  const [isSticky, setIsSticky] = useState(initialArticle?.isSticky || false);
  const [reviewStatus, setReviewStatus] = useState<
    "draft" | "in_review" | "changes_requested" | "published"
  >(initialArticle?.reviewStatus || "draft");
  const [reviewConfirmOpen, setReviewConfirmOpen] = useState(false);
  const [mediaPreviewFailed, setMediaPreviewFailed] = useState(false);
  const [hideImage, setHideImage] = useState(true);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const mediaPreviewNonce = useMemo(
    () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const featuredMediaPreviewUrl = useMemo(() => {
    const trimmed = featuredMediaUrl.trim();
    return trimmed ? withMediaSessionRevalidation(trimmed, mediaPreviewNonce) : '';
  }, [featuredMediaUrl, mediaPreviewNonce]);

  const isOwner = me?.id === initialArticle?.ownerId;
  const isAdmin = !!me?.isAdmin;
  const isLocked = reviewStatus === "in_review" && !isAdmin;
  const canManageAuthorsPerm = isAdmin || isOwner || !initialArticle?._id;

  useEffect(() => {
    setMediaPreviewFailed(false);
  }, [featuredMediaUrl]);

  useEffect(() => {
    if (initialArticle?._id) return;
    if (!me?.id) return;
    setSelectedAuthors((prev) => {
      if (prev.some((author) => author?._id === me.id)) {
        return prev;
      }
      const defaultAuthor: Author = {
        _id: me.id,
        firstName: (me.name || "Unknown").split(" ")[0] || "Unknown",
        lastName: (me.name || "Unknown").split(" ").slice(1).join(" "),
        username: me.name || "Unknown",
        email: me.email || "",
        role: me.isAdmin ? "admin" : "writer",
        status: "active",
      };
      return [...prev, defaultAuthor];
    });
  }, [initialArticle?._id, me]);

  const canRequestReview = !isAdmin
    && !!initialArticle?._id
    && (reviewStatus === 'draft' || reviewStatus === 'changes_requested')
    && isOwner;
  const canCancelReview = reviewStatus === 'in_review' && (isOwner || isAdmin);
  const canRequestChanges = isAdmin && reviewStatus === 'in_review';
  const canApproveAndPublish = isAdmin && reviewStatus === 'in_review';
  const canAdminPublishDraft = isAdmin && reviewStatus === 'draft';
  const canUnpublish = isAdmin && reviewStatus === 'published';

  const extractTextFromEditorState = (editorState?: SerializedEditorState): string => {
    if (!editorState?.root?.children) return "";

    const extractTextFromNode = (node: SerializedEditorNode): string => {
      const lexicalNode = node as LexicalNode;

      if (lexicalNode.type === "text") {
        return lexicalNode.text || "";
      }
      if (lexicalNode.type === "linebreak") {
        return "\n";
      }
      if (Array.isArray(lexicalNode.children)) {
        return lexicalNode.children.map(extractTextFromNode).join("");
      }
      return "";
    };

    return editorState.root.children.map(extractTextFromNode).join("").trim();
  };

  // Sync state with initialArticle when it's loaded
  useEffect(() => {
    if (initialArticle) {
      setTitle(initialArticle.title || "");
      setContent(initialArticle.editorState);
      setContentText(extractTextFromEditorState(initialArticle.editorState));
      setImageCaption(initialArticle.imageCaption || "");
      setCategory(initialArticle.category?._id || "");
      setSubcategory(initialArticle.subcategory?._id || "");
      setSelectedTags(initialArticle.tags?.map((t) => t._id) || []);
      setSelectedAuthors(initialArticle.authors || []);
      setFeaturedMediaUrl(initialArticle.featuredMediaUrl || "");
      setIsPublished(initialArticle.isPublished || false);
      setAllowComments(initialArticle.allowComments ?? true);
      setIsFeatured(initialArticle.isFeatured || false);
      setIsSticky(initialArticle.isSticky || false);
      setReviewStatus(initialArticle.reviewStatus || "draft");
      setEditorResetKey((prev) => prev + 1);
    }
  }, [initialArticle]);

  // Enhanced Lexical to HTML conversion that preserves all formatting
  const convertLexicalToHtml = (editorState: SerializedEditorState): string => {
    try {
      const numberToRem = (num: number) =>
        `${num.toFixed(4).replace(/\.?0+$/, "")}rem`;

      const normalizeFontSizeStyle = (value: string): string => {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return "";

        const pxMatch = normalized.match(/^(\d+(?:\.\d+)?)px$/);
        if (pxMatch) {
          const rem = Number(pxMatch[1]) / 16;
          if (Math.abs(rem - 1) < 0.001) return "";
          return numberToRem(rem);
        }

        const remMatch = normalized.match(/^(\d+(?:\.\d+)?)rem$/);
        if (remMatch) {
          const rem = Number(remMatch[1]);
          if (Math.abs(rem - 1) < 0.001) return "";
          return numberToRem(rem);
        }

        return value.trim();
      };

      const normalizeInlineStyle = (style: string): string => {
        const declarations = style
          .split(";")
          .map((part) => part.trim())
          .filter(Boolean);

        const normalizedDeclarations = declarations
          .map((declaration) => {
            const [rawProp, ...rest] = declaration.split(":");
            if (!rawProp || rest.length === 0) return "";

            const prop = rawProp.trim().toLowerCase();
            const value = rest.join(":").trim();
            if (!value) return "";

            if (prop === "font-size") {
              const normalizedFontSize = normalizeFontSizeStyle(value);
              return normalizedFontSize ? `font-size: ${normalizedFontSize}` : "";
            }

            return `${prop}: ${value}`;
          })
          .filter(Boolean);

        return normalizedDeclarations.join("; ");
      };

      const resolveAlignment = (format: unknown): string | undefined => {
        const allowed = new Set(["left", "center", "right", "justify", "start", "end"]);
        if (typeof format === "string") {
          const normalized = format.trim().toLowerCase();
          return allowed.has(normalized) ? normalized : undefined;
        }

        if (typeof format === "number") {
          const alignMap: Record<number, string> = {
            1: "left",
            2: "center",
            3: "right",
            4: "justify",
            5: "start",
            6: "end",
          };
          return alignMap[format];
        }

        return undefined;
      };

      const buildBlockStyleAttr = (node: SerializedEditorNode): string => {
        const lexicalNode = node as LexicalNode;
        const styles: string[] = [];
        const align = resolveAlignment(lexicalNode.format);
        if (align) {
          styles.push(`text-align: ${align}`);
        }

        if (typeof lexicalNode.style === "string") {
          const normalized = normalizeInlineStyle(lexicalNode.style);
          if (normalized) {
            styles.push(normalized);
          }
        }

        if (styles.length === 0) {
          return "";
        }

        return ` style="${styles.join("; ").replace(/"/g, "&quot;")}"`;
      };

      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      const extractFormattedTextFromNode = (node: SerializedEditorNode): string => {
        const lexicalNode = node as LexicalNode;

        // Handle text nodes with formatting
        if (lexicalNode.type === "text") {
          let textContent = escapeHtml(lexicalNode.text || "");
          const nodeStyle =
            typeof lexicalNode.style === "string"
              ? normalizeInlineStyle(lexicalNode.style)
              : "";
          const nodeFormat = typeof lexicalNode.format === "number" ? lexicalNode.format : 0;

          // Apply text formatting
          if (nodeFormat & IS_BOLD) { // Bold
            textContent = `<strong>${textContent}</strong>`;
          }
          if (nodeFormat & IS_ITALIC) { // Italic
            textContent = `<em>${textContent}</em>`;
          }
          if (nodeFormat & IS_UNDERLINE) { // Underline
            textContent = `<u>${textContent}</u>`;
          }
          if (nodeFormat & IS_STRIKETHROUGH) { // Strikethrough
            textContent = `<s>${textContent}</s>`;
          }
          if (nodeFormat & IS_CODE) { // Code
            textContent = `<code>${textContent}</code>`;
          }
          if (nodeFormat & IS_SUBSCRIPT) { // Subscript
            textContent = `<sub>${textContent}</sub>`;
          }
          if (nodeFormat & IS_SUPERSCRIPT) { // Superscript
            textContent = `<sup>${textContent}</sup>`;
          }

          // Preserve inline styles set from toolbar (font-size/font-family/color).
          if (nodeStyle) {
            textContent = `<span style="${nodeStyle.replace(/"/g, "&quot;")}">${textContent}</span>`;
          }

          return textContent;
        }

        // Handle paragraph nodes
        if (lexicalNode.type === "paragraph") {
          if (Array.isArray(lexicalNode.children)) {
            const paragraphContent = lexicalNode.children.map(extractFormattedTextFromNode).join("");
            const styleAttr = buildBlockStyleAttr(lexicalNode);
            return paragraphContent ? `<p${styleAttr}>${paragraphContent}</p>` : `<p${styleAttr}><br></p>`;
          }
          return "<p><br></p>";
        }

        // Handle heading nodes
        if (lexicalNode.type === "heading") {
          if (Array.isArray(lexicalNode.children)) {
            const headingContent = lexicalNode.children.map(extractFormattedTextFromNode).join("");
            const tag = typeof lexicalNode.tag === "string" ? lexicalNode.tag : "h1";
            const styleAttr = buildBlockStyleAttr(lexicalNode);
            return `<${tag}${styleAttr}>${headingContent}</${tag}>`;
          }
          return "";
        }

        // Handle list nodes
        if (lexicalNode.type === "list") {
          if (Array.isArray(lexicalNode.children)) {
            const listItems = lexicalNode.children.map(extractFormattedTextFromNode).join("");
            const listTag = lexicalNode.listType === "bullet" ? "ul" : "ol";
            const styleAttr = buildBlockStyleAttr(lexicalNode);
            return `<${listTag}${styleAttr}>${listItems}</${listTag}>`;
          }
          return "";
        }

        // Handle list item nodes
        if (lexicalNode.type === "listitem") {
          if (Array.isArray(lexicalNode.children)) {
            const itemContent = lexicalNode.children.map(extractFormattedTextFromNode).join("");
            const styleAttr = buildBlockStyleAttr(lexicalNode);
            return `<li${styleAttr}>${itemContent}</li>`;
          }
          return "<li></li>";
        }

        // Handle quote nodes
        if (lexicalNode.type === "quote") {
          if (Array.isArray(lexicalNode.children)) {
            const quoteContent = lexicalNode.children.map(extractFormattedTextFromNode).join("");
            const styleAttr = buildBlockStyleAttr(lexicalNode);
            return `<blockquote${styleAttr}>${quoteContent}</blockquote>`;
          }
          return "<blockquote></blockquote>";
        }

        // Handle code nodes
        if (lexicalNode.type === "code") {
          if (Array.isArray(lexicalNode.children)) {
            const codeContent = lexicalNode.children.map(extractFormattedTextFromNode).join("");
            const styleAttr = buildBlockStyleAttr(lexicalNode);
            return `<pre${styleAttr}><code>${codeContent}</code></pre>`;
          }
          return "<pre><code></code></pre>";
        }

        // Handle line break nodes
        if (lexicalNode.type === "linebreak") {
          return "<br>";
        }

        // Handle link nodes
        if (lexicalNode.type === "link") {
          if (Array.isArray(lexicalNode.children)) {
            const linkContent = lexicalNode.children.map(extractFormattedTextFromNode).join("");
            const url =
              typeof lexicalNode.url === "string" && lexicalNode.url.length > 0
                ? lexicalNode.url
                : "#";
            const title =
              typeof lexicalNode.title === "string" && lexicalNode.title.length > 0
                ? ` title="${lexicalNode.title}"`
                : "";
            return `<a href="${url}"${title} target="_blank" rel="noopener noreferrer">${linkContent}</a>`;
          }
          return "";
        }

        // Recursively process children for other node types
        if (Array.isArray(lexicalNode.children)) {
          return lexicalNode.children.map(extractFormattedTextFromNode).join("");
        }

        return "";
      };

      if (editorState?.root?.children) {
        const htmlContent = editorState.root.children
          .map(extractFormattedTextFromNode)
          .filter(Boolean)
          .join("\n");

        return htmlContent || "<p></p>";
      }

      return "<p></p>";
    } catch (_error) {
      // Keep rendering resilient if conversion fails for malformed editor state.
      return "<p></p>";
    }
  };

  useEffect(() => {
    if (content) {
      setContentText(extractTextFromEditorState(content));
    }
  }, [content]);

  // Autosave disabled; saving happens only on explicit button actions.

  const [formErrors, setFormErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Search functionality
  const [availableAuthors, setAvailableAuthors] = useState<Author[]>(
    Array.isArray(authors) ? authors : [],
  );
  const [availableTagOptions, setAvailableTagOptions] = useState<Tag[]>(
    Array.isArray(tags) ? tags : [],
  );
  const [authorSearch, setAuthorSearch] = useState("");
  const [showAuthorResults, setShowAuthorResults] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isCreatingAuthor, setIsCreatingAuthor] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    setAvailableAuthors(Array.isArray(authors) ? authors : []);
  }, [authors]);

  useEffect(() => {
    setAvailableTagOptions(Array.isArray(tags) ? tags : []);
  }, [tags]);

  const normalize = (value: string) => value.trim().toLowerCase();
  const getAuthorFullName = (author: Author) => `${author.firstName || ''} ${author.lastName || ''}`.trim();
  const hasExactAuthorMatch = (author: Author, searchTerm: string) => {
    const term = normalize(searchTerm);
    if (!term) return false;

    return [
      getAuthorFullName(author),
      author.username || '',
      author.email || '',
    ].some((field) => normalize(field) === term);
  };

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object" &&
      (error as { response?: { data?: unknown } }).response?.data &&
      typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
    ) {
      return (error as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
    }

    return fallback;
  };

  const mapUserToAuthor = (user: unknown): Author => {
    const mappedUser = (typeof user === "object" && user !== null ? user : {}) as {
      _id?: string;
      name?: string;
      email?: string;
      isAdmin?: boolean;
    };
    const fullName = typeof mappedUser.name === "string" ? mappedUser.name.trim() : "";
    const parts = fullName.split(/\s+/).filter(Boolean);

    return {
      _id: mappedUser._id || "",
      firstName: parts[0] || "Unknown",
      lastName: parts.slice(1).join(" "),
      username: fullName || "Unknown",
      email: typeof mappedUser.email === "string" ? mappedUser.email : "",
      role: mappedUser.isAdmin ? "admin" : "writer",
      status: "active",
    };
  };

  // Filter authors based on search
  const filteredAuthors = useMemo(() => {
    if (!authorSearch.trim()) return [];

    const list = Array.isArray(availableAuthors) ? availableAuthors : [];
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
  }, [authorSearch, availableAuthors]);

  const handleRequestReview = async () => {
    if (!initialArticle?._id) return;
    try {
      setIsSubmitting(true);
      await apiClient.post(`/admin/articles/${initialArticle._id}/request-review`);
      setReviewStatus('in_review');
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminArticle(initialArticle._id) });
      toast.success("Review requested");
    } catch (_error) {
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
    } catch (_error) {
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
    } catch (_error) {
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminArticle(initialArticle._id) });
      toast.success("Article published");
    } catch (_error) {
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
    } catch (_error) {
      toast.error("Failed to unpublish");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canDeleteArticle = !!initialArticle?._id && (isAdmin || (isOwner && reviewStatus === "draft"));

  const handleDeleteArticle = async () => {
    if (!initialArticle?._id) return;
    try {
      setIsDeleting(true);
      await apiClient.delete(`/admin/articles/${initialArticle._id}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      navigate({ to: "/articles", replace: true });
    } catch (_error) {
      toast.error("Failed to delete article");
    } finally {
      setIsDeleting(false);
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
      const found = availableTagOptions.find(tag => tag._id === tagId);
      return found ? found.name : tagId;
    });
  }, [selectedTags, availableTagOptions]);

  // Transform data for frontend use
  const availableTags = useMemo(() => 
    availableTagOptions.map(tag => ({
      id: tag._id,
      name: tag.name
    })), [availableTagOptions]);

  const filteredTagOptions = useMemo(() => {
    const term = normalize(tagInput);
    return availableTags.filter((tag) => {
      if (selectedTags.includes(tag.id)) return false;
      if (!term) return true;
      return normalize(tag.name).includes(term);
    });
  }, [availableTags, selectedTags, tagInput]);

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

  const handleMediaPickerOpenChange = (open: boolean) => {
    setMediaPickerOpen(open);
  };

  const handleOpenMediaPickerFromIcon = () => {
    if (isLocked) return;
    setMediaPickerOpen(true);
  };

  const handlePrefetchMediaPicker = () => {
    if (isLocked) return;
    void queryClient.prefetchInfiniteQuery({
      queryKey: ["media-picker-images", MEDIA_PICKER_PAGE_SIZE, ""],
      queryFn: ({ pageParam }) =>
        getMediaImages({
          cursor: pageParam as string | undefined,
          limit: MEDIA_PICKER_PAGE_SIZE,
          q: "",
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: MediaImagesResponse) =>
        lastPage.pagination.hasMore ? (lastPage.pagination.nextCursor ?? undefined) : undefined,
      staleTime: MEDIA_PICKER_STALE_TIME_MS,
      gcTime: MEDIA_PICKER_GC_TIME_MS,
    });
  };

  const handleMediaPickerSelect = (url: string) => {
    setFeaturedMediaUrl(url);
    setMediaPreviewFailed(false);
    if (formErrors.featuredMedia) {
      clearFieldError("featuredMedia");
    }
    setMediaPickerOpen(false);
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

  const handleAuthorEnter = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const term = authorSearch.trim();
    if (!term || isLocked || !canManageAuthorsPerm || isCreatingAuthor) return;

    const exactMatch = availableAuthors.find((author) => hasExactAuthorMatch(author, term));
    if (exactMatch) {
      handleAuthorSelect(exactMatch);
      return;
    }

    if (filteredAuthors.length > 0) return;

    if (!isAdmin) {
      toast.error("Only admins can create new authors.");
      return;
    }

    try {
      setIsCreatingAuthor(true);
      const createdUser = await apiClient.post('/users', {
        name: term,
        isAdmin: false,
      });
      const createdAuthor = mapUserToAuthor(createdUser);
      if (!createdAuthor._id) {
        toast.error("Failed to create author.");
        return;
      }

      setAvailableAuthors((prev) =>
        prev.some((author) => author._id === createdAuthor._id) ? prev : [...prev, createdAuthor],
      );
      handleAuthorSelect(createdAuthor);

      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Author "${term}" created`);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Failed to create author.");
      toast.error(message);
    } finally {
      setIsCreatingAuthor(false);
    }
  };

  const handleAuthorRemove = (authorId: string) => {
    setSelectedAuthors(prev => prev.filter(a => a._id !== authorId));
  };

  // Tag selection functions
  const handleTagSelect = (tagId: string) => {
    setSelectedTags((prev) => {
      const next = prev.includes(tagId) ? prev : [...prev, tagId];
      if (formErrors.tags && next.length > 0) {
        clearFieldError("tags");
      }
      return next;
    });
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags((prev) => prev.filter(id => id !== tagId));
  };

  const handleTagEnter = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const term = tagInput.trim();
    if (!term || isLocked || isCreatingTag) return;

    const exactMatch = availableTagOptions.find((tag) => normalize(tag.name) === normalize(term));
    if (exactMatch) {
      handleTagSelect(exactMatch._id);
      setTagInput("");
      return;
    }

    if (!isAdmin) {
      toast.error("Only admins can create new tags.");
      return;
    }

    try {
      setIsCreatingTag(true);
      const createdTag = (await apiClient.post('/tags', { name: term })) as {
        _id?: string;
        name?: string;
        slug?: string;
      };
      const createdTagId = typeof createdTag?._id === "string" ? createdTag._id : "";

      if (!createdTagId) {
        toast.error("Failed to create tag.");
        return;
      }

      const mappedTag: Tag = {
        _id: createdTagId,
        name: typeof createdTag.name === "string" ? createdTag.name : term,
        slug: typeof createdTag.slug === "string" ? createdTag.slug : normalize(term).replace(/\s+/g, "-"),
        description: undefined,
        color: "#6366f1",
        isActive: true,
      };

      setAvailableTagOptions((prev) =>
        prev.some((tag) => tag._id === createdTagId) ? prev : [...prev, mappedTag],
      );
      handleTagSelect(createdTagId);
      setTagInput("");

      await queryClient.invalidateQueries({ queryKey: queryKeys.tags });
      toast.success(`Tag "${term}" created`);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Failed to create tag.");
      toast.error(message);
    } finally {
      setIsCreatingTag(false);
    }
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
        ...(imageCaption.trim() ? { imageCaption: imageCaption.trim() } : {}),
        ...(category ? { categoryId: category } : {}),
        ...(subcategory ? { subcategoryId: subcategory } : {}),
        ...(selectedTags.length ? { tagIds: selectedTags } : {}),
        // Only include authors if user has permission to manage them
        ...(canManageAuthorsPerm ? { 
          authors: selectedAuthors.filter((a) => !!a?._id).map((a) => a._id) 
        } : {}),
        ...(featuredMediaUrl.trim() ? { featuredMediaUrl: featuredMediaUrl.trim() } : {}),
        published: isPublished,
        allowComments,
        isFeatured: isPublished ? isFeatured : false,
        isSticky: isPublished ? isSticky : false,
      };

      await apiClient.put(`/admin/articles/${initialArticle._id}`, articleData);

      onLastSavedChange?.(new Date());

      await queryClient.invalidateQueries({ queryKey: queryKeys.adminArticle(initialArticle._id) });

      setSubmitMessage({ type: 'success', message: 'Changes saved.' });
    } catch (_error: unknown) {
      const msg = getApiErrorMessage(_error, 'Failed to save changes.');
      setSubmitMessage({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const htmlContent = content ? convertLexicalToHtml(content) : "<p></p>";

      const articleData = {
        title: title.trim(),
        content: htmlContent,
        editorState: content,
        ...(imageCaption.trim() ? { imageCaption: imageCaption.trim() } : {}),
        categoryId: category,
        ...(subcategory ? { subcategoryId: subcategory } : {}),
        ...(selectedTags.length ? { tagIds: selectedTags } : {}),
        ...(canManageAuthorsPerm
          ? { authors: selectedAuthors.filter((a) => !!a?._id).map((a) => a._id) }
          : {}),
        ...(featuredMediaUrl.trim() ? { featuredMediaUrl: featuredMediaUrl.trim() } : {}),
        published: isPublished,
        allowComments,
        isFeatured: isPublished ? isFeatured : false,
        isSticky: isPublished ? isSticky : false,
      };

      const created = await createAdminArticle(articleData);
      navigate({
        to: '/articles/$articleId/edit',
        params: { articleId: created._id },
        replace: true,
      });
    } catch (_error: unknown) {
      const msg = getApiErrorMessage(_error, 'Failed to create article.');
      setSubmitMessage({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndPublish = async () => {
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
        ...(imageCaption.trim() ? { imageCaption: imageCaption.trim() } : {}),
        categoryId: category,
        ...(subcategory ? { subcategoryId: subcategory } : {}),
        ...(selectedTags.length ? { tagIds: selectedTags } : {}),
        ...(canManageAuthorsPerm
          ? { authors: selectedAuthors.filter((a) => !!a?._id).map((a) => a._id) }
          : {}),
        ...(featuredMediaUrl.trim() ? { featuredMediaUrl: featuredMediaUrl.trim() } : {}),
        published: true,
        allowComments,
        reviewStatus: "published" as const,
        isFeatured,
        isSticky,
      };

      const created = await createAdminArticle(articleData);
      navigate({
        to: '/articles/$articleId/edit',
        params: { articleId: created._id },
        replace: true,
      });
    } catch (_error: unknown) {
      const msg = getApiErrorMessage(_error, 'Failed to publish article.');
      setSubmitMessage({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
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
            ? 'bg-green-100/80 border border-green-200 text-green-800' 
            : 'bg-red-100/80 border border-red-200 text-red-800'
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-6">
                {/* Featured Media */}
                <div className="space-y-2">
                  <Label className='gap-0'>Featured Media</Label>

                  <MediaDropZone
                    onUpload={(url) => {
                      setFeaturedMediaUrl(url);
                      setMediaPreviewFailed(false);
                      if (formErrors.featuredMedia) clearFieldError("featuredMedia");
                    }}
                    disabled={isLocked}
                  />

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted" />
                    </div>
                    <span className="relative bg-background px-2 text-xs text-muted-foreground">or</span>
                  </div>

                  <div className="relative">
                    <Input
                      id="featured-media"
                      value={featuredMediaUrl}
                      disabled={isLocked}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFeaturedMediaUrl(value);
                        setMediaPreviewFailed(false);
                        if (formErrors.featuredMedia && value.trim()) {
                          clearFieldError("featuredMedia");
                        }
                      }}
                      placeholder="Paste featured media URL"
                      className={cn(
                        "pr-11",
                        formErrors.featuredMedia && "border-destructive focus-visible:ring-destructive"
                      )}
                      aria-invalid={Boolean(formErrors.featuredMedia)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={handlePrefetchMediaPicker}
                      onFocus={handlePrefetchMediaPicker}
                      onClick={handleOpenMediaPickerFromIcon}
                      disabled={isLocked}
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                      aria-label="Open media picker"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formErrors.featuredMedia && (
                    <p className="text-xs text-destructive">{formErrors.featuredMedia}</p>
                  )}

                  <MediaPickerSheet
                    open={mediaPickerOpen}
                    onOpenChange={handleMediaPickerOpenChange}
                    onSelect={handleMediaPickerSelect}
                    disabled={isLocked}
                  />
                </div>
                
                {/* Image Caption */}
                <div className="space-y-2">
                  <Label htmlFor="image-caption" className='gap-0'>Image Caption</Label>
                  <Input
                    id="image-caption"
                    value={imageCaption}
                    disabled={isLocked}
                    onChange={(e) => {
                      const value = e.target.value;
                      setImageCaption(value);
                    }}
                    placeholder="Enter caption"
                    className="italic"
                  />
                </div>

                {/* Image preview */}
                <div className='space-y-2'>
                  <Button
                    type="button"
                    variant='link'
                    onClick={() => setHideImage((prev) => !prev)}
                    className="text-xs p-0 m-0 bg-transparent border-0 shadow-none hover:underline"
                  >
                    {hideImage ? "Show Preview" : "Hide Preview"}
                  </Button>

                  {!hideImage && <AspectRatio ratio={16 / 9} className="bg-muted/50 rounded-md overflow-hidden">
                    {featuredMediaPreviewUrl && !mediaPreviewFailed ? (
                      <img
                        src={featuredMediaPreviewUrl}
                        className="object-cover h-full w-full"
                        onError={() => setMediaPreviewFailed(true)}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Image className="w-6 h-6" />
                        <span className="ml-2">Featured media preview</span>
                      </div>
                    )}
                  </AspectRatio>}
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

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allow-comments"
                        checked={allowComments}
                        onCheckedChange={setAllowComments}
                      />
                      <Label htmlFor="allow-comments">
                        Allow comments
                      </Label>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {/* Save/Create button (hidden for non-admins when in review) */}
                  {(!isLocked || isAdmin) && (
                    <Button
                      type={initialArticle?._id ? "button" : "submit"}
                      onClick={initialArticle?._id ? handleSaveChanges : undefined}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : (initialArticle?._id ? "Save Changes" : "Create Draft")}
                    </Button>
                  )}

                  {/* Review & Publish Actions for EXISTING articles */}
                  {initialArticle?._id && (
                    <>
                      {canRequestReview && (
                        <AlertDialog open={reviewConfirmOpen} onOpenChange={setReviewConfirmOpen}>
                          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setReviewConfirmOpen(true)}>
                            Request Review
                          </Button>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Request review?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Once you request review, this article will be locked until an admin approves or requests changes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleRequestReview}>Request Review</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {canAdminPublishDraft && (
                        <Button type="button" variant="constructive" onClick={handleAdminPublish} disabled={isSubmitting}>
                          Publish Article
                        </Button>
                      )}

                      {isAdmin && reviewStatus === 'in_review' && (
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2" disabled={isSubmitting}>
                              Review Actions
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Admin Review</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {canRequestChanges && (
                              <DropdownMenuItem onClick={handleRequestChanges} disabled={isSubmitting} className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 dark:focus:bg-orange-950/50">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Request Changes
                              </DropdownMenuItem>
                            )}

                            {canApproveAndPublish && (
                              <DropdownMenuItem onClick={handleAdminPublish} disabled={isSubmitting} className="text-green-600 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-950/50">
                                <Check className="mr-2 h-4 w-4" />
                                Approve & Publish
                              </DropdownMenuItem>
                            )}

                            {canCancelReview && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleUnrequestReview} disabled={isSubmitting}>
                                  <X className="mr-2 h-4 w-4 text-muted-foreground" />
                                  Cancel Review Request
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {canUnpublish && (
                        <Button type="button" variant="destructive" onClick={handleAdminUnpublish} disabled={isSubmitting}>
                          Unpublish
                        </Button>
                      )}
                    </>
                  )}

                  {/* Create & Publish for NEW articles */}
                  {!initialArticle?._id && isAdmin && (
                    <Button type="button" variant="constructive" onClick={handleCreateAndPublish} disabled={isSubmitting}>
                      Publish Article
                    </Button>
                  )}

                </div>
              </div>

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
                          onKeyDown={handleAuthorEnter}
                          disabled={isCreatingAuthor}
                          placeholder="Search for authors by name, username, or email..."
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Search Results */}
                      {showAuthorResults && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                          {isCreatingAuthor ? (
                            <div className="p-3 text-muted-foreground text-center">
                              Creating author...
                            </div>
                          ) : filteredAuthors.length > 0 ? (
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
                              <p>No authors found</p>
                              {isAdmin && authorSearch.trim().length > 0 && (
                                <p className="text-xs mt-1">
                                  Press Enter to create "{authorSearch.trim()}"
                                </p>
                              )}
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

                {/* Tags Selection */}
                <div className='space-y-2'>
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
                    <div className="space-y-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagEnter}
                        disabled={isCreatingTag}
                        placeholder={
                          isAdmin
                            ? "Search tags or type a new one and press Enter..."
                            : "Search existing tags..."
                        }
                      />
                      {isAdmin &&
                        tagInput.trim().length > 0 &&
                        !availableTagOptions.some((tag) => normalize(tag.name) === normalize(tagInput)) && (
                          <p className="text-xs text-muted-foreground">
                            Press Enter to create "{tagInput.trim()}"
                          </p>
                        )}
                      <div className="flex flex-wrap gap-2">
                        {filteredTagOptions.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="cursor-pointer px-3 py-1 text-sm hover:bg-secondary"
                            onClick={() => handleTagSelect(tag.id)}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {isCreatingTag && (
                          <p className="text-muted-foreground text-sm">Creating tag...</p>
                        )}
                        {!isCreatingTag && filteredTagOptions.length === 0 && (
                          <p className="text-muted-foreground">
                            {tagInput.trim() ? "No matching tags" : "No tags available"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {canDeleteArticle && (
              <div className="pt-6 border-t border-border">
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                  <Button type="button" variant="destructive" disabled={isDeleting} onClick={() => setDeleteConfirmOpen(true)}>
                    {isDeleting ? "Deleting..." : "Delete Article"}
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this article?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The article and its content will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction className='bg-destructive text-white hover:bg-destructive/90' disabled={isDeleting} onClick={handleDeleteArticle}>
                        Delete Article
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
