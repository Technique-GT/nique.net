"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCanonicalArticle = toCanonicalArticle;
exports.toCanonicalCategory = toCanonicalCategory;
exports.toCanonicalTag = toCanonicalTag;
exports.toCanonicalSubcategory = toCanonicalSubcategory;
exports.toCanonicalSliver = toCanonicalSliver;
exports.toCanonicalUser = toCanonicalUser;
exports.toCanonicalComment = toCanonicalComment;
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Read-only transformer.
 *
 * Fetches one document (by collection + id) from MongoDB and prints a JSON
 * transformation into the canonical contract shape. Does NOT write to the DB.
 *
 * Usage:
 *   cd server
 *   ATLAS_URI='...' MONGO_DB_NAME='technique' npx ts-node src/scripts/transform-db.ts articles 690e7436f7fc30a0e018e6ce
 *
 * Optional env vars:
 *   OUTPUT_WARNINGS=true   (default true)
 */
dotenv_1.default.config();
const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
const isHexObjectId = (v) => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);
const objectIdToHex = (v) => {
    if (isHexObjectId(v))
        return v;
    if (v && typeof v === 'object') {
        if (typeof v.toHexString === 'function')
            return v.toHexString();
        if (typeof v.toString === 'function') {
            const s = v.toString();
            if (isHexObjectId(s))
                return s;
        }
    }
    return undefined;
};
const toObjectIdOrUndefined = (v) => {
    if (v === null || v === undefined)
        return undefined;
    if (v instanceof mongoose_1.default.Types.ObjectId)
        return v;
    const hex = objectIdToHex(v);
    if (hex)
        return new mongoose_1.default.Types.ObjectId(hex);
    return undefined;
};
const toObjectIdOrNull = (v) => toObjectIdOrUndefined(v) ?? null;
const toDateOrNull = (v) => {
    if (v === null || v === undefined)
        return null;
    if (v instanceof Date && !Number.isNaN(v.getTime()))
        return v;
    if (typeof v === 'string') {
        const t = Date.parse(v);
        if (!Number.isNaN(t))
            return new Date(t);
    }
    return null;
};
const objectIdTimestampDate = (hexId) => {
    if (!hexId)
        return null;
    const seconds = parseInt(hexId.slice(0, 8), 16);
    if (Number.isNaN(seconds))
        return null;
    return new Date(seconds * 1000);
};
const toIsoOrNull = (v) => {
    if (v === null || v === undefined)
        return null;
    if (v instanceof Date && !Number.isNaN(v.getTime()))
        return v.toISOString();
    if (typeof v === 'string') {
        const t = Date.parse(v);
        if (!Number.isNaN(t))
            return new Date(t).toISOString();
    }
    return null;
};
const objectIdTimestampIso = (hexId) => {
    if (!hexId)
        return null;
    const seconds = parseInt(hexId.slice(0, 8), 16);
    if (Number.isNaN(seconds))
        return null;
    return new Date(seconds * 1000).toISOString();
};
const toBoolWithDefault = (v, defaultValue) => (typeof v === 'boolean' ? v : defaultValue);
const toNumberWithDefault = (v, defaultValue) => typeof v === 'number' && !Number.isNaN(v) ? v : defaultValue;
const readString = (v) => (typeof v === 'string' ? v : undefined);
const readNonEmptyString = (v) => {
    const s = readString(v);
    if (!s)
        return undefined;
    const trimmed = s.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};
const readIsoDate = (v) => {
    const iso = toIsoOrNull(v);
    return iso ?? undefined;
};
const toMongoCategory = (input) => {
    const warnings = [];
    const _id = toObjectIdOrNull(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const name = readNonEmptyString(input?.name) ?? '';
    if (!name)
        warnings.push('missing name');
    const slugRaw = readNonEmptyString(input?.slug) ?? '';
    const slug = slugify(slugRaw);
    if (!slug)
        warnings.push('missing slug');
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
            __v,
            name,
            slug,
        },
        warnings,
    };
};
const toMongoTag = (input) => {
    const warnings = [];
    const _id = toObjectIdOrNull(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const name = readNonEmptyString(input?.name) ?? '';
    if (!name)
        warnings.push('missing name');
    const slugRaw = readNonEmptyString(input?.slug) ?? '';
    const slug = slugify(slugRaw);
    if (!slug)
        warnings.push('missing slug');
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
            __v,
            name,
            slug,
        },
        warnings,
    };
};
const toMongoSubcategory = (input) => {
    const warnings = [];
    const _id = toObjectIdOrNull(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const categoryId = toObjectIdOrUndefined(input?.categoryId) ?? toObjectIdOrUndefined(input?.category);
    if (!categoryId)
        warnings.push('missing categoryId/category');
    const name = readNonEmptyString(input?.name) ?? '';
    if (!name)
        warnings.push('missing name');
    const slugRaw = readNonEmptyString(input?.slug) ?? '';
    const slug = slugify(slugRaw);
    if (!slug)
        warnings.push('missing slug');
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
            __v,
            categoryId: categoryId ?? new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
            name,
            slug,
        },
        warnings,
    };
};
const toMongoSliver = (input) => {
    const warnings = [];
    const _id = toObjectIdOrNull(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const text = readNonEmptyString(input?.text) ?? '';
    if (!text)
        warnings.push('missing text');
    const expiresAt = toDateOrNull(input?.expiresAt);
    if (expiresAt === null)
        warnings.push('expiresAt missing/invalid; keeping null');
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
            __v,
            text,
            expiresAt,
        },
        warnings,
    };
};
const toMongoUser = (input) => {
    const warnings = [];
    const _id = toObjectIdOrNull(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const explicitName = readNonEmptyString(input?.name);
    const firstName = readNonEmptyString(input?.firstName);
    const lastName = readNonEmptyString(input?.lastName);
    const username = readNonEmptyString(input?.username);
    const email = readNonEmptyString(input?.email);
    const composedName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const name = explicitName ?? composedName ?? username ?? email ?? '';
    if (!name)
        warnings.push('missing name');
    const bio = input?.bio === undefined || input?.bio === null ? undefined : readString(input.bio);
    if (input?.bio !== undefined && bio === undefined)
        warnings.push('bio present but not a string');
    let isAdmin;
    if (typeof input?.isAdmin === 'boolean') {
        isAdmin = input.isAdmin;
    }
    else if (typeof input?.role === 'string') {
        isAdmin = ['admin', 'manager', 'editor'].includes(input.role);
        warnings.push('isAdmin missing; derived from role');
    }
    else {
        isAdmin = false;
        warnings.push('isAdmin missing; defaulting to false');
    }
    const profilePictureUrl = readNonEmptyString(input?.profilePictureUrl);
    const socialLinksRaw = input?.socialLinks;
    const socialLinks = [];
    if (Array.isArray(socialLinksRaw)) {
        for (let i = 0; i < socialLinksRaw.length; i += 1) {
            const item = socialLinksRaw[i];
            const platform = readNonEmptyString(item?.platform);
            const url = readNonEmptyString(item?.url);
            if (platform && url) {
                socialLinks.push({ platform, url });
            }
            else {
                warnings.push(`socialLinks[${i}] missing platform/url`);
            }
        }
    }
    else {
        warnings.push('socialLinks missing; defaulting to []');
    }
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
            __v,
            name,
            ...(bio ? { bio } : {}),
            isAdmin,
            ...(profilePictureUrl ? { profilePictureUrl } : {}),
            socialLinks,
        },
        warnings,
    };
};
const toMongoComment = (input) => {
    const warnings = [];
    const _id = toObjectIdOrNull(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const articleId = toObjectIdOrUndefined(input?.articleId) ?? toObjectIdOrUndefined(input?.article);
    if (!articleId)
        warnings.push('missing articleId/article');
    const parentCommentId = toObjectIdOrUndefined(input?.parentCommentId) ?? toObjectIdOrUndefined(input?.parentComment);
    const content = readNonEmptyString(input?.content) ?? '';
    if (!content)
        warnings.push('missing content');
    const username = readNonEmptyString(input?.username) ?? readNonEmptyString(input?.author?.name) ?? 'Anonymous';
    const thumbsUp = typeof input?.thumbsUp === 'number' ? toNumberWithDefault(input.thumbsUp, 0) : 0;
    const thumbsDown = typeof input?.thumbsDown === 'number' ? toNumberWithDefault(input.thumbsDown, 0) : 0;
    let approved;
    if (typeof input?.approved === 'boolean')
        approved = input.approved;
    else if (typeof input?.isApproved === 'boolean')
        approved = input.isApproved;
    else {
        approved = false;
        warnings.push('approved/isApproved missing; defaulting to false');
    }
    const createdAt = toDateOrNull(input?.createdAt) ?? objectIdTimestampDate(_id ? _id.toHexString() : undefined) ?? new Date(0);
    const updatedAt = toDateOrNull(input?.updatedAt) ?? createdAt;
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
            __v,
            articleId: articleId ?? new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
            ...(parentCommentId ? { parentCommentId } : {}),
            content,
            username,
            thumbsUp,
            thumbsDown,
            approved,
            createdAt,
            updatedAt,
        },
        warnings,
    };
};
const toMongoArticle = (input) => {
    const warnings = [];
    const _id = toObjectIdOrNull(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const title = typeof input?.title === 'string' ? input.title : '';
    if (!title)
        warnings.push('missing title');
    const slugRaw = typeof input?.slug === 'string' ? input.slug : '';
    const slug = slugify(slugRaw);
    if (!slug)
        warnings.push('missing slug');
    const content = typeof input?.content === 'string' ? input.content : '';
    if (!content)
        warnings.push('missing content');
    const authorsRaw = Array.isArray(input?.authors) ? input.authors : [];
    if (!Array.isArray(input?.authors))
        warnings.push('authors missing or not an array');
    const authors = authorsRaw
        .map((a, idx) => {
        // canonical
        if (a && typeof a === 'object') {
            const authorId = toObjectIdOrUndefined(a.authorId);
            if (authorId) {
                const order = typeof a.order === 'number' ? a.order : idx;
                return { authorId, order };
            }
        }
        // legacy string/ObjectId
        const asId = toObjectIdOrUndefined(a);
        if (asId)
            return { authorId: asId, order: idx };
        // legacy { user, position }
        if (a && typeof a === 'object') {
            const userId = toObjectIdOrUndefined(a.user);
            if (userId) {
                const order = typeof a.position === 'number' ? a.position : idx;
                return { authorId: userId, order };
            }
        }
        warnings.push(`authors[${idx}] not understood`);
        return null;
    })
        .filter((x) => x !== null)
        .sort((a, b) => a.order - b.order);
    const categoryId = toObjectIdOrUndefined(input?.categoryId) ??
        toObjectIdOrUndefined(input?.category) ??
        (Array.isArray(input?.categories) ? toObjectIdOrUndefined(input.categories[0]) : undefined);
    if (!categoryId)
        warnings.push('missing categoryId/category/categories[0]');
    const subcategoryId = toObjectIdOrUndefined(input?.subcategoryId) ??
        toObjectIdOrUndefined(input?.subcategory) ??
        (Array.isArray(input?.subcategories) ? toObjectIdOrUndefined(input.subcategories[0]) : undefined);
    const tagIdsRaw = Array.isArray(input?.tagIds) ? input.tagIds : Array.isArray(input?.tags) ? input.tags : [];
    const tagIds = tagIdsRaw
        .map((t, idx) => {
        const id = toObjectIdOrUndefined(t);
        if (!id)
            warnings.push(`tagIds/tags[${idx}] not an ObjectId`);
        return id ?? null;
    })
        .filter((x) => x !== null);
    const featuredMediaUrl = readNonEmptyString(input?.featuredMediaUrl);
    const imageCaption = input?.imageCaption === undefined || input?.imageCaption === null
        ? undefined
        : typeof input.imageCaption === 'string'
            ? input.imageCaption
            : (warnings.push('imageCaption present but not a string'), undefined);
    let published;
    if (typeof input?.published === 'boolean')
        published = input.published;
    else if (typeof input?.isPublished === 'boolean')
        published = input.isPublished;
    else if (typeof input?.status === 'string')
        published = input.status === 'published';
    else {
        published = false;
        warnings.push('published state missing; defaulting to false');
    }
    const publishedAt = toDateOrNull(input?.publishedAt);
    if (published && publishedAt === null) {
        warnings.push('published=true but publishedAt missing/invalid; keeping null');
    }
    const allowComments = toBoolWithDefault(input?.allowComments, true);
    const isFeatured = toBoolWithDefault(input?.isFeatured, false);
    const isSticky = toBoolWithDefault(input?.isSticky, false);
    const viewCount = typeof input?.viewCount === 'number'
        ? toNumberWithDefault(input.viewCount, 0)
        : typeof input?.views === 'number'
            ? toNumberWithDefault(input.views, 0)
            : 0;
    const { createdAt: baseCreatedAt, updatedAt: baseUpdatedAt, warnings: timeWarnings } = fillCreatedUpdatedDate(_id ? _id.toHexString() : undefined, input?.createdAt, input?.updatedAt);
    warnings.push(...timeWarnings);
    // Enforce createdAt <= publishedAt (when publishedAt exists)
    let createdAt = baseCreatedAt;
    let updatedAt = baseUpdatedAt;
    if (publishedAt && createdAt.getTime() > publishedAt.getTime()) {
        createdAt = publishedAt;
        warnings.push('createdAt was after publishedAt; clamped createdAt to publishedAt');
        if (updatedAt.getTime() < createdAt.getTime()) {
            updatedAt = createdAt;
            warnings.push('updatedAt was before createdAt; clamped updatedAt to createdAt');
        }
    }
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
            __v,
            title,
            slug,
            content,
            authors,
            categoryId: categoryId ?? new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
            ...(subcategoryId ? { subcategoryId } : {}),
            tagIds,
            ...(featuredMediaUrl ? { featuredMediaUrl } : {}),
            ...(imageCaption ? { imageCaption } : {}),
            published,
            publishedAt,
            allowComments,
            isFeatured,
            isSticky,
            viewCount,
            createdAt,
            updatedAt,
        },
        warnings,
    };
};
const fillCreatedUpdatedIso = (idHex, rawCreatedAt, rawUpdatedAt) => {
    const warnings = [];
    const createdCandidate = readIsoDate(rawCreatedAt) ??
        objectIdTimestampIso(idHex) ??
        readIsoDate(rawUpdatedAt) ??
        new Date(0).toISOString();
    let createdAt = createdCandidate;
    let updatedAt = readIsoDate(rawUpdatedAt) ?? createdAt;
    const createdMs = Date.parse(createdAt);
    const updatedMs = Date.parse(updatedAt);
    if (!Number.isNaN(createdMs) && !Number.isNaN(updatedMs) && updatedMs < createdMs) {
        updatedAt = createdAt;
        warnings.push('updatedAt was before createdAt; clamped updatedAt to createdAt');
    }
    return { createdAt, updatedAt, warnings };
};
const fillCreatedUpdatedDate = (idHex, rawCreatedAt, rawUpdatedAt) => {
    const warnings = [];
    const createdCandidate = toDateOrNull(rawCreatedAt) ??
        objectIdTimestampDate(idHex) ??
        toDateOrNull(rawUpdatedAt) ??
        new Date(0);
    let createdAt = createdCandidate;
    let updatedAt = toDateOrNull(rawUpdatedAt) ?? createdAt;
    if (updatedAt.getTime() < createdAt.getTime()) {
        updatedAt = createdAt;
        warnings.push('updatedAt was before createdAt; clamped updatedAt to createdAt');
    }
    return { createdAt, updatedAt, warnings };
};
function toCanonicalArticle(input) {
    // Default output is JSON-friendly. For migration into Mongo, set OUTPUT_MODE=mongo.
    const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
    if (outputMode === 'mongo') {
        const res = toMongoArticle(input);
        // Cast is safe: the caller expects TransformResult-like.
        return res;
    }
    const warnings = [];
    const _id = objectIdToHex(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const title = typeof input?.title === 'string' ? input.title : '';
    if (!title)
        warnings.push('missing title');
    const slugRaw = typeof input?.slug === 'string' ? input.slug : '';
    const slug = slugify(slugRaw);
    if (!slug)
        warnings.push('missing slug');
    const content = typeof input?.content === 'string' ? input.content : '';
    if (!content)
        warnings.push('missing content');
    const authorsRaw = Array.isArray(input?.authors) ? input.authors : [];
    if (!Array.isArray(input?.authors))
        warnings.push('authors missing or not an array');
    const authors = authorsRaw
        .map((a, idx) => {
        // canonical
        if (a && typeof a === 'object') {
            const authorId = objectIdToHex(a.authorId);
            if (authorId) {
                const order = typeof a.order === 'number' ? a.order : idx;
                return { authorId, order };
            }
        }
        // legacy string ObjectId
        const asId = objectIdToHex(a);
        if (asId)
            return { authorId: asId, order: idx };
        // legacy { user, position }
        if (a && typeof a === 'object') {
            const userId = objectIdToHex(a.user);
            if (userId) {
                const order = typeof a.position === 'number' ? a.position : idx;
                return { authorId: userId, order };
            }
        }
        warnings.push(`authors[${idx}] not understood`);
        return null;
    })
        .filter((x) => x !== null)
        .sort((a, b) => a.order - b.order);
    const categoryId = objectIdToHex(input?.categoryId) ??
        objectIdToHex(input?.category) ??
        (Array.isArray(input?.categories) ? objectIdToHex(input.categories[0]) : undefined);
    if (!categoryId)
        warnings.push('missing categoryId/category/categories[0]');
    const subcategoryId = objectIdToHex(input?.subcategoryId) ??
        objectIdToHex(input?.subcategory) ??
        (Array.isArray(input?.subcategories) ? objectIdToHex(input.subcategories[0]) : undefined);
    const tagIdsRaw = Array.isArray(input?.tagIds) ? input.tagIds : Array.isArray(input?.tags) ? input.tags : [];
    const tagIds = tagIdsRaw
        .map((t, idx) => {
        const id = objectIdToHex(t);
        if (!id)
            warnings.push(`tagIds/tags[${idx}] not an ObjectId`);
        return id ?? null;
    })
        .filter((x) => x !== null);
    const featuredMediaUrl = readNonEmptyString(input?.featuredMediaUrl);
    const imageCaption = input?.imageCaption === undefined || input?.imageCaption === null
        ? undefined
        : typeof input.imageCaption === 'string'
            ? input.imageCaption
            : (warnings.push('imageCaption present but not a string'), undefined);
    let published;
    if (typeof input?.published === 'boolean')
        published = input.published;
    else if (typeof input?.isPublished === 'boolean')
        published = input.isPublished;
    else if (typeof input?.status === 'string')
        published = input.status === 'published';
    else {
        published = false;
        warnings.push('published state missing; defaulting to false');
    }
    const publishedAt = toIsoOrNull(input?.publishedAt);
    if (published && publishedAt === null) {
        warnings.push('published=true but publishedAt missing/invalid; keeping null');
    }
    const allowComments = toBoolWithDefault(input?.allowComments, true);
    const isFeatured = toBoolWithDefault(input?.isFeatured, false);
    const isSticky = toBoolWithDefault(input?.isSticky, false);
    const viewCount = typeof input?.viewCount === 'number'
        ? toNumberWithDefault(input.viewCount, 0)
        : typeof input?.views === 'number'
            ? toNumberWithDefault(input.views, 0)
            : 0;
    const { createdAt: rawCreatedAt, updatedAt: rawUpdatedAt, warnings: timeWarnings } = fillCreatedUpdatedIso(_id, input?.createdAt, input?.updatedAt);
    warnings.push(...timeWarnings);
    // Enforce createdAt <= publishedAt (when publishedAt exists)
    let createdAt = rawCreatedAt;
    let updatedAt = rawUpdatedAt;
    if (publishedAt) {
        const createdMs = Date.parse(createdAt);
        const publishedMs = Date.parse(publishedAt);
        if (!Number.isNaN(createdMs) && !Number.isNaN(publishedMs) && createdMs > publishedMs) {
            createdAt = publishedAt;
            warnings.push('createdAt was after publishedAt; clamped createdAt to publishedAt');
            const updatedMs = Date.parse(updatedAt);
            if (!Number.isNaN(updatedMs) && updatedMs < publishedMs) {
                updatedAt = createdAt;
                warnings.push('updatedAt was before createdAt; clamped updatedAt to createdAt');
            }
        }
    }
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    const value = {
        _id: _id ?? '000000000000000000000000',
        __v,
        title,
        slug,
        content,
        authors,
        categoryId: categoryId ?? '000000000000000000000000',
        ...(subcategoryId ? { subcategoryId } : {}),
        tagIds,
        ...(featuredMediaUrl ? { featuredMediaUrl } : {}),
        ...(imageCaption ? { imageCaption } : {}),
        published,
        publishedAt,
        allowComments,
        isFeatured,
        isSticky,
        viewCount,
        createdAt,
        updatedAt,
    };
    return { value, warnings };
}
function toCanonicalCategory(input) {
    const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
    if (outputMode === 'mongo') {
        const res = toMongoCategory(input);
        return res;
    }
    const warnings = [];
    const _id = objectIdToHex(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const name = readNonEmptyString(input?.name) ?? '';
    if (!name)
        warnings.push('missing name');
    const slugRaw = readNonEmptyString(input?.slug) ?? '';
    const slug = slugify(slugRaw);
    if (!slug)
        warnings.push('missing slug');
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? '000000000000000000000000',
            __v,
            name,
            slug,
        },
        warnings,
    };
}
function toCanonicalTag(input) {
    const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
    if (outputMode === 'mongo') {
        const res = toMongoTag(input);
        return res;
    }
    const warnings = [];
    const _id = objectIdToHex(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const name = readNonEmptyString(input?.name) ?? '';
    if (!name)
        warnings.push('missing name');
    const slugRaw = readNonEmptyString(input?.slug) ?? '';
    const slug = slugify(slugRaw);
    if (!slug)
        warnings.push('missing slug');
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? '000000000000000000000000',
            __v,
            name,
            slug,
        },
        warnings,
    };
}
function toCanonicalSubcategory(input) {
    const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
    if (outputMode === 'mongo') {
        const res = toMongoSubcategory(input);
        return res;
    }
    const warnings = [];
    const _id = objectIdToHex(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const categoryId = objectIdToHex(input?.categoryId) ?? objectIdToHex(input?.category);
    if (!categoryId)
        warnings.push('missing categoryId/category');
    const name = readNonEmptyString(input?.name) ?? '';
    if (!name)
        warnings.push('missing name');
    const slugRaw = readNonEmptyString(input?.slug) ?? '';
    const slug = slugify(slugRaw);
    if (!slug)
        warnings.push('missing slug');
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? '000000000000000000000000',
            __v,
            categoryId: categoryId ?? '000000000000000000000000',
            name,
            slug,
        },
        warnings,
    };
}
function toCanonicalSliver(input) {
    const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
    if (outputMode === 'mongo') {
        const res = toMongoSliver(input);
        return res;
    }
    const warnings = [];
    const _id = objectIdToHex(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const text = readNonEmptyString(input?.text) ?? '';
    if (!text)
        warnings.push('missing text');
    const expiresAt = toIsoOrNull(input?.expiresAt);
    if (expiresAt === null)
        warnings.push('expiresAt missing/invalid; returning null');
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? '000000000000000000000000',
            __v,
            text,
            expiresAt,
        },
        warnings,
    };
}
function toCanonicalUser(input) {
    const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
    if (outputMode === 'mongo') {
        const res = toMongoUser(input);
        return res;
    }
    const warnings = [];
    const _id = objectIdToHex(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const explicitName = readNonEmptyString(input?.name);
    const firstName = readNonEmptyString(input?.firstName);
    const lastName = readNonEmptyString(input?.lastName);
    const username = readNonEmptyString(input?.username);
    const email = readNonEmptyString(input?.email);
    const composedName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const name = explicitName ?? composedName ?? username ?? email ?? '';
    if (!name)
        warnings.push('missing name');
    const bio = input?.bio === undefined || input?.bio === null ? undefined : readString(input.bio);
    if (input?.bio !== undefined && bio === undefined)
        warnings.push('bio present but not a string');
    // canonical isAdmin; legacy role often indicates admin
    let isAdmin;
    if (typeof input?.isAdmin === 'boolean') {
        isAdmin = input.isAdmin;
    }
    else if (typeof input?.role === 'string') {
        isAdmin = ['admin', 'manager', 'editor'].includes(input.role);
        warnings.push('isAdmin missing; derived from role');
    }
    else {
        isAdmin = false;
        warnings.push('isAdmin missing; defaulting to false');
    }
    const profilePictureUrl = readNonEmptyString(input?.profilePictureUrl);
    const socialLinksRaw = input?.socialLinks;
    const socialLinks = [];
    if (Array.isArray(socialLinksRaw)) {
        for (let i = 0; i < socialLinksRaw.length; i += 1) {
            const item = socialLinksRaw[i];
            const platform = readNonEmptyString(item?.platform);
            const url = readNonEmptyString(item?.url);
            if (platform && url) {
                socialLinks.push({ platform, url });
            }
            else {
                warnings.push(`socialLinks[${i}] missing platform/url`);
            }
        }
    }
    else {
        warnings.push('socialLinks missing; defaulting to []');
    }
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? '000000000000000000000000',
            __v,
            name,
            ...(bio ? { bio } : {}),
            isAdmin,
            ...(profilePictureUrl ? { profilePictureUrl } : {}),
            socialLinks,
        },
        warnings,
    };
}
function toCanonicalComment(input) {
    const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
    if (outputMode === 'mongo') {
        const res = toMongoComment(input);
        return res;
    }
    const warnings = [];
    const _id = objectIdToHex(input?._id);
    if (!_id)
        warnings.push('missing _id or not an ObjectId');
    const articleId = objectIdToHex(input?.articleId) ?? objectIdToHex(input?.article);
    if (!articleId)
        warnings.push('missing articleId/article');
    const parentCommentId = objectIdToHex(input?.parentCommentId) ?? objectIdToHex(input?.parentComment);
    const content = readNonEmptyString(input?.content) ?? '';
    if (!content)
        warnings.push('missing content');
    const username = readNonEmptyString(input?.username) ??
        readNonEmptyString(input?.author?.name) ??
        'Anonymous';
    const thumbsUp = typeof input?.thumbsUp === 'number' ? toNumberWithDefault(input.thumbsUp, 0) : 0;
    const thumbsDown = typeof input?.thumbsDown === 'number' ? toNumberWithDefault(input.thumbsDown, 0) : 0;
    let approved;
    if (typeof input?.approved === 'boolean')
        approved = input.approved;
    else if (typeof input?.isApproved === 'boolean')
        approved = input.isApproved;
    else {
        approved = false;
        warnings.push('approved/isApproved missing; defaulting to false');
    }
    const createdAt = readIsoDate(input?.createdAt) ??
        objectIdTimestampIso(_id) ??
        new Date(0).toISOString();
    const updatedAt = readIsoDate(input?.updatedAt) ?? createdAt;
    const __v = typeof input?.__v === 'number' ? input.__v : 0;
    return {
        value: {
            _id: _id ?? '000000000000000000000000',
            __v,
            articleId: articleId ?? '000000000000000000000000',
            ...(parentCommentId ? { parentCommentId } : {}),
            content,
            username,
            thumbsUp,
            thumbsDown,
            approved,
            createdAt,
            updatedAt,
        },
        warnings,
    };
}
const usage = () => {
    // eslint-disable-next-line no-console
    console.error([
        'Usage (single document):',
        '  npx ts-node src/scripts/transform-db.ts <collection> <id>',
        'Example:',
        '  npx ts-node src/scripts/transform-db.ts articles 690e7436f7fc30a0e018e6ce',
        '',
        'Usage (sample mode):',
        '  npx ts-node src/scripts/transform-db.ts',
        'Env vars:',
        '  SAMPLE_COUNT=5        (default 5)',
        '  SAMPLE_RANDOM=false   (default false; when true uses $sample)',
        '  OUTPUT_WARNINGS=true  (default true)',
    ].join('\n'));
};
const transformByCollection = (collectionName, doc) => {
    switch (collectionName) {
        case 'articles':
            return toCanonicalArticle(doc);
        case 'categories':
            return toCanonicalCategory(doc);
        case 'tags':
            return toCanonicalTag(doc);
        case 'subcategories':
            return toCanonicalSubcategory(doc);
        case 'slivers':
            return toCanonicalSliver(doc);
        case 'users':
            return toCanonicalUser(doc);
        case 'comments':
            return toCanonicalComment(doc);
        default:
            return { value: doc, warnings: [`No transformer defined for collection '${collectionName}'`] };
    }
};
const DEFAULT_COLLECTIONS = ['users', 'comments', 'slivers', 'subcategories', 'categories', 'tags', 'articles'];
async function main() {
    const [maybeCollectionName, maybeId] = process.argv.slice(2);
    const uri = process.env.ATLAS_URI;
    if (!uri)
        throw new Error('Missing ATLAS_URI in env');
    const dbName = process.env.MONGO_DB_NAME;
    const connectOptions = dbName ? { dbName } : {};
    await mongoose_1.default.connect(uri, connectOptions);
    const outputWarnings = process.env.OUTPUT_WARNINGS !== 'false';
    // Single-document mode
    if (maybeCollectionName && maybeId) {
        const collection = mongoose_1.default.connection.db.collection(maybeCollectionName);
        const objectId = isHexObjectId(maybeId) ? new mongoose_1.default.Types.ObjectId(maybeId) : maybeId;
        const doc = await collection.findOne({ _id: objectId });
        if (!doc && maybeCollectionName === 'articles' && isHexObjectId(maybeId)) {
            // Legacy technique articles sometimes use `categories`/`subcategories` and a title-like slug.
            // Allow finding by _id, then try by slug as a fallback.
            const docBySlug = await collection.findOne({ slug: maybeId });
            if (docBySlug) {
                const result = transformByCollection(maybeCollectionName, docBySlug);
                // eslint-disable-next-line no-console
                console.log(JSON.stringify(outputWarnings ? result : result.value, null, 2));
                await mongoose_1.default.disconnect();
                return;
            }
        }
        if (!doc) {
            // eslint-disable-next-line no-console
            console.error(`Document not found: ${maybeCollectionName} ${maybeId}`);
            process.exitCode = 1;
            await mongoose_1.default.disconnect();
            return;
        }
        const result = transformByCollection(maybeCollectionName, doc);
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(outputWarnings ? result : result.value, null, 2));
        await mongoose_1.default.disconnect();
        return;
    }
    // Sample mode
    if (maybeCollectionName || maybeId) {
        usage();
        process.exitCode = 1;
        await mongoose_1.default.disconnect();
        return;
    }
    const sampleCount = Math.max(parseInt(process.env.SAMPLE_COUNT || '5', 10) || 5, 1);
    const sampleRandom = process.env.SAMPLE_RANDOM === 'true';
    const db = mongoose_1.default.connection.db;
    const output = {};
    for (const collectionName of DEFAULT_COLLECTIONS) {
        const collection = db.collection(collectionName);
        const docs = sampleRandom
            ? await collection.aggregate([{ $sample: { size: sampleCount } }]).toArray()
            : await collection.find({}).sort({ _id: 1 }).limit(sampleCount).toArray();
        output[collectionName] = docs.map((doc) => {
            const sourceId = String(doc?._id ?? 'unknown');
            const result = transformByCollection(collectionName, doc);
            return {
                sourceId,
                transformed: result.value,
                warnings: outputWarnings ? result.warnings : [],
            };
        });
    }
    const result = {
        meta: {
            dbName: dbName ?? '(default from uri)',
            sampleCount,
            sampleRandom,
            generatedAt: new Date().toISOString(),
        },
        output,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
    await mongoose_1.default.disconnect();
}
if (require.main === module) {
    main().catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        process.exitCode = 1;
    });
}
