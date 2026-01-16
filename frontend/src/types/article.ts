/**
 * Types aligned with newbackend contracts.
 * See PLAN.MD for the canonical shapes from newbackend/json-schemas/canonical-contract.json
 */

// =============================================================================
// Base / Shared Types
// =============================================================================

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Tag {
  _id: string;
  name: string;
  slug: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export interface Media {
  _id: string;
  url: string;
  altText: string;
}

export interface User {
  _id: string;
  name: string;
  isAdmin?: boolean;
  profilePictureMediaId?: string | Media | null;
  bio?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
}

// =============================================================================
// Article Types (aligned with newbackend)
// =============================================================================

export interface ArticleAuthor {
  authorId: User | string;
  order: number;
}

export interface ArticleDocument {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  categoryId: Category | null;
  subcategoryId?: Subcategory | null;
  tagIds: Tag[];
  authors: ArticleAuthor[];
  featuredMediaId?: Media | null;
  imageCaption?: string;
  published: boolean;
  publishedAt: Date | string | null;
  allowComments: boolean;
  isFeatured: boolean;
  isSticky: boolean;
  viewCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// =============================================================================
// Comment Types (aligned with newbackend)
// =============================================================================

export interface Comment {
  _id: string;
  articleId: string;
  parentCommentId?: string;
  content: string;
  username: string;
  thumbsUp: number;
  thumbsDown: number;
  approved: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  replies?: Comment[];
}

// =============================================================================
// Derived / UI-specific Types
// =============================================================================

/**
 * Simplified article shape for list/card views.
 * Derived from ArticleDocument in mapping utilities.
 */
export interface Post {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  desc: string;
  author: string;
  category: string;
  featuredImage?: Media | null;
  imageCaption?: string;
  publishedAt?: Date | string | null;
  createdAt?: Date | string;
  isSticky?: boolean;
}

export interface ArticleBlockProps {
  post: Post;
  height?: string;
}

export interface ArticleProps {
  post: Post;
}

export interface ArticleListProps {
  posts: Post[];
  width?: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface FeedResponse {
  data: ArticleDocument[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}
