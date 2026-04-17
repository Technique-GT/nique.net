import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import { useArticles } from "./useArticles";
import { ArticleTable } from "./ArticleTable";
import { ArticleDialogs } from "./ArticleDialogs";
import { Article } from "./article";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/hooks/use-queries";
import { getAdminArticleById } from "@/services/articles";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function ArticleList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    subcategoryFilter,
    setSubcategoryFilter,
    showFeatured,
    setShowFeatured,
    showSticky,
    setShowSticky,
    hideDrafts,
    setHideDrafts,
    message,
    setMessage,
    availableCategories,
    availableSubcategories,
    categories,
    subcategories,
    tags,
    authors,
    fetchArticles,
    getAuthorName,
    pagination,
    currentPage,
    handlePageChange,
    pageSize,
    handlePageSizeChange
  } = useArticles();

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);

  // Quick action states
  const [publishingArticle, setPublishingArticle] = useState<string | null>(null);
  const [featuringArticle, setFeaturingArticle] = useState<string | null>(null);
  const [stickingArticle, setStickingArticle] = useState<string | null>(null);

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
      setMessage({ type: 'error', text: 'Network error. Please try again. ' + (error as Error).message });
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
    navigate({ to: '/articles/new' as any });
  };

  // Helper functions
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "published": return "success";
      case "draft": return "secondary";
      case "in_review": return "info";
      case "changes_requested": return "warning";
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

  useEffect(() => {
    if (!message) return;

    if (message.type === 'success') {
      toast.success(message.text);
    } else {
      toast.error(message.text);
    }

    setMessage(null);
  }, [message, setMessage]);

  return (
    <Main>
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
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="changes_requested">Changes Requested</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Filter */}
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

                {/* Subcategory Filter */}
                <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {availableSubcategories.map(subcategory => (
                      <SelectItem key={subcategory._id} value={subcategory._id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Featured Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-featured" 
                    checked={showFeatured} 
                    onCheckedChange={(checked) => setShowFeatured(Boolean(checked))}
                  />
                  <Label htmlFor="show-featured">Featured</Label>
                </div>

                {/* Sticky Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-sticky" 
                    checked={showSticky} 
                    onCheckedChange={(checked) => setShowSticky(Boolean(checked))}
                  />
                  <Label htmlFor="show-sticky">Sticky</Label>
                </div>

                {/* Draft Filter */}
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


            {pagination && pagination.pages > 0 && (
              <div className="mt-4">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={pagination.pages}
                  pageSize={pageSize}
                  totalRows={pagination.total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
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
        
        // Functions
        getAuthorName={getAuthorName}
        getStatusVariant={getStatusVariant}
        formatDate={formatDate}
        confirmDelete={confirmDelete}
      />
    </Main>
  );
}
