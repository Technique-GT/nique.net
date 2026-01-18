/**
 * Types aligned with backend contracts.
 * See PLAN.MD for the canonical shapes from backend/json-schemas/canonical-contract.json
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
// Article Types (aligned with backend)
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
// Comment Types (aligned with backend)
// =============================================================================

export interface Comment {
  _id: string;
  articleId: string;
  parentCommentId?: string;
  content: string;
  username: string;
  thumbsUp: number;
  thumbsDown: number;
  myReaction?: 'up' | 'down' | null;
  approved: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  replies?: Comment[];
}

export interface ArticleBlockProps {
  article: ArticleDocument;
  height?: string;
}

export interface ArticleProps {
  article: ArticleDocument;
}

export interface ArticleListProps {
  articles: ArticleDocument[];
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
