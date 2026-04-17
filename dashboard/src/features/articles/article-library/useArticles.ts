import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Article, PopulatedCategory, PopulatedSubCategory, PopulatedTag, PopulatedAuthor, MessageType } from "./article";
import { getAdminArticlesPage, type AdminArticlesQuery, type BackendArticle } from "@/services/articles";
import {
  useTaxonomy,
  useUsers,
} from "@/hooks/use-queries";
import type { User } from "@/services/users";

// Query key for articles
const articlesQueryKey = (params: { 
  page: number; 
  limit: number; 
  search?: string; 
  status?: AdminArticlesQuery["status"];
  categoryId?: string;
  subcategoryId?: string;
  isFeatured?: boolean;
  isSticky?: boolean;
  hideDrafts?: boolean;
}) => ['admin-articles', params] as const;

type StatusFilter = "all" | NonNullable<AdminArticlesQuery["status"]>;

type BackendUserRef = {
  _id?: string;
  name?: string;
  isAdmin?: boolean;
};

type BackendArticleRef = {
  _id?: string;
  $oid?: string;
};

type BackendTagRef = {
  _id?: string;
  name?: string;
  slug?: string;
};

type BackendArticleListItem = BackendArticle & {
  _id: string | BackendArticleRef;
  content?: string;
  categoryId?: { _id?: string; name?: string; slug?: string } | string | null;
  subcategoryId?: { _id?: string; name?: string; slug?: string } | string | null;
  tagIds?: Array<BackendTagRef | string>;
  authors?: Array<{ authorId?: BackendUserRef | null }>;
  ownerId?: string | BackendArticleRef | null;
  published?: boolean;
  isFeatured?: boolean;
  isSticky?: boolean;
  allowComments?: boolean;
};

const extractObjectId = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$oid" in value && typeof (value as BackendArticleRef).$oid === "string") {
    return (value as BackendArticleRef).$oid as string;
  }
  if (value && typeof value === "object" && "_id" in value && typeof (value as BackendArticleRef)._id === "string") {
    return (value as BackendArticleRef)._id as string;
  }
  return "";
};

export const useArticles = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [showFeatured, setShowFeatured] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [hideDrafts, setHideDrafts] = useState(false);
  const [message, setMessage] = useState<MessageType | null>(null);
  
  const queryClient = useQueryClient();
  const statusParam = statusFilter !== "all" ? statusFilter : undefined;
  const categoryParam = categoryFilter !== "all" ? categoryFilter : undefined;
  const subcategoryParam = subcategoryFilter !== "all" ? subcategoryFilter : undefined;
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      search: searchTerm || undefined,
      status: statusParam,
      categoryId: categoryParam,
      subcategoryId: subcategoryParam,
      isFeatured: showFeatured || undefined,
      isSticky: showSticky || undefined,
      hideDrafts: hideDrafts || undefined,
    }),
    [
      currentPage,
      pageSize,
      searchTerm,
      statusParam,
      categoryParam,
      subcategoryParam,
      showFeatured,
      showSticky,
      hideDrafts,
    ],
  );

  // Helper to transform User to PopulatedAuthor
  const transformAuthor = (user: BackendUserRef | User | null | undefined): PopulatedAuthor => {
    if (!user) return { _id: '', firstName: '', lastName: '', username: '', email: '', role: '', status: '' };
    const fullName = typeof user.name === "string" ? user.name : "Unknown";
    return {
      _id: typeof user._id === "string" ? user._id : "",
      firstName: fullName ? fullName.split(' ')[0] : 'Unknown',
      lastName: fullName ? fullName.split(' ').slice(1).join(' ') : '',
      username: fullName || 'Unknown',
      email: 'N/A',
      role: user.isAdmin ? 'admin' : 'writer',
      status: 'active'
    };
  };

  // Helper function
  const transformArticleData = useCallback((article: BackendArticleListItem): Article => {
    const categoryId = article.categoryId;
    const resolvedCategoryId = extractObjectId(categoryId);
    const subcategoryId = article.subcategoryId;

    return {
      _id: extractObjectId(article._id),
      title: article.title || '',
      content: article.content || '',
      category: categoryId ? {
        _id: resolvedCategoryId,
        name: typeof categoryId === "object" && typeof categoryId?.name === "string" ? categoryId.name : 'Unknown',
        slug: typeof categoryId === "object" && typeof categoryId?.slug === "string" ? categoryId.slug : '',
        isActive: true
      } : { _id: '', name: '', slug: '', isActive: false },
      subcategory: subcategoryId ? {
         _id: extractObjectId(subcategoryId),
         name: typeof subcategoryId === "object" && typeof subcategoryId?.name === "string" ? subcategoryId.name : 'Unknown',
         slug: typeof subcategoryId === "object" && typeof subcategoryId?.slug === "string" ? subcategoryId.slug : '',
         category: {
          _id: resolvedCategoryId,
          name: typeof categoryId === "object" && typeof categoryId?.name === "string" ? categoryId.name : "Unknown",
          slug: typeof categoryId === "object" && typeof categoryId?.slug === "string" ? categoryId.slug : "",
          isActive: true,
         },
         isActive: true
      } : undefined,
      tags: Array.isArray(article.tagIds) ? article.tagIds.map((t) => ({
        _id: extractObjectId(t),
        name: typeof t === "object" && typeof t?.name === "string" ? t.name : 'Unknown',
        slug: typeof t === "object" && typeof t?.slug === "string" ? t.slug : '',
        isActive: true
      })) : [],
      authors: Array.isArray(article.authors) ? article.authors.map((a) => transformAuthor(a.authorId)) : [],
      ownerId: extractObjectId(article.ownerId),
      featuredMediaUrl: typeof article.featuredMediaUrl === 'string' ? article.featuredMediaUrl : '',
      isPublished: !!article.published,
      isFeatured: article.isFeatured || false,
      isSticky: article.isSticky || false,
      status: article.published ? 'published' : 'draft',
      allowComments: article.allowComments ?? true,
      // Map new review fields
      reviewStatus: article.reviewStatus,
      reviewedAt: article.reviewedAt,
      reviewedBy: article.reviewedBy,
      reviewNotes: article.reviewNotes,

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
    queryKey: articlesQueryKey(queryParams),
    queryFn: () => getAdminArticlesPage(queryParams),
    staleTime: 15 * 1000, // 15 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    // No meta.persist - this is a large, fast-changing list
  });

  const rawArticles = articlesQuery.data?.data;
  const articles = useMemo(() => {
    const list = Array.isArray(rawArticles) ? rawArticles : [];
    return list.map(transformArticleData);
  }, [rawArticles, transformArticleData]);
  const pagination = articlesQuery.data?.pagination ?? null;
  const loading = articlesQuery.isLoading;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, subcategoryFilter, showFeatured, showSticky, hideDrafts]);

  // Use centralized taxonomy hooks (PERSISTED)
  const { categories: rawCategories, subCategories: rawSubCategories, tags: rawTags } = useTaxonomy();
  
  // Use centralized users hook (NOT persisted - PII)
  const { data: usersData } = useUsers();
  

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
        : sc.categoryId?._id || '';
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
    const list = Array.isArray(usersData) ? usersData : [];
    return list.map(transformAuthor);
  }, [usersData]);


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

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Use full taxonomy list for category filter so options aren't page-limited
  const availableCategories = useMemo(
    () => categories.filter((cat) => typeof cat._id === 'string' && cat._id.length > 0),
    [categories],
  );

  const availableSubcategories = useMemo(
    () =>
      subcategories.filter((subcategory) => {
        if (!(typeof subcategory._id === 'string' && subcategory._id.length > 0)) return false;
        if (categoryFilter === "all") return true;
        return subcategory.category?._id === categoryFilter;
      }),
    [subcategories, categoryFilter],
  );

  // Reset Subcategory filter to all subcategories on category change
  useEffect(() => {
    setSubcategoryFilter("all");
  }, [categoryFilter]);

  // Helper function to get author display name
  const getAuthorName = (author: PopulatedAuthor) => {
    return `${author.firstName} ${author.lastName}`;
  };

  const filteredArticles = articles;

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
    handlePageSizeChange,
  };
};
