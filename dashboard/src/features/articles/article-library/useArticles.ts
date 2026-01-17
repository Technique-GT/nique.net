import { useState, useEffect, useMemo, useCallback } from "react";
import { Article, PopulatedCategory, PopulatedSubCategory, PopulatedTag, PopulatedAuthor, MessageType } from "./article";
import { apiClient } from '@/lib/api-client';

export const useArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState<MessageType | null>(null);

  // State for edit modal data
  const [categories, setCategories] = useState<PopulatedCategory[]>([]);
  const [subcategories, setSubcategories] = useState<PopulatedSubCategory[]>([]);
  const [tags, setTags] = useState<PopulatedTag[]>([]);
  const [authors, setAuthors] = useState<PopulatedAuthor[]>([]);

  // Helper to transform User to PopulatedAuthor
  const transformAuthor = (user: any): PopulatedAuthor => {
    if (!user) return { _id: '', firstName: '', lastName: '', username: '', email: '', role: '', status: '' };
    return {
      _id: user._id,
      firstName: user.name ? user.name.split(' ')[0] : 'Unknown',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      username: user.name || 'Unknown',
      email: 'N/A',
      role: user.isAdmin ? 'admin' : 'writer',
      status: 'active'
    };
  };

  // Helper function
  const transformArticleData = (article: any): Article => {
    return {
      _id: article._id?.$oid || article._id,
      title: article.title || '',
      content: article.content || '',
      excerpt: article.excerpt || '',
      category: article.categoryId ? {
        _id: article.categoryId._id,
        name: article.categoryId.name,
        slug: article.categoryId.slug,
        isActive: true // Fallback as backend doesn't populate this
      } : { _id: '', name: '', slug: '', isActive: false },
      subcategory: article.subcategoryId ? {
         _id: article.subcategoryId._id,
         name: article.subcategoryId.name,
         slug: article.subcategoryId.slug,
         category: article.categoryId,
         isActive: true
      } : undefined,
      tags: Array.isArray(article.tagIds) ? article.tagIds.map((t: any) => ({
        _id: t._id,
        name: t.name,
        slug: t.slug,
        isActive: true
      })) : [],
      authors: Array.isArray(article.authors) ? article.authors.map((a: any) => transformAuthor(a.authorId)) : [],
      collaborators: [], // Backend might not populated collaborators or different structure
      featuredMedia: {
        id: article.featuredMediaId?._id || '',
        url: article.featuredMediaId?.url || '',
        alt: article.featuredMediaId?.altText || ''
      },
      isPublished: article.published,
      isFeatured: article.isFeatured || false,
      isSticky: article.isSticky || false,
      status: article.published ? 'published' : 'draft',
      allowComments: article.allowComments ?? true,
      slug: article.slug || '',
      views: article.viewCount || 0,
      viewCount: article.viewCount || 0,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      publishedAt: article.publishedAt
    };
  };

  // Fetch articles from backend
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      // Use admin route, limit to 100 for now to get a good chunk
      const response = await apiClient.get('/admin/articles?limit=100');
      const rawArticles = Array.isArray(response) ? response : (response as any).data || [];
      
      const transformedArticles = rawArticles.map(transformArticleData);
      setArticles(transformedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setMessage({ type: 'error', text: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data for edit form
  const fetchEditData = async () => {
    try {
      const [categoriesData, subcategoriesData, tagsData, usersData] = await Promise.all([
        apiClient.get('/categories?isActive=true'),
        apiClient.get('/sub-categories?isActive=true'),
        apiClient.get('/tags?isActive=true'),
        apiClient.get('/users')
      ]);

      // apiClient returns array directly if success
      if (Array.isArray(categoriesData)) setCategories(categoriesData as any);
      if (Array.isArray(subcategoriesData)) setSubcategories(subcategoriesData as any);
      if (Array.isArray(tagsData)) setTags(tagsData as any);
      
      // Filter authors from users
      const rawUsers = Array.isArray(usersData) ? usersData : [];
      const activeAuthors = rawUsers.map(transformAuthor); 
      // Filter logic if needed, e.g. isAdmin
      setAuthors(activeAuthors);

    } catch (error) {
      console.error('Error fetching edit data:', error);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchEditData();
  }, [fetchArticles]);

  // Get unique categories for filter
  const availableCategories = useMemo(() => 
    Array.from(new Set(articles.map(article => article.category?._id)))
      .map(id => articles.find(article => article.category?._id === id)?.category)
      .filter((cat): cat is PopulatedCategory => cat !== undefined),
    [articles]
  );

  // Helper function to get author display name
  const getAuthorName = (author: PopulatedAuthor) => {
    return `${author.firstName} ${author.lastName}`;
  };

  // Filter articles based on search and filters
  const filteredArticles = useMemo(() => 
    articles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.authors.some(author => 
          getAuthorName(author).toLowerCase().includes(searchTerm.toLowerCase()) ||
          author.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "published" && article.status === "published") ||
                           (statusFilter === "draft" && article.status === "draft");
      
      const matchesCategory = categoryFilter === "all" || article.category?._id === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    }),
    [articles, searchTerm, statusFilter, categoryFilter]
  );

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return {
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
  };
};
