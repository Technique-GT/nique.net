export interface Post {
    id: string,
    title: string;
    desc: string;
    author: string;
    category: string;
    coverImage: string;
}

export interface ArticleBlockProps {
    post: Post;
    height: string;
}

export interface ArticleProps {
    post: Post;
}

export interface ArticleListProps {
    posts: Post[];
    width?: string;
}