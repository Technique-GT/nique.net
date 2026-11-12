"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCacheTags = exports.buildListCacheTags = exports.buildDetailCacheTags = exports.articleCacheSnapshotFromDoc = void 0;
const sanitizeCacheTagPart = (value) => value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '') // strip non-ASCII
    .replace(/[\s,;"]/g, '-') // replace header-problem chars
    .replace(/-+/g, '-')
    .trim();
const toStringId = (value) => {
    if (!value)
        return null;
    if (typeof value === 'string')
        return value;
    if (typeof value === 'object' && '_id' in value && value._id && value._id !== value) {
        return toStringId(value._id);
    }
    if (typeof value.toString === 'function') {
        const stringValue = value.toString();
        return stringValue && stringValue !== '[object Object]' ? stringValue : null;
    }
    return null;
};
const addIfPresent = (tags, prefix, value) => {
    if (!value)
        return;
    const safeValue = sanitizeCacheTagPart(value);
    if (!safeValue)
        return;
    tags.add(`${prefix}:${safeValue}`);
};
const articleCacheSnapshotFromDoc = (article) => {
    if (!article)
        return null;
    const id = toStringId(article._id);
    if (!id)
        return null;
    const authors = Array.isArray(article.authors) ? article.authors : [];
    const tagIds = Array.isArray(article.tagIds) ? article.tagIds : [];
    return {
        id,
        slug: typeof article.slug === 'string' ? article.slug : '',
        published: Boolean(article.published),
        categoryId: toStringId(article.categoryId),
        tagIds: tagIds.map((tag) => toStringId(tag)).filter((tagId) => Boolean(tagId)),
        authorIds: authors
            .map((author) => toStringId(author?.authorId))
            .filter((authorId) => Boolean(authorId)),
        isFeatured: Boolean(article.isFeatured),
        isSticky: Boolean(article.isSticky),
    };
};
exports.articleCacheSnapshotFromDoc = articleCacheSnapshotFromDoc;
const addArticleTags = (tags, article) => {
    const snapshot = (0, exports.articleCacheSnapshotFromDoc)(article);
    if (!snapshot)
        return;
    tags.add('articles');
    tags.add(`article:${snapshot.id}`);
    addIfPresent(tags, 'article-slug', snapshot.slug || null);
    addIfPresent(tags, 'category', snapshot.categoryId);
    snapshot.tagIds.forEach((tagId) => addIfPresent(tags, 'tag', tagId));
    snapshot.authorIds.forEach((authorId) => addIfPresent(tags, 'author', authorId));
    if (snapshot.isFeatured)
        tags.add('articles:featured');
    if (snapshot.isSticky)
        tags.add('articles:sticky');
};
const buildDetailCacheTags = (article) => {
    const tags = new Set();
    addArticleTags(tags, article);
    return Array.from(tags);
};
exports.buildDetailCacheTags = buildDetailCacheTags;
const buildListCacheTags = (articles, context = {}) => {
    const tags = new Set(['articles']);
    if (context.routeTag)
        tags.add(context.routeTag);
    addIfPresent(tags, 'category', context.categoryId ?? null);
    addIfPresent(tags, 'tag', context.tagId ?? null);
    addIfPresent(tags, 'author', context.authorId ?? null);
    articles.forEach((article) => addArticleTags(tags, article));
    return Array.from(tags);
};
exports.buildListCacheTags = buildListCacheTags;
const setCacheTags = (res, tags) => {
    const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
    if (uniqueTags.length === 0)
        return;
    res.setHeader('Cache-Tag', uniqueTags.join(','));
};
exports.setCacheTags = setCacheTags;
