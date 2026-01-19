import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import { useArticles } from "./useArticles";
import { ArticleTable } from "./ArticleTable";
import { ArticleDialogs } from "./ArticleDialogs";
import { Article } from "./article";
import { apiClient } from "@/lib/api-client";
import { useCreateArticleDraft, queryKeys } from "@/hooks/use-queries";
import { getAdminArticleById } from "@/services/articles";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ArticleList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createDraftMutation = useCreateArticleDraft();
  const { user: me } = useAuthStore((state) => state.auth);
  const isAdmin = !!me?.isAdmin;
  const currentUserId = me?.id || null;
  
  // Use custom hook for article state management
  const {
    articles,
    filteredArticles,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    hideDrafts,
    setHideDrafts,
    message,
    setMessage,
    availableCategories,
    categories,
    subcategories,
    tags,
    authors,
    fetchArticles,
    getAuthorName,
    pagination,
    currentPage,
    handlePageChange,
    mediaLibrary
  } = useArticles();

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);

  // Quick action states
  const [publishingArticle, setPublishingArticle] = useState<string | null>(null);
  const [featuringArticle, setFeaturingArticle] = useState<string | null>(null);
  const [stickingArticle, setStickingArticle] = useState<string | null>(null);

  // Add collaborators data
  const [collaborators, setCollaborators] = useState<any[]>([]);

  // Fetch collaborators
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const result = await apiClient.get('/collaborators');
        // apiClient unwraps data if success=true, returning array
        if (Array.isArray(result)) {
          setCollaborators(result);
        }
      } catch (error) {
        console.error('Error fetching collaborators:', error);
      }
    };
    fetchCollaborators();
  }, []);

  // Quick action handlers
  const handleQuickPublish = async (article: Article) => {
    if (!isAdmin) {
      toast.error('Only admins can publish/unpublish');
      return;
    }

    setPublishingArticle(article._id);
    try {
      const newIsPublished = !article.isPublished;
      
      const result: any = await apiClient.patch(`/admin/articles/${article._id}/status`, {
        status: newIsPublished ? 'published' : 'draft',
        isFeatured: newIsPublished ? article.isFeatured : false,
        isSticky: newIsPublished ? article.isSticky : false,
      });

      // result is { success: true, message: ... } because it has no data?
      // Actually updateArticleStatus return { success: true, message: ..., data: article }?
      // Check backend: updateArticleStatus returns { success: true, message, data }
      // So apiClient returns data (article object).
      // So checking result.success will fail.
      
      // Wait, let's just check if it returns an object or success.
      // If unwrapped, it's the article object.
      // If it failed, it threw error or returned something else.
      
      if (result && (result._id || result.success)) {
        setMessage({ 
          type: 'success', 
          text: `Article ${newIsPublished ? 'published' : 'unpublished'} successfully!` 
        });
        fetchArticles();
      } else {
        setMessage({ type: 'error', text: result?.message || 'Failed to update article status' });
      }
    } catch (error) {
      console.error('Error updating article status:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPublishingArticle(null);
    }
  };

  const handleQuickFeature = async (article: Article) => {
    if (!isAdmin) {
      toast.error('Only admins can feature/unfeature');
      return;
    }

    if (article.status !== 'published') {
      setMessage({ type: 'error', text: 'Only published articles can be featured' });
      return;
    }

    setFeaturingArticle(article._id);
    try {
      const result: any = await apiClient.patch(`/admin/articles/${article._id}/featured`);

      // toggleFeatured returns { success: true, message, data: article }
      if (result && (result._id || result.success)) {
        setMessage({ 
          type: 'success', 
          text: `Article ${!article.isFeatured ? 'featured' : 'unfeatured'} successfully!` 
        });
        fetchArticles();
      } else {
        setMessage({ type: 'error', text: result?.message || 'Failed to update featured status' });
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setFeaturingArticle(null);
    }
  };

  const handleQuickSticky = async (article: Article) => {
    if (!isAdmin) {
      toast.error('Only admins can pin/unpin');
      return;
    }

    if (article.status !== 'published') {
      setMessage({ type: 'error', text: 'Only published articles can be pinned' });
      return;
    }

    setStickingArticle(article._id);
    try {
      const result: any = await apiClient.patch(`/admin/articles/${article._id}/sticky`);

      // toggleSticky returns { success: true, message, data: article }
      if (result && (result._id || result.success)) {
        setMessage({ 
          type: 'success', 
          text: `Article ${!article.isSticky ? 'pinned' : 'unpinned'} successfully!` 
        });
        fetchArticles();
      } else {
        setMessage({ type: 'error', text: result?.message || 'Failed to update sticky status' });
      }
    } catch (error) {
      console.error('Error updating sticky status:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setStickingArticle(null);
    }
  };

  // Edit handlers - PREFETCH DATA THEN NAVIGATE TO EDIT PAGE
  const handleEdit = async (article: Article) => {
    // Prefetch the article data before navigating to avoid loading flicker
    await queryClient.prefetchQuery({
      queryKey: queryKeys.adminArticle(article._id),
      queryFn: () => getAdminArticleById(article._id),
    });
    
    navigate({ 
      to: '/articles/$articleId/edit' as any, 
      params: { articleId: article._id } as any 
    });
  };

  // Delete handlers
  const handleDelete = (article: Article) => {
    setCurrentArticle(article);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentArticle) return;

    try {
      const result: any = await apiClient.delete(`/admin/articles/${currentArticle._id}`);
      
      // deleteArticle returns { success: true, message: ... }
      if (result && result.success) {
        setMessage({ type: 'success', text: 'Article deleted successfully!' });
        fetchArticles();
        setDeleteDialogOpen(false);
        setCurrentArticle(null);
      } else {
        setMessage({ type: 'error', text: result?.message || 'Failed to delete article' });
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  // Navigation
  const handleNewArticle = async () => {
    try {
      const draft = await createDraftMutation.mutateAsync();
      navigate({ 
        to: '/articles/$articleId/edit' as any, 
        params: { articleId: draft._id } as any
      });
      // toast.success("Draft created successfully");
    } catch (error) {
      console.error('Failed to create draft:', error);
      toast.error("Failed to create draft");
    }
  };

  // Helper functions
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "published": return "default";
      case "draft": return "secondary";
      case "in_review": return "outline"; // Should probably be visually distinct in badge impl
      case "changes_requested": return "destructive";
      default: return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Main>
      {/* Message Display */}
      {message && (
          <div className={`mb-4 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <PageHeader
          title="Article Library"
          description="Browse, search, and manage your content collection"
          badge={
            !isAdmin ? (
              <Badge variant="destructive" className="text-xs">
                Limited edit access
              </Badge>
            ) : null
          }
          actions={
            <>
              <Button onClick={handleNewArticle}>
                <Plus className="w-4 h-4 mr-2" />
                New Article
              </Button>
            </>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Articles</CardTitle>
            <CardDescription>
              Browse and filter your content library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.map(category => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hide-drafts" 
                    checked={hideDrafts} 
                    onCheckedChange={(checked) => setHideDrafts(checked as boolean)} 
                  />
                  <Label htmlFor="hide-drafts">Hide Drafts</Label>
                </div>
              </div>
            </div>

              <ArticleTable
                articles={articles}
                filteredArticles={filteredArticles}
                loading={loading}
                getAuthorName={getAuthorName}
                getStatusVariant={getStatusVariant}
                formatDate={formatDate}
                publishingArticle={publishingArticle}
                featuringArticle={featuringArticle}
                stickingArticle={stickingArticle}
                onQuickPublish={handleQuickPublish}
                onQuickFeature={handleQuickFeature}
                onQuickSticky={handleQuickSticky}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onNewArticle={handleNewArticle}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
              />


            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center px-4 text-sm font-medium">
                  Page {currentPage} of {pagination.pages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      <ArticleDialogs
        // Other dialogs
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        currentArticle={currentArticle}
        
        // Data
        categories={categories}
        subcategories={subcategories}
        tags={tags}
        authors={authors}
        collaborators={collaborators}
        mediaLibrary={mediaLibrary}
        
        // Functions
        getAuthorName={getAuthorName}
        getStatusVariant={getStatusVariant}
        formatDate={formatDate}
        confirmDelete={confirmDelete}
      />
    </Main>
  );
}
