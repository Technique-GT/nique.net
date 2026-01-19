import { IArticle } from '../models/Article';

export const canEditArticle = (user: any, article: IArticle) => {
  if (user.isAdmin) return true;
  if (article.ownerId.toString() === user.id) return true;
  return article.authors.some(a => a.authorId.toString() === user.id);
};

export const canManageAuthors = (user: any, article: IArticle) => {
  if (user.isAdmin) return true;
  return article.ownerId.toString() === user.id;
};

export const canDeleteArticle = (user: any, article: IArticle) => {
  if (user.isAdmin) return true;
  return article.ownerId.toString() === user.id && article.reviewStatus === 'draft';
};

export const canPublishArticle = (user: any) => {
  return !!user.isAdmin;
};
