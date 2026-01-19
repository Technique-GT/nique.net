import { useMemo, useState } from "react";
import ArticleForm from "./ArticleForm";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import { formatDistanceToNow } from "date-fns";
import {
  useTaxonomy,
  useUsers,
  useMedia,
  useAdminArticle,
} from "@/hooks/use-queries";
import type { Category, SubCategory, Tag, Author, MediaItem } from "./types";
import { useParams } from "@tanstack/react-router";

export default function ArticleCreation() {
  const { articleId } = useParams({ strict: false }) as { articleId?: string };
  const isEditMode = !!articleId;
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const {
    data: initialArticle,
    isLoading: articleLoading,
  } = useAdminArticle(articleId || "");

  // Transform backend article to frontend shape
  const transformedArticle = useMemo(() => {
    if (!initialArticle) return null;
    const backendArticle = initialArticle as any;

    // Helper to map backend user to frontend Author
    const mapUserToAuthor = (u: any) => {
      if (!u) return null;
      const fullName = typeof u.name === 'string' ? u.name.trim() : 'Unknown';
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || 'Unknown';
      const lastName = parts.slice(1).join(' ');

      return {
        _id: u._id,
        firstName,
        lastName,
        username: fullName,
        email: u.email || '', // Email might not be populated, default to empty
        role: u.isAdmin ? 'admin' : 'writer',
        status: 'active',
      };
    };

      return {
        ...backendArticle,
        // Map populated fields to expected frontend props
        category: backendArticle.categoryId,
        subcategory: backendArticle.subcategoryId,
        tags: backendArticle.tagIds,

        // Dashboard caption field maps to backend imageCaption (fallback to excerpt)
        excerpt: backendArticle.imageCaption ?? backendArticle.excerpt ?? "",

      
      // Map authors array structure
      authors: Array.isArray(backendArticle.authors)
        ? backendArticle.authors
            .map((a: any) => mapUserToAuthor(a.authorId))
            .filter((a: any) => a !== null)
        : [],

      // Map featured media
      featuredMedia: backendArticle.featuredMediaId
        ? {
            id: backendArticle.featuredMediaId._id,
            url: backendArticle.featuredMediaId.url,
            alt: backendArticle.featuredMediaId.altText,
          }
        : undefined,
    };
  }, [initialArticle]);

  // TanStack Query hooks - all taxonomy data is persisted
  const { categories: rawCategories, subCategories: rawSubCategories, tags: rawTags, isLoading: taxonomyLoading, isError: taxonomyError } = useTaxonomy();
  const { data: usersData, isLoading: usersLoading } = useUsers({ limit: 1000 });
  const rawUsers = usersData ?? [];
  const { data: mediaData, isLoading: mediaLoading } = useMedia({ limit: 100 });

  const isLoading =
    taxonomyLoading ||
    usersLoading ||
    mediaLoading ||
    articleLoading;

  const subtitle = useMemo(() => {
    if (!isEditMode) return "Draft, schedule, or publish a new post";
    
    if (lastSavedAt) {
      return `Autosaved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`;
    }
    
    return "";
  }, [isEditMode, lastSavedAt]);

  // Map to UI shapes with default values for missing fields
  const categories: Category[] = useMemo(() => {
    return rawCategories.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      isActive: true, // Default since backend doesn't provide
    }));
  }, [rawCategories]);

  const subcategories: SubCategory[] = useMemo(() => {
    // Create a map for category lookup
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
        description: sc.description,
        isActive: true,
        categoryId,
        category: {
          _id: category?._id || categoryId,
          name: category?.name || 'Unknown',
          slug: category?.slug || '',
        },
      };
    });
  }, [rawSubCategories, rawCategories]);

  const tags: Tag[] = useMemo(() => {
    return rawTags.map((t) => ({
      _id: t._id,
      name: t.name,
      slug: t.slug,
      description: undefined,
      color: '#6366f1', // Default color
      isActive: true,
    }));
  }, [rawTags]);

  // Map canonical backend User -> UI Author shape expected by ArticleForm
  const authors: Author[] = useMemo(() => {
    return rawUsers.map((u: any) => {
      const fullName = typeof u?.name === 'string' ? u.name.trim() : '';
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || 'Unknown';
      const lastName = parts.slice(1).join(' ');

      return {
        _id: u._id,
        firstName,
        lastName,
        username: fullName || 'Unknown',
        email: 'N/A',
        role: u.isAdmin ? 'admin' : 'writer',
        status: 'active',
      };
    });
  }, [rawUsers]);

  // Map backend media to UI media picker shape
  const mediaItems: MediaItem[] = useMemo(() => {
    return (mediaData?.data || []).map((m: any) => ({
      id: m._id,
      title: m.altText || 'Untitled',
      url: m.url,
      description: m.altText
    }));
  }, [mediaData]);


  if (isLoading) {
    return (
      <Main>
        <PageHeader 
          title={isEditMode ? "Edit Article" : "Create New Article"} 
          description="Loading form data..." 
        />
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading form data...</p>
            </div>
          </div>
        </div>
      </Main>
    );
  }

  if (taxonomyError) {
    return (
      <Main>
        <PageHeader 
          title={isEditMode ? "Edit Article" : "Create New Article"} 
          description="Fix the errors and retry" 
        />
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading form data</p>
          <p className="text-sm mt-1">Failed to load taxonomy data. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 border border-red-300 rounded text-sm hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <PageHeader
        title={isEditMode ? "Edit Article" : "Create New Article"}
        description={subtitle}
      />
      <ArticleForm
        categories={categories}
        subcategories={subcategories}
        tags={tags}
        authors={authors}
        mediaLibrary={mediaItems}
        initialArticle={transformedArticle as any}
        isLoadingData={isLoading}
        onLastSavedChange={setLastSavedAt}
      />
    </Main>
  );
}
