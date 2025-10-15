import {
    ArticleAuthor,
    ArticleDocument,
    ArticleMedia,
    ArticleReference,
    ArticleTag,
    Post,
} from '../types/article';

interface MapArticleOptions {
    descriptionFields?: string[];
    trimLength?: number;
    appendEllipsis?: boolean;
}

export interface RawArticle extends Partial<ArticleDocument> {
    _id?: string;
    authors?: Array<Partial<ArticleAuthor>>;
    categories?: ArticleReference[];
    tags?: ArticleTag[];
    featuredImage?: ArticleMedia;
    subcategories?: Array<{ value?: string | null }>;
}

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, '');

const resolveDescription = (article: RawArticle, fields: string[]): string => {
    for (const field of fields) {
        const candidate = article?.[field as keyof RawArticle];
        if (typeof candidate === 'string') {
            return candidate;
        }
    }

    return '';
};

const resolveAuthorName = (article: RawArticle): string => {
    const authors = Array.isArray(article.authors) ? article.authors : [];
    const primaryAuthor = authors[0]?.user;
    const fallback = 'Technique Staff';

    if (!primaryAuthor) {
        return fallback;
    }

    if (typeof primaryAuthor === 'string') {
        return primaryAuthor;
    }

    const reference = primaryAuthor as ArticleReference | undefined;

    const firstAndLast = [reference?.firstName, reference?.lastName]
        .filter(Boolean)
        .join(' ');

    return (
        reference?.username ||
        firstAndLast ||
        reference?.email ||
        fallback
    );
};

export const mapArticleToPost = (
    article: RawArticle,
    options: MapArticleOptions = {}
): Post => {
    const {
        descriptionFields = ['excerpt', 'content'],
        trimLength = 220,
        appendEllipsis = false,
    } = options;

    const descriptionSource = resolveDescription(article, descriptionFields);
    let normalizedDescription = '';

    if (typeof descriptionSource === 'string') {
        normalizedDescription = stripHtml(descriptionSource).slice(0, trimLength);
        if (appendEllipsis) {
            normalizedDescription = `${normalizedDescription}...`;
        }
    }

    const authors = (article.authors as ArticleAuthor[] | undefined) ?? [];
    const categories = article.categories ?? [];
    const tags = article.tags ?? [];
    const featuredImage = article.featuredImage ?? ({} as ArticleMedia);

    return {
        id: article._id ?? '',
        title: article.title ?? '',
        slug: article.slug ?? '',
        content: article.content ?? '',
        excerpt: article.excerpt ?? '',
        authors,
        categories,
        tags,
        featuredImage,
        status: article.status,
        isSticky: article.isSticky,
        allowComments: article.allowComments,
        viewCount: article.viewCount,
        publishedAt: article.publishedAt,
        updatedBy: article.updatedBy,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        desc: normalizedDescription,
        author: resolveAuthorName(article),
        category: categories[0]?.name ?? '',
    };
};
