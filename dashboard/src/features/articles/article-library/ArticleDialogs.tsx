import { Article, PopulatedAuthor, PopulatedCategory, PopulatedSubCategory, PopulatedTag } from "./article";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ArticleDialogsProps {
  // Other dialogs
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  viewDialogOpen: boolean;
  setViewDialogOpen: (open: boolean) => void;
  currentArticle: Article | null;
  
  // Data
  categories: PopulatedCategory[];
  subcategories: PopulatedSubCategory[];
  tags: PopulatedTag[];
  authors: PopulatedAuthor[];
  collaborators: any[];
  mediaLibrary: any[];
  
  // Functions
  getAuthorName: (author: PopulatedAuthor) => string;
  getStatusVariant: (status: string) => "default" | "secondary" | "outline" | "destructive";
  formatDate: (dateString: string) => string;
  confirmDelete: () => void;
}

export function ArticleDialogs({
  currentArticle,
  deleteDialogOpen,
  setDeleteDialogOpen,
  viewDialogOpen,
  setViewDialogOpen,
  getAuthorName,
  getStatusVariant,
  formatDate,
  confirmDelete,
}: ArticleDialogsProps) {
  
  return (
    <>
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
                  <div className="flex flex-col gap-1 items-start">
                    <Badge variant={getStatusVariant(currentArticle.reviewStatus || currentArticle.status)}>
                      {currentArticle.reviewStatus || currentArticle.status}
                    </Badge>
                     {currentArticle.hasPendingChanges && currentArticle.reviewStatus === 'published' && (
                        <Badge variant="outline" className="text-[10px] border-orange-200 bg-orange-50 text-orange-700">
                          Pending Changes
                        </Badge>
                      )}
                  </div>
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