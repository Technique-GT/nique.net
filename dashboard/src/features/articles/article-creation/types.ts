import type {
  SerializedEditorState as LexicalSerializedEditorState,
  SerializedLexicalNode,
} from "lexical";

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

export type SerializedEditorNode = SerializedLexicalNode;
export type SerializedEditorState =
  LexicalSerializedEditorState<SerializedLexicalNode>;

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
