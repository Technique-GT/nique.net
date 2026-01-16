import { useMemo } from "react";
import { Article, PopulatedCategory, PopulatedSubCategory, PopulatedTag, PopulatedAuthor } from "./article";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, X } from "lucide-react";

interface ArticleDialogsProps {
  // Edit Dialog
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  currentArticle: Article | null;
  
  // Form fields that actually exist in schema
  editTitle: string;
  setEditTitle: (title: string) => void;
  editContent: string;
  setEditContent: (content: string) => void;
  editExcerpt: string;
  setEditExcerpt: (excerpt: string) => void;
  editCategory: string;
  setEditCategory: (category: string) => void;
  editSubcategory: string;
  setEditSubcategory: (subcategory: string) => void;
  editSelectedTags: string[];
  editSelectedAuthors: PopulatedAuthor[];
  editSelectedCollaborators: string[];
  editFeaturedMediaAlt: string;
  setEditFeaturedMediaAlt: (alt: string) => void;
  editIsPublished: boolean;
  setEditIsPublished: (published: boolean) => void;
  editIsFeatured: boolean;
  setEditIsFeatured: (featured: boolean) => void;
  editIsSticky: boolean;
  setEditIsSticky: (sticky: boolean) => void;
  editAllowComments: boolean;
  setEditAllowComments: (allow: boolean) => void;
  editSlug: string;
  setEditSlug: (slug: string) => void;
  
  // Search state
  editAuthorSearch: string;
  setEditAuthorSearch: (search: string) => void;
  showAuthorResults: boolean;
  setShowAuthorResults: (show: boolean) => void;
  
  // Other dialogs
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  viewDialogOpen: boolean;
  setViewDialogOpen: (open: boolean) => void;
  
  // Data
  categories: PopulatedCategory[];
  subcategories: PopulatedSubCategory[];
  tags: PopulatedTag[];
  authors: PopulatedAuthor[];
  collaborators: any[];
  
  // Functions
  getAuthorName: (author: PopulatedAuthor) => string;
  getStatusVariant: (status: string) => "default" | "secondary" | "outline";
  formatDate: (dateString: string) => string;
  handleSaveEdit: () => void;
  confirmDelete: () => void;
  resetEditForm: () => void;
  handleAuthorSearch: (searchTerm: string) => void;
  handleAuthorSelect: (author: PopulatedAuthor) => void;
  handleAuthorRemove: (authorId: string) => void;
  handleTagSelect: (tagId: string) => void;
  handleTagRemove: (tagId: string) => void;
  handleCollaboratorSelect: (collaboratorId: string) => void;
  handleCollaboratorRemove: (collaboratorId: string) => void;
  isEditLoading: boolean;
}

export function ArticleDialogs({
  editDialogOpen,
  setEditDialogOpen,
  currentArticle,
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,
  editExcerpt,
  setEditExcerpt,
  editCategory,
  setEditCategory,
  editSubcategory,
  setEditSubcategory,
  editSelectedTags,
  editSelectedAuthors,
  editSelectedCollaborators,
  editFeaturedMediaAlt,
  setEditFeaturedMediaAlt,
  editIsPublished,
  setEditIsPublished,
  editIsFeatured,
  setEditIsFeatured,
  editIsSticky,
  setEditIsSticky,
  editAllowComments,
  setEditAllowComments,
  editSlug,
  setEditSlug,
  editAuthorSearch,
  showAuthorResults,
  setShowAuthorResults,
  deleteDialogOpen,
  setDeleteDialogOpen,
  viewDialogOpen,
  setViewDialogOpen,
  categories,
  subcategories,
  tags,
  authors,
  collaborators,
  getAuthorName,
  getStatusVariant,
  formatDate,
  handleSaveEdit,
  confirmDelete,
  resetEditForm,
  handleAuthorSearch,
  handleAuthorSelect,
  handleAuthorRemove,
  handleTagSelect,
  handleTagRemove,
  handleCollaboratorSelect,
  handleCollaboratorRemove,
  isEditLoading,
}: ArticleDialogsProps) {
  
  const filteredAuthors = useMemo(() => {
    if (!editAuthorSearch.trim()) return [];
    
    const searchTerm = editAuthorSearch.toLowerCase();
    return authors.filter(author => 
      author.firstName.toLowerCase().includes(searchTerm) ||
      author.lastName.toLowerCase().includes(searchTerm) ||
      author.username.toLowerCase().includes(searchTerm) ||
      author.email.toLowerCase().includes(searchTerm)
    );
  }, [editAuthorSearch, authors]);

  const availableSubcategories = useMemo(() => {
    if (!editCategory) return [];
    
    return subcategories
      .filter(sub => {
        const categoryId = typeof sub.category === 'object' ? sub.category._id : sub.category;
        return categoryId === editCategory;
      })
      .map(sub => ({
        id: sub._id,
        name: sub.name,
        slug: sub.slug
      }));
  }, [editCategory, subcategories]);

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

  const availableCollaborators = useMemo(() => 
    collaborators.map(collab => ({
      id: collab._id,
      name: collab.name || `${collab.firstName} ${collab.lastName}`,
      title: collab.title || collab.role
    })), [collaborators]);

  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {currentArticle ? `Edit Article: ${currentArticle.title}` : 'Edit Article'}
            </DialogTitle>
            <DialogDescription>
              Update the article information. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter article title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-slug">Slug *</Label>
                  <Input
                    id="edit-slug"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    placeholder="Enter URL slug"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-excerpt">Excerpt *</Label>
                  <Textarea
                    id="edit-excerpt"
                    value={editExcerpt}
                    onChange={(e) => setEditExcerpt(e.target.value)}
                    placeholder="Enter brief excerpt"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-content">Content *</Label>
                  <Textarea
                    id="edit-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Enter article content (HTML supported)"
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Categories & Tags */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-lg">Categories & Tags</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesData.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-subcategory">Sub-category</Label>
                  <Select
                    value={editSubcategory}
                    onValueChange={setEditSubcategory}
                    disabled={availableSubcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={availableSubcategories.length === 0 ? "No sub-categories available" : "Select sub-category"} 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-12">
                  {editSelectedTags.map((tagId) => {
                    const tag = availableTags.find(t => t.id === tagId);
                    return (
                      <Badge
                        key={tagId}
                        variant="secondary"
                        className="px-3 py-1 text-sm flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleTagRemove(tagId)}
                      >
                        {tag?.name}
                        <X className="w-3 h-3" />
                      </Badge>
                    );
                  })}
                  {editSelectedTags.length === 0 && (
                    <span className="text-muted-foreground text-sm">No tags selected</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter((tag) => !editSelectedTags.includes(tag.id))
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
                </div>
              </div>
            </div>

            {/* People */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-lg">People</h3>
              
              {/* Authors */}
              <div className="space-y-2">
                <Label>Authors *</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-12">
                  {editSelectedAuthors.map((author) => (
                    <Badge
                      key={author._id}
                      variant="secondary"
                      className="px-3 py-1 text-sm flex items-center gap-1"
                    >
                      {getAuthorName(author)}
                      <button
                        type="button"
                        onClick={() => handleAuthorRemove(author._id)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {editSelectedAuthors.length === 0 && (
                    <span className="text-muted-foreground text-sm">No authors selected</span>
                  )}
                </div>

                {/* Author Search */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={editAuthorSearch}
                      onChange={(e) => handleAuthorSearch(e.target.value)}
                      placeholder="Search for authors by name, username, or email..."
                      className="pl-10"
                      onFocus={() => setShowAuthorResults(true)}
                    />
                  </div>
                  
                  {/* Search Results */}
                  {showAuthorResults && filteredAuthors.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredAuthors.map((author) => (
                        <div
                          key={author._id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handleAuthorSelect(author)}
                        >
                          <div className="font-medium">
                            {getAuthorName(author)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {author.username} • {author.email} • {author.role}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Collaborators */}
              <div className="space-y-2">
                <Label>Collaborators</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-12">
                  {editSelectedCollaborators.map((collabId) => {
                    const collaborator = availableCollaborators.find(c => c.id === collabId);
                    return (
                      <Badge
                        key={collabId}
                        variant="outline"
                        className="px-3 py-1 text-sm flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleCollaboratorRemove(collabId)}
                      >
                        {collaborator?.name}
                        <X className="w-3 h-3" />
                      </Badge>
                    );
                  })}
                  {editSelectedCollaborators.length === 0 && (
                    <span className="text-muted-foreground text-sm">No collaborators selected</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableCollaborators
                    .filter((collab) => !editSelectedCollaborators.includes(collab.id))
                    .map((collab) => (
                      <Badge
                        key={collab.id}
                        variant="outline"
                        className="cursor-pointer px-3 py-1 text-sm hover:bg-secondary"
                        onClick={() => handleCollaboratorSelect(collab.id)}
                      >
                        {collab.name} {collab.title && `(${collab.title})`}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            {/* Media & Settings */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-lg">Media & Settings</h3>
              
              <div className="space-y-4">
                {/* Featured Media */}
                <div className="space-y-2">
                  <Label htmlFor="edit-featured-media-alt">Featured Media Alt Text</Label>
                  <Input
                    id="edit-featured-media-alt"
                    value={editFeaturedMediaAlt}
                    onChange={(e) => setEditFeaturedMediaAlt(e.target.value)}
                    placeholder="Enter alt text for featured image"
                  />
                </div>

                {/* Publication Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-publish"
                      checked={editIsPublished}
                      onCheckedChange={setEditIsPublished}
                    />
                    <Label htmlFor="edit-publish" className="font-medium">Published</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-featured"
                      checked={editIsFeatured}
                      onCheckedChange={setEditIsFeatured}
                    />
                    <Label htmlFor="edit-featured" className="font-medium">
                      Featured article
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-sticky"
                      checked={editIsSticky}
                      onCheckedChange={setEditIsSticky}
                    />
                    <Label htmlFor="edit-sticky" className="font-medium">
                      Sticky article
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-allow-comments"
                      checked={editAllowComments}
                      onCheckedChange={setEditAllowComments}
                    />
                    <Label htmlFor="edit-allow-comments" className="font-medium">
                      Allow comments
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              resetEditForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isEditLoading}>
              {isEditLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article
              "{currentArticle?.title}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentArticle?.title}</DialogTitle>
            <DialogDescription>
              Article details and statistics
            </DialogDescription>
          </DialogHeader>
          {currentArticle && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Authors</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentArticle.authors.map((author) => (
                      <Badge key={author._id} variant="secondary">
                        {getAuthorName(author)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p>{currentArticle.category?.name || 'Unknown'}</p>
                </div>
              </div>
              {currentArticle.subcategory && (
                <div>
                  <Label className="text-muted-foreground">Subcategory</Label>
                  <p>{currentArticle.subcategory.name}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={getStatusVariant(currentArticle.status)}>
                    {currentArticle.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{formatDate(currentArticle.createdAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Views</Label>
                  <p>{currentArticle.views}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentArticle.tags.map((tag) => (
                      <Badge key={tag._id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Excerpt</Label>
                <p className="mt-1 text-sm">{currentArticle.excerpt}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Featured</Label>
                  <p>{currentArticle.isFeatured ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sticky</Label>
                  <p>{currentArticle.isSticky ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Allow Comments</Label>
                  <p>{currentArticle.allowComments ? 'Yes' : 'No'}</p>
                </div>
                {currentArticle.publishedAt && (
                  <div>
                    <Label className="text-muted-foreground">Published At</Label>
                    <p>{formatDate(currentArticle.publishedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}