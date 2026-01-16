// Define types for fetched data
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
}

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  isActive: boolean;
}

export interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

export interface Collaborator {
  _id: string;
  name: string;
  title: string;
  email?: string;
  status: "active" | "inactive";
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  _id: string;
  title: string;
  content: string;
  excerpt: string;
  category: Category;
  subcategory?: SubCategory;
  tags: Tag[];
  authors: Author[];
  collaborators: Collaborator[];
  featuredMedia: {
    id: string;
    url: string;
    alt?: string;
  };
  isPublished: boolean;
  isFeatured: boolean;
  isSticky: boolean;
  status: string;
  allowComments: boolean;
  publishedAt?: string;
  slug: string;
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

// Define SerializedEditorState type based on Lexical's structure
export interface SerializedEditorState {
  root: {
    children: any[];
    direction: string | null;
    format: string;
    indent: number;
    type: string;
    version: number;
  };
}

export type FieldErrorKey =
  | "title"
  | "content"
  | "featuredMedia"
  | "excerpt"
  | "authors"
  | "category"
  | "subcategory"
  | "tags";