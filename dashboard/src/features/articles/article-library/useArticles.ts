import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Article, PopulatedCategory, PopulatedSubCategory, PopulatedTag, PopulatedAuthor, MessageType } from "./article";
import { getAdminArticlesPage } from "@/services/articles";
import {
  useTaxonomy,
  useUsers,
  useMedia,
} from "@/hooks/use-queries";

// Query key for articles
const articlesQueryKey = (params: { page: number; search?: string }) => 
  ['admin-articles', params] as const;

export const useArticles = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState<MessageType | null>(null);
  
  const queryClient = useQueryClient();

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
  const transformArticleData = useCallback((article: any): Article => {
    return {
      _id: article._id?.$oid || article._id,
      title: article.title || '',
      content: article.content || '',
      excerpt: article.excerpt || '',
      category: article.categoryId ? {
        _id: article.categoryId._id || article.categoryId,
        name: article.categoryId.name || 'Unknown',
        slug: article.categoryId.slug || '',
        isActive: true
      } : { _id: '', name: '', slug: '', isActive: false },
      subcategory: article.subcategoryId ? {
         _id: article.subcategoryId._id || article.subcategoryId,
         name: article.subcategoryId.name || 'Unknown',
         slug: article.subcategoryId.slug || '',
         category: article.categoryId,
         isActive: true
      } : undefined,
      tags: Array.isArray(article.tagIds) ? article.tagIds.map((t: any) => ({
        _id: t._id || t,
        name: t.name || 'Unknown',
        slug: t.slug || '',
        isActive: true
      })) : [],
      authors: Array.isArray(article.authors) ? article.authors.map((a: any) => transformAuthor(a.authorId)) : [],
      collaborators: [],
      featuredMedia: {
        id: article.featuredMediaId?._id || article.featuredMediaId || '',
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
  }, []);

  // TanStack Query for articles (NOT persisted - large/fast-changing list)
  const articlesQuery = useQuery({
    queryKey: articlesQueryKey({ page: currentPage, search: searchTerm || undefined }),
    queryFn: async () => {
      const response = await getAdminArticlesPage({ 
        page: currentPage, 
        limit: 10,
        search: searchTerm || undefined 
      });
      return {
        articles: response.data.map(transformArticleData),
        pagination: response.pagination || null,
      };
    },
    staleTime: 15 * 1000, // 15 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    // No meta.persist - this is a large, fast-changing list
  });

  const articles = articlesQuery.data?.articles ?? [];
  const pagination = articlesQuery.data?.pagination ?? null;
  const loading = articlesQuery.isLoading;

  // Use centralized taxonomy hooks (PERSISTED)
  const { categories: rawCategories, subCategories: rawSubCategories, tags: rawTags } = useTaxonomy();
  
  // Use centralized users hook (NOT persisted - PII)
  const { data: rawUsers = [] } = useUsers();
  
  // Use centralized media hook (NOT persisted - large)
  const { data: mediaData } = useMedia({ limit: 100 });

  // Map taxonomy to expected format
  const categories: PopulatedCategory[] = useMemo(() => {
    return rawCategories.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      isActive: true,
    }));
  }, [rawCategories]);

  const subcategories: PopulatedSubCategory[] = useMemo(() => {
    const categoryMap = new Map(rawCategories.map((cat) => [cat._id, cat]));
    return rawSubCategories.map((sc) => {
      const categoryId = typeof sc.categoryId === 'string' 
        ? sc.categoryId 
        : (sc.categoryId as any)?._id || '';
      const category = categoryMap.get(categoryId);
      return {
        _id: sc._id,
        name: sc.name,
        slug: sc.slug,
        isActive: true,
        category: {
          _id: category?._id || categoryId,
          name: category?.name || 'Unknown',
          slug: category?.slug || '',
        },
      };
    });
  }, [rawSubCategories, rawCategories]);

  const tags: PopulatedTag[] = useMemo(() => {
    return rawTags.map((t) => ({
      _id: t._id,
      name: t.name,
      slug: t.slug,
      isActive: true,
    }));
  }, [rawTags]);

  const authors: PopulatedAuthor[] = useMemo(() => {
    return rawUsers.map(transformAuthor);
  }, [rawUsers]);

  const mediaLibrary = useMemo(() => {
    return mediaData?.data || [];
  }, [mediaData]);

  // Fetch articles function (invalidates query)
  const fetchArticles = useCallback(async (page = currentPage) => {
    if (page !== currentPage) {
      setCurrentPage(page);
    }
    await queryClient.invalidateQueries({ 
      queryKey: ['admin-articles'],
    });
  }, [currentPage, queryClient]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

  // Filter articles based on search and filters (client-side filtering for status/category)
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
  useMemo(() => {
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
    getAuthorName,
    pagination,
    currentPage,
    handlePageChange,
    mediaLibrary
  };
};
