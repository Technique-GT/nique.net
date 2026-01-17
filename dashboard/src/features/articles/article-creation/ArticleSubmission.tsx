import { Button } from "@/components/ui/button";
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
import { Author, Collaborator, SerializedEditorState } from "./types";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface ArticleSubmissionProps {
  title: string;
  content: SerializedEditorState | undefined;
  contentText: string;
  excerpt: string;
  category: string;
  subcategory: string;
  selectedTags: string[];
  selectedAuthors: Author[];
  selectedCollaborators: Collaborator[];
  featuredMediaId: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  isSticky?: boolean;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  setSubmitMessage: (message: { type: 'success' | 'error', message: string } | null) => void;
  resetForm: () => void;
  convertLexicalToHtml: (editorState: SerializedEditorState) => string;
  confirmOpen?: boolean;
  setConfirmOpen?: (open: boolean) => void;
  pendingSubmission?: {
    title: string;
    content: string;
    categoryId: string;
    subcategoryId: string;
    tagIds: string[];
    authors: string[];
    featuredMediaId: string;
    imageCaption: string;
    published: boolean;
    isFeatured: boolean;
    isSticky: boolean;
  } | null;
  setPendingSubmission?: (submission: any) => void;
}

export default function ArticleSubmission({
  title,
  content,
  contentText,
  excerpt,
  category,
  subcategory,
  selectedTags,
  selectedAuthors,
  selectedCollaborators,
  featuredMediaId,
  isSubmitting,
  setIsSubmitting,
  setSubmitMessage,
  resetForm,
  convertLexicalToHtml,
  confirmOpen = false,
  setConfirmOpen = () => {},
  pendingSubmission = null,
  setPendingSubmission = () => {},
}: ArticleSubmissionProps) {

  const handleSaveDraft = async () => {
    // Validate required fields for draft
    if (!title.trim() || contentText.trim().length === 0 || !category || !featuredMediaId) {
      setSubmitMessage({
        type: 'error',
        message: "Title, content, category, and featured media are required even for drafts."
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Convert Lexical content to HTML
      let htmlContent = "";
      if (content) {
        htmlContent = convertLexicalToHtml(content);
      }

      const articleData: any = {
        title,
        content: htmlContent,
        imageCaption: excerpt,
        categoryId: category,
        tagIds: selectedTags,
        authors: selectedAuthors.map(author => author._id),
        featuredMediaId: featuredMediaId,
        published: false,
        isSticky: false,
        isFeatured: false,
        allowComments: true,
      };

      // Add subcategory if selected
      if (subcategory) {
        articleData.subcategoryId = subcategory;
      }

      const result: any = await apiClient.post('/articles', articleData);

      if (result && (result._id || result.success)) {
        setSubmitMessage({
          type: 'success',
          message: `Draft "${title}" has been saved successfully!`
        });
        toast.success(`Draft "${title}" saved`);
        resetForm();
      } else {
        setSubmitMessage({
          type: 'error',
          message: result?.message || "Failed to save draft. Please try again."
        });
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);
      setSubmitMessage({
        type: 'error',
        message: "Network error. Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOnConfirm = async () => {
    if (!pendingSubmission) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Prepare the article data with proper formatting
      const articleData: any = {
        title: pendingSubmission.title,
        content: pendingSubmission.content,
        imageCaption: pendingSubmission.imageCaption,
        categoryId: pendingSubmission.categoryId,
        tagIds: pendingSubmission.tagIds,
        authors: pendingSubmission.authors,
        featuredMediaId: pendingSubmission.featuredMediaId,
        published: pendingSubmission.published,
        isSticky: pendingSubmission.isSticky,
        isFeatured: pendingSubmission.isFeatured,
        allowComments: true,
      };

      // Add subcategory if selected
      if (pendingSubmission.subcategoryId) {
        articleData.subcategoryId = pendingSubmission.subcategoryId;
      }

      const result: any = await apiClient.post('/articles', articleData);

      if (result && (result._id || result.success)) {
        setSubmitMessage({
          type: 'success',
          message: `Article "${pendingSubmission.title}" has been ${pendingSubmission.published ? 'published' : 'saved as draft'} successfully!`
        });
        toast.success(`Article ${pendingSubmission.published ? 'published' : 'saved'}`);
        resetForm();
      } else {
        setSubmitMessage({
          type: 'error',
          message: result?.message || "Failed to create article. Please try again."
        });
      }
    } catch (error: any) {
      console.error('Error creating article:', error);
      setSubmitMessage({
        type: 'error',
        message: "Network error. Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
      setPendingSubmission(null);
      setConfirmOpen(false);
    }
  };

  // If only save draft functionality is needed (button only)
  if (!confirmOpen) {
    return (
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleSaveDraft}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save Draft"}
      </Button>
    );
  }

  // If full submission dialog is needed
  return (
    <AlertDialog
      open={confirmOpen}
      onOpenChange={(open) => {
        setConfirmOpen(open)
        if (!open) {
          setPendingSubmission(null)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit this article?</AlertDialogTitle>
          <AlertDialogDescription>
            Once confirmed, the article will be {pendingSubmission?.published ? 'published immediately' : 'saved as draft'}.
            {pendingSubmission?.isFeatured && " It will be featured."}
            {pendingSubmission?.isSticky && " It will be pinned to the top."}
            {pendingSubmission?.subcategoryId && " It will be assigned to the selected sub-category."}
            {selectedCollaborators && selectedCollaborators.length > 0 && ` It will have ${selectedCollaborators.length} collaborator(s).`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingSubmission(null)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSubmitOnConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Confirm submission"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
