export type ArticleStatus = 'draft' | 'pending' | 'published' | 'private' | 'trash';

export interface ArticleReference {
    _id?: string;
    name?: string;
    slug?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
}

export interface ArticleAuthor {
    user: ArticleReference | string;
    position: number;
}

export interface ArticleTag extends ArticleReference {}

export interface ArticleMedia {
    id: string;
    url?: string;
    title?: string;
    caption?: string;
    altText?: string;
}

export interface ArticleSubcategory {
    category?: string;
    value?: string;
}

export interface ArticleDocument {
    _id?: string;
    id?: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    authors: ArticleAuthor[];
    categories: ArticleReference[];
    subcategories?: ArticleSubcategory[];
    tags: ArticleTag[];
    featuredImage?: ArticleMedia | null;
    status: ArticleStatus;
    isSticky: boolean;
    allowComments?: boolean;
    viewCount?: number;
    publishedAt: Date | string;
    updatedBy?: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface Post {
    id: string;
    title: string;
    slug?: string;
    excerpt?: string;
    desc: string;
    author: string;
    category: string;
    featuredImage?: ArticleMedia | null;
    publishedAt?: Date | string;
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
