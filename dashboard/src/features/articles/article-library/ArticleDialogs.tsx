import { Article, PopulatedAuthor, PopulatedCategory, PopulatedSubCategory, PopulatedTag } from "./article";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ArticleDialogsProps {
  // Other dialogs
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  currentArticle: Article | null;
  
  // Data
  categories: PopulatedCategory[];
  subcategories: PopulatedSubCategory[];
  tags: PopulatedTag[];
  authors: PopulatedAuthor[];
  
  // Functions
  getAuthorName: (author: PopulatedAuthor) => string;
  getStatusVariant: (status: string) => "default" | "secondary" | "outline" | "destructive" | "success" | "info" | "warning";
  formatDate: (dateString: string) => string;
  confirmDelete: () => void;
}

export function ArticleDialogs({
  currentArticle,
  deleteDialogOpen,
  setDeleteDialogOpen,
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
    </>
  );
}
