import { useMemo, useState } from "react";
import ArticleForm from "./ArticleForm";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import { formatDistanceToNow } from "date-fns";
import {
  useTaxonomy,
  useUsers,
  useAdminArticle,
} from "@/hooks/use-queries";
import type { Category, SubCategory, Tag, Author, Article } from "./types";
import { useParams } from "@tanstack/react-router";
import type { BackendArticle } from "@/services/articles";
import type { User } from "@/services/users";

type BackendUser = {
  _id?: string;
  name?: string;
  email?: string;
  isAdmin?: boolean;
};

type BackendArticleAuthor = {
  authorId?: BackendUser | null;
};

type BackendArticleForForm = BackendArticle & {
  content?: string;
  ownerId?: string;
  editorState?: unknown;
  isFeatured?: boolean;
  isSticky?: boolean;
  allowComments?: boolean;
  categoryId?: Category | string | null;
  subcategoryId?: SubCategory | string | null;
  tagIds?: Array<Tag | string>;
  authors?: BackendArticleAuthor[];
};

const toCategory = (value: Category | string | null | undefined): Category => {
  if (value && typeof value === "object") {
    return {
      _id: value._id,
      name: value.name || "Unknown",
      slug: value.slug || "",
      description: value.description,
      isActive: value.isActive ?? true,
    };
  }

  if (typeof value === "string" && value.length > 0) {
    return {
      _id: value,
      name: "Unknown",
      slug: "",
      isActive: true,
    };
  }

  return {
    _id: "",
    name: "Unknown",
    slug: "",
    isActive: true,
  };
};

const toSubCategory = (value: SubCategory | string | null | undefined, parentCategoryId: string): SubCategory | undefined => {
  if (!value) return undefined;

  if (typeof value === "object") {
    return {
      _id: value._id,
      name: value.name || "Unknown",
      slug: value.slug || "",
      description: value.description,
      isActive: value.isActive ?? true,
      categoryId: value.categoryId,
      category: value.category,
    };
  }

  if (typeof value === "string" && value.length > 0) {
    return {
      _id: value,
      name: "Unknown",
      slug: "",
      isActive: true,
      categoryId: parentCategoryId,
      category: {
        _id: parentCategoryId,
        name: "Unknown",
        slug: "",
      },
    };
  }

  return undefined;
};

const toTag = (value: Tag | string): Tag => {
  if (typeof value === "object" && value !== null) {
    return {
      _id: value._id,
      name: value.name || "Unknown",
      slug: value.slug || "",
      description: value.description,
      color: value.color || "#6366f1",
      isActive: value.isActive ?? true,
    };
  }

  return {
    _id: value,
    name: "Unknown",
    slug: "",
    color: "#6366f1",
    isActive: true,
  };
};

const mapUserToAuthor = (u: BackendUser | null | undefined): Author | null => {
  if (!u || typeof u._id !== "string" || u._id.length === 0) return null;
  const fullName = typeof u.name === "string" ? u.name.trim() : "Unknown";
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "Unknown";
  const lastName = parts.slice(1).join(" ");

  return {
    _id: u._id,
    firstName,
    lastName,
    username: fullName,
    email: u.email || "",
    role: u.isAdmin ? "admin" : "writer",
    status: "active",
  };
};

const toSerializedEditorState = (
  value: unknown,
): Article["editorState"] | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return value as Article["editorState"];
};

export default function ArticleCreation() {
  const { articleId } = useParams({ strict: false }) as { articleId?: string };
  const isEditMode = !!articleId;
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const {
    data: initialArticle,
    isLoading: articleLoading,
  } = useAdminArticle(articleId || "");

  // Transform backend article to frontend shape
  const transformedArticle = useMemo<Article | null>(() => {
    if (!initialArticle) return null;
    const backendArticle = initialArticle as BackendArticleForForm;
    const category = toCategory(backendArticle.categoryId);
    const subcategory = toSubCategory(backendArticle.subcategoryId, category._id);
    const tags = Array.isArray(backendArticle.tagIds)
      ? backendArticle.tagIds.map(toTag)
      : [];
    const authors = Array.isArray(backendArticle.authors)
      ? backendArticle.authors
          .map((a) => mapUserToAuthor(a.authorId))
          .filter((a): a is Author => a !== null)
      : [];

    return {
      _id: backendArticle._id,
      title: backendArticle.title || "",
      content: backendArticle.content || "",
      imageCaption: backendArticle.imageCaption ?? "",
      category,
      subcategory,
      tags,
      authors,
      ownerId: backendArticle.ownerId,
      editorState: toSerializedEditorState(backendArticle.editorState),
      reviewStatus: backendArticle.reviewStatus,
      reviewedAt: backendArticle.reviewedAt,
      reviewedBy: backendArticle.reviewedBy,
      reviewNotes: backendArticle.reviewNotes,
      featuredMediaUrl:
        typeof backendArticle.featuredMediaUrl === "string"
          ? backendArticle.featuredMediaUrl
          : undefined,
      isPublished: backendArticle.published,
      isFeatured: backendArticle.isFeatured ?? false,
      isSticky: backendArticle.isSticky ?? false,
      status: backendArticle.published ? "published" : "draft",
      allowComments: backendArticle.allowComments ?? true,
      publishedAt: backendArticle.publishedAt ?? undefined,
      slug: backendArticle.slug || "",
      views: backendArticle.viewCount ?? 0,
      seoTitle: undefined,
      seoDescription: undefined,
      createdAt: backendArticle.createdAt,
      updatedAt: backendArticle.updatedAt,
    };
  }, [initialArticle]);

  // TanStack Query hooks - all taxonomy data is persisted
  const { categories: rawCategories, subCategories: rawSubCategories, tags: rawTags, isLoading: taxonomyLoading, isError: taxonomyError } = useTaxonomy();
  const { data: usersData, isLoading: usersLoading } = useUsers({ limit: 1000 });
  const rawUsers = usersData ?? [];
  const isLoading =
    taxonomyLoading ||
    usersLoading ||
    articleLoading;

  const subtitle = useMemo(() => {
    if (!isEditMode) return "Draft, schedule, or publish a new post";
    
    if (lastSavedAt) {
      return `Saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`;
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
        : sc.categoryId?._id || '';
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
    return rawUsers.map((u: User) => {
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
        initialArticle={transformedArticle}
        isLoadingData={isLoading}
        onLastSavedChange={setLastSavedAt}
      />
    </Main>
  );
}
