"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canPublishArticle = exports.canDeleteArticle = exports.canManageAuthors = exports.canEditArticle = void 0;
const canEditArticle = (user, article) => {
    if (user.isAdmin)
        return true;
    if (article.ownerId.toString() === user.id)
        return true;
    return article.authors.some(a => a.authorId.toString() === user.id);
};
exports.canEditArticle = canEditArticle;
const canManageAuthors = (user, article) => {
    if (user.isAdmin)
        return true;
    return article.ownerId.toString() === user.id;
};
exports.canManageAuthors = canManageAuthors;
const canDeleteArticle = (user, article) => {
    if (user.isAdmin)
        return true;
    return article.ownerId.toString() === user.id && article.reviewStatus === 'draft';
};
exports.canDeleteArticle = canDeleteArticle;
const canPublishArticle = (user) => {
    return !!user.isAdmin;
};
exports.canPublishArticle = canPublishArticle;
