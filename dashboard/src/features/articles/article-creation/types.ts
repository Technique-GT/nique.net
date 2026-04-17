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
  categoryId?: string;
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

export interface SerializedEditorNode {
  type?: string;
  text?: string;
  format?: number | string;
  style?: string;
  children?: SerializedEditorNode[];
  [key: string]: unknown;
}

// Define SerializedEditorState type based on Lexical's structure
export interface SerializedEditorState {
  root: {
    children: SerializedEditorNode[];
    direction: "ltr" | "rtl" | null;
    format: number | string | null;
    indent: number;
    type: string;
    version: number;
  };
}

export interface Article {
  _id: string;
  title: string;
  content: string;
  imageCaption?: string;
  category: Category;
  subcategory?: SubCategory;
  tags: Tag[];
  authors: Author[];
  ownerId?: string;
  editorState?: SerializedEditorState;
  reviewStatus?: 'draft' | 'in_review' | 'changes_requested' | 'published';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  featuredMediaUrl?: string;
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

export type FieldErrorKey =
  | "title"
  | "content"
  | "featuredMedia"
  | "authors"
  | "category"
  | "subcategory"
  | "tags";
