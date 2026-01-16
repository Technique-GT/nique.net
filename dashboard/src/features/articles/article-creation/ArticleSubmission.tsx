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

import { API_BASE_URL } from '../../../config';

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
        excerpt,
        category,
        tags: selectedTags,
        authors: selectedAuthors.map(author => author._id),
        collaborators: selectedCollaborators.map(collaborator => collaborator._id),
        featuredImage: featuredMediaId,
        status: 'draft',
        isSticky: false,
        isFeatured: false,
        allowComments: true,
      };

      // Add subcategory if selected
      if (subcategory) {
        articleData.subcategory = subcategory;
      }

      console.log('Saving draft data:', articleData);

      const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage({
          type: 'success',
          message: `Draft "${title}" has been saved successfully!`
        });

        resetForm();
      } else {
        console.error('Backend error:', result);
        setSubmitMessage({
          type: 'error',
          message: result.message || result.errors?.join(', ') || "Failed to save draft. Please try again."
        });
      }
    } catch (error: unknown) {
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
        excerpt: pendingSubmission.excerpt,
        category: pendingSubmission.category,
        tags: pendingSubmission.tags,
        authors: pendingSubmission.authors,
        collaborators: pendingSubmission.collaborators,
        featuredImage: pendingSubmission.featuredMediaId,
        status: pendingSubmission.isPublished ? 'published' : 'draft',
        isSticky: pendingSubmission.isSticky,
        isFeatured: pendingSubmission.isFeatured,
        allowComments: true,
      };

      // Add subcategory if selected
      if (pendingSubmission.subcategory) {
        articleData.subcategory = pendingSubmission.subcategory;
      }

      console.log('Submitting article data:', articleData);

      const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage({
          type: 'success',
          message: `Article "${pendingSubmission.title}" has been ${pendingSubmission.isPublished ? 'published' : 'saved as draft'} successfully!`
        });

        resetForm();
      } else {
        console.error('Backend error:', result);
        setSubmitMessage({
          type: 'error',
          message: result.message || result.errors?.join(', ') || "Failed to create article. Please try again."
        });
      }
    } catch (error: unknown) {
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
            Once confirmed, the article will be {pendingSubmission?.isPublished ? 'published immediately' : 'saved as draft'}.
            {pendingSubmission?.isFeatured && " It will be featured."}
            {pendingSubmission?.isSticky && " It will be pinned to the top."}
            {pendingSubmission?.subcategory && " It will be assigned to the selected sub-category."}
            {pendingSubmission?.collaborators && pendingSubmission.collaborators.length > 0 && ` It will have ${pendingSubmission.collaborators.length} collaborator(s).`}
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
