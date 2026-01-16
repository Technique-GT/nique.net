import { useMemo, useState } from "react";
import { $getRoot } from "lexical";

import { Editor } from "@/components/blocks/editor-00/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

import { MediaPicker, type MediaItem } from "@/components/media/media-picker";
import mediaLibraryData from "@/data/media-library.json";
import { Category, SubCategory, Tag, Author, Collaborator, SerializedEditorState, FieldErrorKey } from "./types";
import ArticleSubmission from "./ArticleSubmission";


interface ArticleFormProps {
  categories: Category[];
  subcategories: SubCategory[];
  tags: Tag[];
  authors: Author[];
  collaborators: Collaborator[];
}

export default function ArticleForm({ categories, subcategories, tags, authors, collaborators }: ArticleFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<SerializedEditorState | undefined>();
  const [contentText, setContentText] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<Author[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<Collaborator[]>([]);
  const [featuredMediaId, setFeaturedMediaId] = useState<string>("");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<{
    title: string;
    content: string;
    category: string;
    subcategory: string;
    tags: string[];
    authors: string[];
    collaborators: string[];
    featuredMediaId: string;
    excerpt: string;
    isPublished: boolean;
    isFeatured: boolean;
    isSticky: boolean;
  } | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(0);
  
  // Search functionality
  const [authorSearch, setAuthorSearch] = useState("");
  const [showAuthorResults, setShowAuthorResults] = useState(false);
  const [collaboratorSearch, setCollaboratorSearch] = useState("");
  const [showCollaboratorResults, setShowCollaboratorResults] = useState(false);

  // Filter authors based on search
  const filteredAuthors = useMemo(() => {
    if (!authorSearch.trim()) return [];
    
    const searchTerm = authorSearch.toLowerCase();
    return authors.filter(author => 
      author.firstName.toLowerCase().includes(searchTerm) ||
      author.lastName.toLowerCase().includes(searchTerm) ||
      author.username.toLowerCase().includes(searchTerm) ||
      author.email.toLowerCase().includes(searchTerm)
    );
  }, [authorSearch, authors]);

  // Filter collaborators based on search
  const filteredCollaborators = useMemo(() => {
    if (!collaboratorSearch.trim()) return [];
    
    const searchTerm = collaboratorSearch.toLowerCase();
    return collaborators.filter(collaborator => 
      collaborator.name.toLowerCase().includes(searchTerm) ||
      collaborator.title.toLowerCase().includes(searchTerm) ||
      (collaborator.email && collaborator.email.toLowerCase().includes(searchTerm))
    );
  }, [collaboratorSearch, collaborators]);

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

  const mediaLibrary = useMemo(() => mediaLibraryData as MediaItem[], []);

  // Get subcategories for the selected category
  const availableSubcategories = useMemo(() => {
    if (!category) return [];
    
    return subcategories
      .filter(sub => sub.category._id === category && sub.isActive)
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

  const resetForm = () => {
    setTitle("");
    setContent(undefined);
    setContentText("");
    setExcerpt("");
    setCategory("");
    setSubcategory("");
    setSelectedTags([]);
    setSelectedAuthors([]);
    setSelectedCollaborators([]);
    setFeaturedMediaId("");
    setIsPublished(false);
    setIsFeatured(false);
    setIsSticky(false);
    setAuthorSearch("");
    setShowAuthorResults(false);
    setCollaboratorSearch("");
    setShowCollaboratorResults(false);
    setEditorResetKey((prev) => prev + 1);
    setFormErrors({});
    setPendingSubmission(null);
    setConfirmOpen(false);
    setSubmitMessage(null);
  };

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

  // Author search and selection functions
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

  // Collaborator search and selection functions
  const handleCollaboratorSearch = (searchTerm: string) => {
    setCollaboratorSearch(searchTerm);
    setShowCollaboratorResults(searchTerm.length > 0);
  };

  const handleCollaboratorSelect = (collaborator: Collaborator) => {
    if (!selectedCollaborators.find(c => c._id === collaborator._id)) {
      setSelectedCollaborators(prev => [...prev, collaborator]);
    }
    setCollaboratorSearch("");
    setShowCollaboratorResults(false);
  };

  const handleCollaboratorRemove = (collaboratorId: string) => {
    setSelectedCollaborators(prev => prev.filter(c => c._id !== collaboratorId));
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

  const getCollaboratorDisplayName = (collaborator: Collaborator) => {
    return `${collaborator.name} - ${collaborator.title}`;
  };

  const checkValidity = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Partial<Record<FieldErrorKey, string>> = {};

    if (!title.trim()) {
      errors.title = "Title is required.";
    }

    if (isContentEmpty) {
      errors.content = "Content is required.";
    }

    if (!featuredMediaId) {
      errors.featuredMedia = "Featured media is required.";
    }

    if (!excerpt.trim()) {
      errors.excerpt = "Caption is required.";
    }

    if (selectedAuthors.length === 0) {
      errors.authors = "At least one author must be selected.";
    }

    if (!category) {
      errors.category = "Category is required.";
    }

    if (selectedTags.length === 0) {
      errors.tags = "At least one tag must be selected.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Convert Lexical content to HTML using enhanced conversion
    let htmlContent = "";
    if (content) {
      htmlContent = convertLexicalToHtml(content);
      console.log('Generated HTML:', htmlContent); // For debugging
    }

    setPendingSubmission({
      title,
      content: htmlContent,
      category,
      subcategory,
      tags: selectedTags,
      authors: selectedAuthors.map(author => author._id),
      collaborators: selectedCollaborators.map(collaborator => collaborator._id),
      featuredMediaId,
      excerpt,
      isPublished,
      isFeatured: isPublished ? isFeatured : false,
      isSticky: isPublished ? isSticky : false,
    });
    setConfirmOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
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
        <CardHeader>
          <CardTitle>Create New Article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={checkValidity} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className='gap-0'><span className='text-destructive'>*</span>Title</Label>
              <Input
                id="title"
                value={title}
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
              <Label id="content-label" className='gap-0'><span className='text-destructive'>*</span>Content</Label>
              <div role="group" aria-labelledby="content-label">
                <Editor
                  key={editorResetKey}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Featured Media */}
              <div className="space-y-2">
                <Label htmlFor="featured-media" className='gap-0'><span className='text-destructive'>*</span>Featured Media</Label>
                <MediaPicker
                  value={featuredMediaId || undefined}
                  items={mediaLibrary}
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
                <Label htmlFor="excerpt" className='gap-0'><span className='text-destructive'>*</span>Caption</Label>
                <Input
                  id="excerpt"
                  value={excerpt}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-6">
                {/* Authors - Searchable Input */}
                <div className="space-y-2">
                  <Label htmlFor="authors" className='gap-0'><span className='text-destructive'>*</span>Authors</Label>
                  
                  {/* Selected Authors */}
                  <div className={cn(
                    "flex flex-wrap gap-2 p-2 border rounded-md min-h-10",
                    formErrors.authors && "border-destructive"
                  )}>
                    {selectedAuthors.map((author) => (
                      <Badge
                        key={author._id}
                        variant="secondary"
                        className="px-3 py-1 text-sm flex items-center gap-1"
                      >
                        {getAuthorDisplayName(author)}
                        <button
                          type="button"
                          onClick={() => handleAuthorRemove(author._id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
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
                </div>
                
                {/* Collaborators Section */}
                <div className="space-y-2">
                  <Label htmlFor="collaborators">Collaborators</Label>
                  
                  {/* Selected Collaborators */}
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
                    {selectedCollaborators.map((collaborator) => (
                      <Badge
                        key={collaborator._id}
                        variant="outline"
                        className="px-3 py-1 text-sm flex items-center gap-1"
                      >
                        {getCollaboratorDisplayName(collaborator)}
                        <button
                          type="button"
                          onClick={() => handleCollaboratorRemove(collaborator._id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedCollaborators.length === 0 && (
                      <span className="text-muted-foreground text-sm">No collaborators selected</span>
                    )}
                  </div>

                  {/* Collaborator Search */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={collaboratorSearch}
                        onChange={(e) => handleCollaboratorSearch(e.target.value)}
                        placeholder="Search for collaborators by name, title, or email..."
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Search Results */}
                    {showCollaboratorResults && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCollaborators.length > 0 ? (
                          filteredCollaborators.map((collaborator) => (
                            <div
                              key={collaborator._id}
                              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                              onClick={() => handleCollaboratorSelect(collaborator)}
                            >
                              <div className="font-medium">
                                {getCollaboratorDisplayName(collaborator)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {collaborator.email || "No email"} • {collaborator.status}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-muted-foreground text-center">
                            No collaborators found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Category & sub-category */}
                <div className="space-y-2 flex flex-row gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="category" className='gap-0'><span className='text-destructive'>*</span>Category</Label>
                    <Select
                      value={category}
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
                      disabled={!isSubcategoryRequired}
                    >
                      <SelectTrigger
                        className={cn(
                          formErrors.subcategory &&
                            "border-destructive focus:ring-destructive",
                          !isSubcategoryRequired && "text-muted-foreground"
                        )}
                        aria-invalid={Boolean(formErrors.subcategory)}
                        disabled={!isSubcategoryRequired}
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="publish"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                    <Label htmlFor="publish">Publish immediately</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={isFeatured}
                      onCheckedChange={setIsFeatured}
                      disabled={!isPublished}
                    />
                    <Label htmlFor="featured" className={!isPublished ? "text-muted-foreground" : ""}>
                      Featured article
                      {!isPublished && <span className="text-xs text-muted-foreground ml-1">(requires publishing)</span>}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sticky"
                      checked={isSticky}
                      onCheckedChange={setIsSticky}
                      disabled={!isPublished}
                    />
                    <Label htmlFor="sticky" className={!isPublished ? "text-muted-foreground" : ""}>
                      Sticky article (pinned to top)
                      {!isPublished && <span className="text-xs text-muted-foreground ml-1">(requires publishing)</span>}
                    </Label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Article"}
                  </Button>
                  <ArticleSubmission 
                    title={title}
                    content={content}
                    contentText={contentText}
                    excerpt={excerpt}
                    category={category}
                    subcategory={subcategory}
                    selectedTags={selectedTags}
                    selectedAuthors={selectedAuthors}
                    selectedCollaborators={selectedCollaborators}
                    featuredMediaId={featuredMediaId}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                    setSubmitMessage={setSubmitMessage}
                    resetForm={resetForm}
                    convertLexicalToHtml={convertLexicalToHtml}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className='gap-0'><span className='text-destructive'>*</span>Tags</Label>
                <div className={cn(
                  "flex flex-wrap gap-2 p-2 border rounded-md min-h-10",
                  formErrors.tags && "border-destructive"
                )}>
                  {selectedTagNames.map((tagName, index) => (
                    <Badge
                      key={selectedTags[index]}
                      variant="secondary"
                      className="px-3 py-1 text-sm cursor-pointer"
                      onClick={() => handleTagRemove(selectedTags[index])}
                    >
                      {tagName} ×
                    </Badge>
                  ))}
                  {selectedTags.length === 0 && (
                    <span className="text-muted-foreground text-sm">No tags selected</span>
                  )}
                </div>
                {formErrors.tags && (
                  <p className="text-xs text-destructive">{formErrors.tags}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter((tag) => !selectedTags.includes(tag.id))
                    .map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer px-3 py-1 text-sm"
                        onClick={() => handleTagSelect(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  {availableTags.length === 0 && (
                    <p className="text-muted-foreground">No tags available</p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <ArticleSubmission 
        title={title}
        content={content}
        contentText={contentText}
        excerpt={excerpt}
        category={category}
        subcategory={subcategory}
        selectedTags={selectedTags}
        selectedAuthors={selectedAuthors}
        selectedCollaborators={selectedCollaborators}
        featuredMediaId={featuredMediaId}
        isPublished={isPublished}
        isFeatured={isFeatured}
        isSticky={isSticky}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        setSubmitMessage={setSubmitMessage}
        resetForm={resetForm}
        convertLexicalToHtml={convertLexicalToHtml}
        confirmOpen={confirmOpen}
        setConfirmOpen={setConfirmOpen}
        pendingSubmission={pendingSubmission}
        setPendingSubmission={setPendingSubmission}
      />
    </div>
  );
}