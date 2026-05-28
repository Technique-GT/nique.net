export interface PopulatedCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface PopulatedSubCategory {
  category: PopulatedCategory;
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface PopulatedTag {
  _id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  isActive: boolean;
}

export interface PopulatedAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

export interface Article {
  _id: string;
  title: string;
  content: string;
  category: PopulatedCategory;
  subcategory?: PopulatedSubCategory;
  tags: PopulatedTag[];
  authors: PopulatedAuthor[];
  ownerId?: string;
  reviewStatus?: 'draft' | 'in_review' | 'changes_requested' | 'published';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  featuredMediaUrl?: string;
  isPublished: boolean;
  isFeatured: boolean;
  isSticky: boolean;
  status: "published" | "draft";
  allowComments: boolean;
  slug: string;
  views: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
}
export type MessageType = { type: 'success' | 'error', text: string };
