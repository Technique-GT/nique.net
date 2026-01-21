import type { ArticleDocument, User } from '../types/article';

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const getArticleId = (article: ArticleDocument) =>
  article._id || article.slug || '';

export const getArticleLink = (article: ArticleDocument) => {
  const categorySlug =
    article.categoryId && typeof article.categoryId === 'object'
      ? article.categoryId.slug
      : '';
  if (categorySlug && article.slug) {
    return `/${categorySlug}/${article.slug}`;
  }
  return `/${getArticleId(article)}`;
};

export const getArticleAuthorName = (article: ArticleDocument) => {
  const primary = article.authors?.[0];
  if (!primary) return 'Technique Staff';
  const authorId = primary.authorId;
  if (authorId && typeof authorId === 'object') {
    const user = authorId as User;
    if (user.name) return user.name;
  }
  if (typeof authorId === 'string' && authorId.trim()) {
    return authorId;
  }
  return 'Technique Staff';
};

export const getArticleCategoryName = (article: ArticleDocument) =>
  article.categoryId && typeof article.categoryId === 'object'
    ? article.categoryId.name
    : '';

export const getArticleDescription = (article: ArticleDocument) => {
  const raw = article.content || '';
  return stripHtml(raw);
};

export const getArticleImage = (article: ArticleDocument) => {
  const media = article.featuredMediaId;
  if (media && typeof media === 'object' && 'url' in media) {
    // console.log('Article featured media:', media);
    return media;
  }
  return null;
};

export const getArticleTimestamp = (article: ArticleDocument) => {
  const raw = article.publishedAt ?? article.createdAt ?? 0;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};
