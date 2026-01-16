import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, RefreshCw } from "lucide-react";
import { useArticles } from "./useArticles";
import { ArticleTable } from "./ArticleTable";
import { ArticleDialogs } from "./ArticleDialogs";
import { Article, PopulatedAuthor } from "./article";
import { API_BASE_URL } from '../../../config';

export default function ArticleList() {
  const navigate = useNavigate();
  
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
    message,
    setMessage,
    availableCategories,
    categories,
    subcategories,
    tags,
    authors,
    fetchArticles,
    getAuthorName
  } = useArticles();

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);

  // Edit form state - UPDATED WITH ALL FIELDS
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSubcategory, setEditSubcategory] = useState("");
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);
  const [editSelectedAuthors, setEditSelectedAuthors] = useState<PopulatedAuthor[]>([]);
  const [editSelectedCollaborators, setEditSelectedCollaborators] = useState<string[]>([]);
  const [editFeaturedMediaId, setEditFeaturedMediaId] = useState("");
  const [editFeaturedMediaUrl, setEditFeaturedMediaUrl] = useState("");
  const [editFeaturedMediaAlt, setEditFeaturedMediaAlt] = useState("");
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsSticky, setEditIsSticky] = useState(false);
  const [editAllowComments, setEditAllowComments] = useState(true);
  const [editSeoTitle, setEditSeoTitle] = useState("");
  const [editSeoDescription, setEditSeoDescription] = useState("");
  const [editAuthorSearch, setEditAuthorSearch] = useState("");
  const [showAuthorResults, setShowAuthorResults] = useState(false);

  editFeaturedMediaId;
  editFeaturedMediaUrl;
  editSeoTitle;
  editSeoDescription;

  // Quick action states
  const [publishingArticle, setPublishingArticle] = useState<string | null>(null);
  const [featuringArticle, setFeaturingArticle] = useState<string | null>(null);
  const [stickingArticle, setStickingArticle] = useState<string | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);

  // Add collaborators data
  const [collaborators, setCollaborators] = useState<any[]>([]);

  // Fetch collaborators
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/collaborators`);
        const result = await response.json();
        if (result.success) {
          setCollaborators(result.data);
        }
      } catch (error) {
        console.error('Error fetching collaborators:', error);
      }
    };
    fetchCollaborators();
  }, []);

  // Quick action handlers
  const handleQuickPublish = async (article: Article) => {
    setPublishingArticle(article._id);
    try {
      const newIsPublished = !article.isPublished;
      
      const response = await fetch(`${API_BASE_URL}/articles/${article._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newIsPublished ? 'published' : 'draft',
          isFeatured: newIsPublished ? article.isFeatured : false,
          isSticky: newIsPublished ? article.isSticky : false
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Article ${newIsPublished ? 'published' : 'unpublished'} successfully!` 
        });
        fetchArticles();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update article status' });
      }
    } catch (error) {
      console.error('Error updating article status:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPublishingArticle(null);
    }
  };

  const handleQuickFeature = async (article: Article) => {
    if (article.status !== 'published') {
      setMessage({ type: 'error', text: 'Only published articles can be featured' });
      return;
    }

    setFeaturingArticle(article._id);
    try {
      const response = await fetch(`${API_BASE_URL}/articles/${article._id}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Article ${!article.isFeatured ? 'featured' : 'unfeatured'} successfully!` 
        });
        fetchArticles();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update featured status' });
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setFeaturingArticle(null);
    }
  };

  const handleQuickSticky = async (article: Article) => {
    if (article.status !== 'published') {
      setMessage({ type: 'error', text: 'Only published articles can be pinned' });
      return;
    }

    setStickingArticle(article._id);
    try {
      const response = await fetch(`${API_BASE_URL}/articles/${article._id}/sticky`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Article ${!article.isSticky ? 'pinned' : 'unpinned'} successfully!` 
        });
        fetchArticles();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update sticky status' });
      }
    } catch (error) {
      console.error('Error updating sticky status:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setStickingArticle(null);
    }
  };

  // Edit handlers - UPDATED TO POPULATE ALL FIELDS
// In your ArticleList.tsx - update the handleEdit function
const handleEdit = async (article: Article) => {
  setCurrentArticle(article);
  
  // Populate ONLY fields that exist in the schema
  setEditTitle(article.title);
  setEditContent(article.content);
  setEditExcerpt(article.excerpt);
  setEditCategory(article.category._id);
  setEditSubcategory(article.subcategory?._id || "");
  setEditSelectedTags(article.tags.map(tag => tag._id));
  setEditSelectedAuthors(article.authors);
  setEditSelectedCollaborators(article.collaborators?.map(collab => collab._id) || []);
  setEditFeaturedMediaAlt(article.featuredMedia?.alt || "");
  setEditIsPublished(article.status === 'published');
  setEditIsFeatured(article.isFeatured);
  setEditIsSticky(article.isSticky);
  setEditAllowComments(article.allowComments ?? true);
  setEditSlug(article.slug);
  
  setEditDialogOpen(true);
};

// Update the state to remove unused fields and add slug
const [editSlug, setEditSlug] = useState("");

// Remove these unused states from your component:
// editFeaturedMediaId, setEditFeaturedMediaId
// editFeaturedMediaUrl, setEditFeaturedMediaUrl  
// editSeoTitle, setEditSeoTitle
// editSeoDescription, setEditSeoDescription

// Update the handleSaveEdit to only send actual schema fields
const handleSaveEdit = async () => {
  if (!currentArticle) return;

  try {
    setIsEditLoading(true);
    const articleData = {
      title: editTitle,
      content: editContent,
      excerpt: editExcerpt,
      category: editCategory,
      subcategory: editSubcategory || undefined,
      tags: editSelectedTags,
      authors: editSelectedAuthors.map(author => author._id),
      collaborators: editSelectedCollaborators,
      featuredMedia: {
        alt: editFeaturedMediaAlt
      },
      status: editIsPublished ? 'published' : 'draft',
      isFeatured: editIsFeatured,
      isSticky: editIsSticky,
      allowComments: editAllowComments,
      slug: editSlug,
    };

    const response = await fetch(`${API_BASE_URL}/articles/${currentArticle._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData),
    });

    const result = await response.json();

    if (result.success) {
      setMessage({ type: 'success', text: 'Article updated successfully!' });
      fetchArticles();
      setEditDialogOpen(false);
      resetEditForm();
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to update article' });
    }
  } catch (error) {
    console.error('Error updating article:', error);
    setMessage({ type: 'error', text: 'Network error. Please try again.' });
  } finally {
    setIsEditLoading(false);
  }
};

  const resetEditForm = () => {
    setEditTitle("");
    setEditContent("");
    setEditExcerpt("");
    setEditCategory("");
    setEditSubcategory("");
    setEditSelectedTags([]);
    setEditSelectedAuthors([]);
    setEditSelectedCollaborators([]);
    setEditFeaturedMediaId("");
    setEditFeaturedMediaUrl("");
    setEditFeaturedMediaAlt("");
    setEditIsPublished(false);
    setEditIsFeatured(false);
    setEditIsSticky(false);
    setEditAllowComments(true);
    setEditSeoTitle("");
    setEditSeoDescription("");
    setEditAuthorSearch("");
    setShowAuthorResults(false);
    setCurrentArticle(null);
  };

  // Delete handlers
  const handleDelete = (article: Article) => {
    setCurrentArticle(article);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentArticle) return;

    try {
      const response = await fetch(`${API_BASE_URL}/articles/${currentArticle._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Article deleted successfully!' });
        fetchArticles();
        setDeleteDialogOpen(false);
        setCurrentArticle(null);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete article' });
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  // View handler
  const handleView = (article: Article) => {
    setCurrentArticle(article);
    setViewDialogOpen(true);
  };

  // Navigation
  const handleNewArticle = () => {
    navigate({ to: '/articles' });
  };

  // Helper functions
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "published": return "default";
      case "draft": return "secondary";
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

  // Author search and selection functions
  const handleAuthorSearch = (searchTerm: string) => {
    setEditAuthorSearch(searchTerm);
    setShowAuthorResults(searchTerm.length > 0);
  };

  const handleAuthorSelect = (author: PopulatedAuthor) => {
    if (!editSelectedAuthors.find(a => a._id === author._id)) {
      setEditSelectedAuthors(prev => [...prev, author]);
    }
    setEditAuthorSearch("");
    setShowAuthorResults(false);
  };

  const handleAuthorRemove = (authorId: string) => {
    setEditSelectedAuthors(prev => prev.filter(a => a._id !== authorId));
  };

  // Tag selection functions
  const handleTagSelect = (tagId: string) => {
    setEditSelectedTags((prev) =>
      prev.includes(tagId) ? prev : [...prev, tagId]
    );
  };

  const handleTagRemove = (tagId: string) => {
    setEditSelectedTags((prev) => prev.filter(id => id !== tagId));
  };

  // Collaborator selection functions
  const handleCollaboratorSelect = (collaboratorId: string) => {
    setEditSelectedCollaborators((prev) =>
      prev.includes(collaboratorId) ? prev : [...prev, collaboratorId]
    );
  };

  const handleCollaboratorRemove = (collaboratorId: string) => {
    setEditSelectedCollaborators((prev) => prev.filter(id => id !== collaboratorId));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Article Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchArticles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleNewArticle}>
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>
            Manage your articles with full CRUD operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
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
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onNewArticle={handleNewArticle}
          />
        </CardContent>
      </Card>

      <ArticleDialogs
        // Edit Dialog
        editSlug={editSlug}
        setEditSlug={setEditSlug}
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        currentArticle={currentArticle}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editContent={editContent}
        setEditContent={setEditContent}
        editExcerpt={editExcerpt}
        setEditExcerpt={setEditExcerpt}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        editSubcategory={editSubcategory}
        setEditSubcategory={setEditSubcategory}
        editSelectedTags={editSelectedTags}
        editSelectedAuthors={editSelectedAuthors}
        editSelectedCollaborators={editSelectedCollaborators}
        editFeaturedMediaAlt={editFeaturedMediaAlt}
        setEditFeaturedMediaAlt={setEditFeaturedMediaAlt}
        editIsPublished={editIsPublished}
        setEditIsPublished={setEditIsPublished}
        editIsFeatured={editIsFeatured}
        setEditIsFeatured={setEditIsFeatured}
        editIsSticky={editIsSticky}
        setEditIsSticky={setEditIsSticky}
        editAllowComments={editAllowComments}
        setEditAllowComments={setEditAllowComments}
        editAuthorSearch={editAuthorSearch}
        setEditAuthorSearch={setEditAuthorSearch}
        showAuthorResults={showAuthorResults}
        setShowAuthorResults={setShowAuthorResults}
        
        // Other dialogs
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        viewDialogOpen={viewDialogOpen}
        setViewDialogOpen={setViewDialogOpen}
        
        // Data
        categories={categories}
        subcategories={subcategories}
        tags={tags}
        authors={authors}
        collaborators={collaborators}
        
        // Functions
        getAuthorName={getAuthorName}
        getStatusVariant={getStatusVariant}
        formatDate={formatDate}
        handleSaveEdit={handleSaveEdit}
        confirmDelete={confirmDelete}
        resetEditForm={resetEditForm}
        handleAuthorSearch={handleAuthorSearch}
        handleAuthorSelect={handleAuthorSelect}
        handleAuthorRemove={handleAuthorRemove}
        handleTagSelect={handleTagSelect}
        handleTagRemove={handleTagRemove}
        handleCollaboratorSelect={handleCollaboratorSelect}
        handleCollaboratorRemove={handleCollaboratorRemove}
        isEditLoading={isEditLoading}
      />
    </div>
  );
}
