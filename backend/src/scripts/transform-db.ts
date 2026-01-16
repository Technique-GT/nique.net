import dotenv from 'dotenv';
import mongoose from 'mongoose';

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

dotenv.config();

export type TransformResult<T> = { value: T; warnings: string[] };

type CanonicalAuthorRef = {
  authorId: string; // ObjectId hex string
  order: number;
};

export type CanonicalArticle = {
  _id: string;
  __v: number;

  title: string;
  slug: string;
  content: string;
  excerpt?: string;

  authors: CanonicalAuthorRef[];
  categoryId: string;
  subcategoryId?: string;
  tagIds: string[];

  featuredMediaId?: string;
  imageCaption?: string;

  published: boolean;
  publishedAt: string | null;

  allowComments: boolean;
  isFeatured: boolean;
  isSticky: boolean;

  viewCount: number;

  createdAt: string;
  updatedAt: string;
};

type MongoId = mongoose.Types.ObjectId;

type MongoAuthorRef = {
  authorId: MongoId;
  order: number;
};

export type MongoArticle = {
  _id: MongoId;
  __v: number;

  title: string;
  slug: string;
  content: string;
  excerpt?: string;

  authors: MongoAuthorRef[];
  categoryId: MongoId;
  subcategoryId?: MongoId;
  tagIds: MongoId[];

  featuredMediaId?: MongoId;
  imageCaption?: string;

  published: boolean;
  publishedAt: Date | null;

  allowComments: boolean;
  isFeatured: boolean;
  isSticky: boolean;

  viewCount: number;

  createdAt: Date;
  updatedAt: Date;
};

export type CanonicalCategory = {
  _id: string;
  __v: number;
  name: string;
  slug: string;
};

export type CanonicalTag = {
  _id: string;
  __v: number;
  name: string;
  slug: string;
};

export type CanonicalSubcategory = {
  _id: string;
  __v: number;
  categoryId: string;
  name: string;
  slug: string;
};

export type CanonicalMedia = {
  _id: string;
  __v: number;
  url: string;
  altText: string;
};

export type CanonicalSliver = {
  _id: string;
  __v: number;
  text: string;
  expiresAt: string | null;
};

export type CanonicalUser = {
  _id: string;
  __v: number;
  name: string;
  bio?: string;
  isAdmin: boolean;
  profilePictureMediaId?: string;
  socialLinks: Array<{ platform: string; url: string }>;
};

export type CanonicalComment = {
  _id: string;
  __v: number;
  articleId: string;
  parentCommentId?: string;
  content: string;
  username: string;
  thumbsUp: number;
  thumbsDown: number;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MongoCategory = { _id: MongoId; __v: number; name: string; slug: string };
export type MongoTag = { _id: MongoId; __v: number; name: string; slug: string };
export type MongoSubcategory = { _id: MongoId; __v: number; categoryId: MongoId; name: string; slug: string };
export type MongoMedia = { _id: MongoId; __v: number; url: string; altText: string };
export type MongoSliver = { _id: MongoId; __v: number; text: string; expiresAt: Date | null };
export type MongoUser = {
  _id: MongoId;
  __v: number;
  name: string;
  bio?: string;
  isAdmin: boolean;
  profilePictureMediaId?: MongoId;
  socialLinks: Array<{ platform: string; url: string }>;
};
export type MongoComment = {
  _id: MongoId;
  __v: number;
  articleId: MongoId;
  parentCommentId?: MongoId;
  content: string;
  username: string;
  thumbsUp: number;
  thumbsDown: number;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const isHexObjectId = (v: unknown): v is string => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);

const objectIdToHex = (v: any): string | undefined => {
  if (isHexObjectId(v)) return v;
  if (v && typeof v === 'object') {
    if (typeof v.toHexString === 'function') return v.toHexString();
    if (typeof v.toString === 'function') {
      const s = v.toString();
      if (isHexObjectId(s)) return s;
    }
  }
  return undefined;
};

const toObjectIdOrUndefined = (v: any): mongoose.Types.ObjectId | undefined => {
  if (v === null || v === undefined) return undefined;
  if (v instanceof mongoose.Types.ObjectId) return v;

  const hex = objectIdToHex(v);
  if (hex) return new mongoose.Types.ObjectId(hex);

  return undefined;
};

const toObjectIdOrNull = (v: any): mongoose.Types.ObjectId | null => toObjectIdOrUndefined(v) ?? null;

const toDateOrNull = (v: unknown): Date | null => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return new Date(t);
  }
  return null;
};

const objectIdTimestampDate = (hexId: string | undefined): Date | null => {
  if (!hexId) return null;
  const seconds = parseInt(hexId.slice(0, 8), 16);
  if (Number.isNaN(seconds)) return null;
  return new Date(seconds * 1000);
};

const toIsoOrNull = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }
  return null;
};

const objectIdTimestampIso = (hexId: string | undefined): string | null => {
  if (!hexId) return null;
  const seconds = parseInt(hexId.slice(0, 8), 16);
  if (Number.isNaN(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
};

const toBoolWithDefault = (v: unknown, defaultValue: boolean): boolean => (typeof v === 'boolean' ? v : defaultValue);

const toNumberWithDefault = (v: unknown, defaultValue: number): number =>
  typeof v === 'number' && !Number.isNaN(v) ? v : defaultValue;

const readString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

const readNonEmptyString = (v: unknown): string | undefined => {
  const s = readString(v);
  if (!s) return undefined;
  const trimmed = s.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readIsoDate = (v: unknown): string | undefined => {
  const iso = toIsoOrNull(v);
  return iso ?? undefined;
};

const toMongoCategory = (input: any): TransformResult<MongoCategory> => {
  const warnings: string[] = [];

  const _id = toObjectIdOrNull(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const name = readNonEmptyString(input?.name) ?? '';
  if (!name) warnings.push('missing name');

  const slugRaw = readNonEmptyString(input?.slug) ?? '';
  const slug = slugify(slugRaw);
  if (!slug) warnings.push('missing slug');

  const __v = typeof input?.__v === 'number' ? input.__v : 0;

  return {
    value: {
      _id: _id ?? new mongoose.Types.ObjectId('000000000000000000000000'),
      __v,
      name,
      slug,
    },
    warnings,
  };
};

const toMongoTag = (input: any): TransformResult<MongoTag> => {
  const warnings: string[] = [];

  const _id = toObjectIdOrNull(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const name = readNonEmptyString(input?.name) ?? '';
  if (!name) warnings.push('missing name');

  const slugRaw = readNonEmptyString(input?.slug) ?? '';
  const slug = slugify(slugRaw);
  if (!slug) warnings.push('missing slug');

  const __v = typeof input?.__v === 'number' ? input.__v : 0;

  return {
    value: {
      _id: _id ?? new mongoose.Types.ObjectId('000000000000000000000000'),
      __v,
      name,
      slug,
    },
    warnings,
  };
};

const toMongoSubcategory = (input: any): TransformResult<MongoSubcategory> => {
  const warnings: string[] = [];

  const _id = toObjectIdOrNull(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const categoryId = toObjectIdOrUndefined(input?.categoryId) ?? toObjectIdOrUndefined(input?.category);
  if (!categoryId) warnings.push('missing categoryId/category');

  const name = readNonEmptyString(input?.name) ?? '';
  if (!name) warnings.push('missing name');

  const slugRaw = readNonEmptyString(input?.slug) ?? '';
  const slug = slugify(slugRaw);
  if (!slug) warnings.push('missing slug');

  const __v = typeof input?.__v === 'number' ? input.__v : 0;

  return {
    value: {
      _id: _id ?? new mongoose.Types.ObjectId('000000000000000000000000'),
      __v,
      categoryId: categoryId ?? new mongoose.Types.ObjectId('000000000000000000000000'),
      name,
      slug,
    },
    warnings,
  };
};

const toMongoMedia = (input: any): TransformResult<MongoMedia> => {
  const warnings: string[] = [];

  const _id = toObjectIdOrNull(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const url = readNonEmptyString(input?.url) ?? '';
  if (!url) warnings.push('missing url');

  const altText =
    readString(input?.altText) ??
    readString(input?.title) ??
    readString(input?.originalName) ??
    readString(input?.filename) ??
    '';

  if (!altText) warnings.push('missing altText (no altText/title/originalName/filename fallback)');

  const __v = typeof input?.__v === 'number' ? input.__v : 0;

  return {
    value: {
      _id: _id ?? new mongoose.Types.ObjectId('000000000000000000000000'),
      __v,
      url,
      altText,
    },
    warnings,
  };
};

const toMongoSliver = (input: any): TransformResult<MongoSliver> => {
  const warnings: string[] = [];

  const _id = toObjectIdOrNull(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const text = readNonEmptyString(input?.text) ?? '';
  if (!text) warnings.push('missing text');

  const expiresAt = toDateOrNull(input?.expiresAt);
  if (expiresAt === null) warnings.push('expiresAt missing/invalid; keeping null');

  const __v = typeof input?.__v === 'number' ? input.__v : 0;

  return {
    value: {
      _id: _id ?? new mongoose.Types.ObjectId('000000000000000000000000'),
      __v,
      text,
      expiresAt,
    },
    warnings,
  };
};

const toMongoUser = (input: any): TransformResult<MongoUser> => {
  const warnings: string[] = [];

  const _id = toObjectIdOrNull(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const explicitName = readNonEmptyString(input?.name);
  const firstName = readNonEmptyString(input?.firstName);
  const lastName = readNonEmptyString(input?.lastName);
  const username = readNonEmptyString(input?.username);
  const email = readNonEmptyString(input?.email);

  const composedName = [firstName, lastName].filter(Boolean).join(' ').trim();

  const name = explicitName ?? composedName ?? username ?? email ?? '';
  if (!name) warnings.push('missing name');

  const bio = input?.bio === undefined || input?.bio === null ? undefined : readString(input.bio);
  if (input?.bio !== undefined && bio === undefined) warnings.push('bio present but not a string');

  let isAdmin: boolean;
  if (typeof input?.isAdmin === 'boolean') {
    isAdmin = input.isAdmin;
  } else if (typeof input?.role === 'string') {
    isAdmin = ['admin', 'manager', 'editor'].includes(input.role);
    warnings.push('isAdmin missing; derived from role');
  } else {
    isAdmin = false;
    warnings.push('isAdmin missing; defaulting to false');
  }

  const profilePictureMediaId = toObjectIdOrUndefined(input?.profilePictureMediaId) ?? toObjectIdOrUndefined(input?.profilePicture);

  const socialLinksRaw = input?.socialLinks;
  const socialLinks: Array<{ platform: string; url: string }> = [];

  if (Array.isArray(socialLinksRaw)) {
    for (let i = 0; i < socialLinksRaw.length; i += 1) {
      const item = socialLinksRaw[i];
      const platform = readNonEmptyString(item?.platform);
      const url = readNonEmptyString(item?.url);
      if (platform && url) {
        socialLinks.push({ platform, url });
      } else {
        warnings.push(`socialLinks[${i}] missing platform/url`);
      }
    }
  } else {
    warnings.push('socialLinks missing; defaulting to []');
  }

  const __v = typeof input?.__v === 'number' ? input.__v : 0;

  return {
    value: {
      _id: _id ?? new mongoose.Types.ObjectId('000000000000000000000000'),
      __v,
      name,
      ...(bio ? { bio } : {}),
      isAdmin,
      ...(profilePictureMediaId ? { profilePictureMediaId } : {}),
      socialLinks,
    },
    warnings,
  };
};

const toMongoComment = (input: any): TransformResult<MongoComment> => {
  const warnings: string[] = [];

  const _id = toObjectIdOrNull(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const articleId = toObjectIdOrUndefined(input?.articleId) ?? toObjectIdOrUndefined(input?.article);
  if (!articleId) warnings.push('missing articleId/article');

  const parentCommentId = toObjectIdOrUndefined(input?.parentCommentId) ?? toObjectIdOrUndefined(input?.parentComment);

  const content = readNonEmptyString(input?.content) ?? '';
  if (!content) warnings.push('missing content');

  const username = readNonEmptyString(input?.username) ?? readNonEmptyString(input?.author?.name) ?? 'Anonymous';

  const thumbsUp = typeof input?.thumbsUp === 'number' ? toNumberWithDefault(input.thumbsUp, 0) : 0;
  const thumbsDown = typeof input?.thumbsDown === 'number' ? toNumberWithDefault(input.thumbsDown, 0) : 0;

  let approved: boolean;
  if (typeof input?.approved === 'boolean') approved = input.approved;
  else if (typeof input?.isApproved === 'boolean') approved = input.isApproved;
  else {
    approved = false;
    warnings.push('approved/isApproved missing; defaulting to false');
  }

  const createdAt = toDateOrNull(input?.createdAt) ?? objectIdTimestampDate(_id ? _id.toHexString() : undefined) ?? new Date(0);
  const updatedAt = toDateOrNull(input?.updatedAt) ?? createdAt;

  const __v = typeof input?.__v === 'number' ? input.__v : 0;

  return {
    value: {
      _id: _id ?? new mongoose.Types.ObjectId('000000000000000000000000'),
      __v,
      articleId: articleId ?? new mongoose.Types.ObjectId('000000000000000000000000'),
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

const toMongoArticle = (input: any): TransformResult<MongoArticle> => {
  const warnings: string[] = [];

  const _id = toObjectIdOrNull(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const title = typeof input?.title === 'string' ? input.title : '';
  if (!title) warnings.push('missing title');

  const slugRaw = typeof input?.slug === 'string' ? input.slug : '';
  const slug = slugify(slugRaw);
  if (!slug) warnings.push('missing slug');

  const content = typeof input?.content === 'string' ? input.content : '';
  if (!content) warnings.push('missing content');

  const excerpt =
    input?.excerpt === undefined || input?.excerpt === null
      ? undefined
      : typeof input.excerpt === 'string'
        ? input.excerpt
        : (warnings.push('excerpt present but not a string'), undefined);

  const authorsRaw = Array.isArray(input?.authors) ? input.authors : [];
  if (!Array.isArray(input?.authors)) warnings.push('authors missing or not an array');

  const authors: MongoAuthorRef[] = authorsRaw
    .map((a: any, idx: number) => {
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
      if (asId) return { authorId: asId, order: idx };

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
    .filter((x: MongoAuthorRef | null): x is MongoAuthorRef => x !== null)
    .sort((a: MongoAuthorRef, b: MongoAuthorRef) => a.order - b.order);

  const categoryId =
    toObjectIdOrUndefined(input?.categoryId) ??
    toObjectIdOrUndefined(input?.category) ??
    (Array.isArray(input?.categories) ? toObjectIdOrUndefined(input.categories[0]) : undefined);

  if (!categoryId) warnings.push('missing categoryId/category/categories[0]');

  const subcategoryId =
    toObjectIdOrUndefined(input?.subcategoryId) ??
    toObjectIdOrUndefined(input?.subcategory) ??
    (Array.isArray(input?.subcategories) ? toObjectIdOrUndefined(input.subcategories[0]) : undefined);

  const tagIdsRaw = Array.isArray(input?.tagIds) ? input.tagIds : Array.isArray(input?.tags) ? input.tags : [];
  const tagIds = tagIdsRaw
    .map((t: any, idx: number) => {
      const id = toObjectIdOrUndefined(t);
      if (!id) warnings.push(`tagIds/tags[${idx}] not an ObjectId`);
      return id ?? null;
    })
    .filter((x: mongoose.Types.ObjectId | null): x is mongoose.Types.ObjectId => x !== null);

  const featuredMediaId = toObjectIdOrUndefined(input?.featuredMediaId) ?? toObjectIdOrUndefined(input?.featuredImage);

  const imageCaption =
    input?.imageCaption === undefined || input?.imageCaption === null
      ? undefined
      : typeof input.imageCaption === 'string'
        ? input.imageCaption
        : (warnings.push('imageCaption present but not a string'), undefined);

  let published: boolean;
  if (typeof input?.published === 'boolean') published = input.published;
  else if (typeof input?.isPublished === 'boolean') published = input.isPublished;
  else if (typeof input?.status === 'string') published = input.status === 'published';
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

  const viewCount =
    typeof input?.viewCount === 'number'
      ? toNumberWithDefault(input.viewCount, 0)
      : typeof input?.views === 'number'
        ? toNumberWithDefault(input.views, 0)
        : 0;

  const { createdAt: baseCreatedAt, updatedAt: baseUpdatedAt, warnings: timeWarnings } = fillCreatedUpdatedDate(
    _id ? _id.toHexString() : undefined,
    input?.createdAt,
    input?.updatedAt,
  );
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
      _id: _id ?? new mongoose.Types.ObjectId('000000000000000000000000'),
      __v,
      title,
      slug,
      content,
      ...(excerpt ? { excerpt } : {}),
      authors,
      categoryId: categoryId ?? new mongoose.Types.ObjectId('000000000000000000000000'),
      ...(subcategoryId ? { subcategoryId } : {}),
      tagIds,
      ...(featuredMediaId ? { featuredMediaId } : {}),
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

const fillCreatedUpdatedIso = (
  idHex: string | undefined,
  rawCreatedAt: unknown,
  rawUpdatedAt: unknown,
): { createdAt: string; updatedAt: string; warnings: string[] } => {
  const warnings: string[] = [];

  const createdCandidate =
    readIsoDate(rawCreatedAt) ??
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

const fillCreatedUpdatedDate = (
  idHex: string | undefined,
  rawCreatedAt: unknown,
  rawUpdatedAt: unknown,
): { createdAt: Date; updatedAt: Date; warnings: string[] } => {
  const warnings: string[] = [];

  const createdCandidate =
    toDateOrNull(rawCreatedAt) ??
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

export function toCanonicalArticle(input: any): TransformResult<CanonicalArticle> {
  // Default output is JSON-friendly. For migration into Mongo, set OUTPUT_MODE=mongo.
  const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
  if (outputMode === 'mongo') {
    const res = toMongoArticle(input);
    // Cast is safe: the caller expects TransformResult-like.
    return res as unknown as TransformResult<CanonicalArticle>;
  }

  const warnings: string[] = [];

  const _id = objectIdToHex(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const title = typeof input?.title === 'string' ? input.title : '';
  if (!title) warnings.push('missing title');

  const slugRaw = typeof input?.slug === 'string' ? input.slug : '';
  const slug = slugify(slugRaw);
  if (!slug) warnings.push('missing slug');

  const content = typeof input?.content === 'string' ? input.content : '';
  if (!content) warnings.push('missing content');

  const excerpt =
    input?.excerpt === undefined || input?.excerpt === null
      ? undefined
      : typeof input.excerpt === 'string'
        ? input.excerpt
        : (warnings.push('excerpt present but not a string'), undefined);

  const authorsRaw = Array.isArray(input?.authors) ? input.authors : [];
  if (!Array.isArray(input?.authors)) warnings.push('authors missing or not an array');

  const authors: CanonicalAuthorRef[] = authorsRaw
    .map((a: any, idx: number) => {
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
      if (asId) return { authorId: asId, order: idx };

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
    .filter((x: CanonicalAuthorRef | null): x is CanonicalAuthorRef => x !== null)
    .sort((a: CanonicalAuthorRef, b: CanonicalAuthorRef) => a.order - b.order);

  const categoryId =
    objectIdToHex(input?.categoryId) ??
    objectIdToHex(input?.category) ??
    (Array.isArray(input?.categories) ? objectIdToHex(input.categories[0]) : undefined);

  if (!categoryId) warnings.push('missing categoryId/category/categories[0]');

  const subcategoryId =
    objectIdToHex(input?.subcategoryId) ??
    objectIdToHex(input?.subcategory) ??
    (Array.isArray(input?.subcategories) ? objectIdToHex(input.subcategories[0]) : undefined);

  const tagIdsRaw = Array.isArray(input?.tagIds) ? input.tagIds : Array.isArray(input?.tags) ? input.tags : [];
  const tagIds = tagIdsRaw
    .map((t: any, idx: number) => {
      const id = objectIdToHex(t);
      if (!id) warnings.push(`tagIds/tags[${idx}] not an ObjectId`);
      return id ?? null;
    })
    .filter((x: string | null): x is string => x !== null);

  const featuredMediaId = objectIdToHex(input?.featuredMediaId) ?? objectIdToHex(input?.featuredImage);

  const imageCaption =
    input?.imageCaption === undefined || input?.imageCaption === null
      ? undefined
      : typeof input.imageCaption === 'string'
        ? input.imageCaption
        : (warnings.push('imageCaption present but not a string'), undefined);

  let published: boolean;
  if (typeof input?.published === 'boolean') published = input.published;
  else if (typeof input?.isPublished === 'boolean') published = input.isPublished;
  else if (typeof input?.status === 'string') published = input.status === 'published';
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

  const viewCount =
    typeof input?.viewCount === 'number'
      ? toNumberWithDefault(input.viewCount, 0)
      : typeof input?.views === 'number'
        ? toNumberWithDefault(input.views, 0)
        : 0;

  const { createdAt: rawCreatedAt, updatedAt: rawUpdatedAt, warnings: timeWarnings } = fillCreatedUpdatedIso(
    _id,
    input?.createdAt,
    input?.updatedAt,
  );
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

  const value: CanonicalArticle = {
    _id: _id ?? '000000000000000000000000',
    __v,
    title,
    slug,
    content,
    ...(excerpt ? { excerpt } : {}),
    authors,
    categoryId: categoryId ?? '000000000000000000000000',
    ...(subcategoryId ? { subcategoryId } : {}),
    tagIds,
    ...(featuredMediaId ? { featuredMediaId } : {}),
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

export function toCanonicalCategory(input: any): TransformResult<CanonicalCategory> {
  const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
  if (outputMode === 'mongo') {
    const res = toMongoCategory(input);
    return res as unknown as TransformResult<CanonicalCategory>;
  }

  const warnings: string[] = [];

  const _id = objectIdToHex(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const name = readNonEmptyString(input?.name) ?? '';
  if (!name) warnings.push('missing name');

  const slugRaw = readNonEmptyString(input?.slug) ?? '';
  const slug = slugify(slugRaw);
  if (!slug) warnings.push('missing slug');

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

export function toCanonicalTag(input: any): TransformResult<CanonicalTag> {
  const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
  if (outputMode === 'mongo') {
    const res = toMongoTag(input);
    return res as unknown as TransformResult<CanonicalTag>;
  }

  const warnings: string[] = [];

  const _id = objectIdToHex(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const name = readNonEmptyString(input?.name) ?? '';
  if (!name) warnings.push('missing name');

  const slugRaw = readNonEmptyString(input?.slug) ?? '';
  const slug = slugify(slugRaw);
  if (!slug) warnings.push('missing slug');

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

export function toCanonicalSubcategory(input: any): TransformResult<CanonicalSubcategory> {
  const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
  if (outputMode === 'mongo') {
    const res = toMongoSubcategory(input);
    return res as unknown as TransformResult<CanonicalSubcategory>;
  }

  const warnings: string[] = [];

  const _id = objectIdToHex(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const categoryId = objectIdToHex(input?.categoryId) ?? objectIdToHex(input?.category);
  if (!categoryId) warnings.push('missing categoryId/category');

  const name = readNonEmptyString(input?.name) ?? '';
  if (!name) warnings.push('missing name');

  const slugRaw = readNonEmptyString(input?.slug) ?? '';
  const slug = slugify(slugRaw);
  if (!slug) warnings.push('missing slug');

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

export function toCanonicalMedia(input: any): TransformResult<CanonicalMedia> {
  const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
  if (outputMode === 'mongo') {
    const res = toMongoMedia(input);
    return res as unknown as TransformResult<CanonicalMedia>;
  }

  const warnings: string[] = [];

  const _id = objectIdToHex(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const url = readNonEmptyString(input?.url) ?? '';
  if (!url) warnings.push('missing url');

  const altText =
    readString(input?.altText) ??
    readString(input?.title) ??
    readString(input?.originalName) ??
    readString(input?.filename) ??
    '';

  if (!altText) warnings.push('missing altText (no altText/title/originalName/filename fallback)');

  const __v = typeof input?.__v === 'number' ? input.__v : 0;

  return {
    value: {
      _id: _id ?? '000000000000000000000000',
      __v,
      url,
      altText,
    },
    warnings,
  };
}

export function toCanonicalSliver(input: any): TransformResult<CanonicalSliver> {
  const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
  if (outputMode === 'mongo') {
    const res = toMongoSliver(input);
    return res as unknown as TransformResult<CanonicalSliver>;
  }

  const warnings: string[] = [];

  const _id = objectIdToHex(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const text = readNonEmptyString(input?.text) ?? '';
  if (!text) warnings.push('missing text');

  const expiresAt = toIsoOrNull(input?.expiresAt);
  if (expiresAt === null) warnings.push('expiresAt missing/invalid; returning null');

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

export function toCanonicalUser(input: any): TransformResult<CanonicalUser> {
  const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
  if (outputMode === 'mongo') {
    const res = toMongoUser(input);
    return res as unknown as TransformResult<CanonicalUser>;
  }

  const warnings: string[] = [];

  const _id = objectIdToHex(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const explicitName = readNonEmptyString(input?.name);
  const firstName = readNonEmptyString(input?.firstName);
  const lastName = readNonEmptyString(input?.lastName);
  const username = readNonEmptyString(input?.username);
  const email = readNonEmptyString(input?.email);

  const composedName = [firstName, lastName].filter(Boolean).join(' ').trim();

  const name = explicitName ?? composedName ?? username ?? email ?? '';
  if (!name) warnings.push('missing name');

  const bio = input?.bio === undefined || input?.bio === null ? undefined : readString(input.bio);
  if (input?.bio !== undefined && bio === undefined) warnings.push('bio present but not a string');

  // canonical isAdmin; legacy role often indicates admin
  let isAdmin: boolean;
  if (typeof input?.isAdmin === 'boolean') {
    isAdmin = input.isAdmin;
  } else if (typeof input?.role === 'string') {
    isAdmin = ['admin', 'manager', 'editor'].includes(input.role);
    warnings.push('isAdmin missing; derived from role');
  } else {
    isAdmin = false;
    warnings.push('isAdmin missing; defaulting to false');
  }

  const profilePictureMediaId = objectIdToHex(input?.profilePictureMediaId) ?? objectIdToHex(input?.profilePicture);

  const socialLinksRaw = input?.socialLinks;
  const socialLinks: Array<{ platform: string; url: string }> = [];

  if (Array.isArray(socialLinksRaw)) {
    for (let i = 0; i < socialLinksRaw.length; i += 1) {
      const item = socialLinksRaw[i];
      const platform = readNonEmptyString(item?.platform);
      const url = readNonEmptyString(item?.url);
      if (platform && url) {
        socialLinks.push({ platform, url });
      } else {
        warnings.push(`socialLinks[${i}] missing platform/url`);
      }
    }
  } else {
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
      ...(profilePictureMediaId ? { profilePictureMediaId } : {}),
      socialLinks,
    },
    warnings,
  };
}

export function toCanonicalComment(input: any): TransformResult<CanonicalComment> {
  const outputMode = process.env.OUTPUT_MODE === 'mongo' ? 'mongo' : 'json';
  if (outputMode === 'mongo') {
    const res = toMongoComment(input);
    return res as unknown as TransformResult<CanonicalComment>;
  }

  const warnings: string[] = [];

  const _id = objectIdToHex(input?._id);
  if (!_id) warnings.push('missing _id or not an ObjectId');

  const articleId = objectIdToHex(input?.articleId) ?? objectIdToHex(input?.article);
  if (!articleId) warnings.push('missing articleId/article');

  const parentCommentId = objectIdToHex(input?.parentCommentId) ?? objectIdToHex(input?.parentComment);

  const content = readNonEmptyString(input?.content) ?? '';
  if (!content) warnings.push('missing content');

  const username =
    readNonEmptyString(input?.username) ??
    readNonEmptyString(input?.author?.name) ??
    'Anonymous';

  const thumbsUp =
    typeof input?.thumbsUp === 'number' ? toNumberWithDefault(input.thumbsUp, 0) : 0;
  const thumbsDown =
    typeof input?.thumbsDown === 'number' ? toNumberWithDefault(input.thumbsDown, 0) : 0;

  let approved: boolean;
  if (typeof input?.approved === 'boolean') approved = input.approved;
  else if (typeof input?.isApproved === 'boolean') approved = input.isApproved;
  else {
    approved = false;
    warnings.push('approved/isApproved missing; defaulting to false');
  }

  const createdAt =
    readIsoDate(input?.createdAt) ??
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
  console.error(
    [
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
    ].join('\n'),
  );
};

const transformByCollection = (collectionName: string, doc: any): TransformResult<any> => {
  switch (collectionName) {
    case 'articles':
      return toCanonicalArticle(doc);
    case 'categories':
      return toCanonicalCategory(doc);
    case 'tags':
      return toCanonicalTag(doc);
    case 'subcategories':
      return toCanonicalSubcategory(doc);
    case 'media':
      return toCanonicalMedia(doc);
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

const DEFAULT_COLLECTIONS = ['users', 'comments', 'slivers', 'subcategories', 'media', 'categories', 'tags', 'articles'] as const;

async function main() {
  const [maybeCollectionName, maybeId] = process.argv.slice(2);

  const uri = process.env.ATLAS_URI;
  if (!uri) throw new Error('Missing ATLAS_URI in env');

  const dbName = process.env.MONGO_DB_NAME;
  const connectOptions = dbName ? { dbName } : {};
  await mongoose.connect(uri, connectOptions);

  const outputWarnings = process.env.OUTPUT_WARNINGS !== 'false';

  // Single-document mode
  if (maybeCollectionName && maybeId) {
    const collection = mongoose.connection.db!.collection(maybeCollectionName);
    const objectId = isHexObjectId(maybeId) ? new mongoose.Types.ObjectId(maybeId) : maybeId;

    const doc = await collection.findOne({ _id: objectId });
    if (!doc && maybeCollectionName === 'articles' && isHexObjectId(maybeId)) {
      // Legacy technique articles sometimes use `categories`/`subcategories` and a title-like slug.
      // Allow finding by _id, then try by slug as a fallback.
      const docBySlug = await collection.findOne({ slug: maybeId });
      if (docBySlug) {
        const result = transformByCollection(maybeCollectionName, docBySlug);
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(outputWarnings ? result : result.value, null, 2));
        await mongoose.disconnect();
        return;
      }
    }

    if (!doc) {
      // eslint-disable-next-line no-console
      console.error(`Document not found: ${maybeCollectionName} ${maybeId}`);
      process.exitCode = 1;
      await mongoose.disconnect();
      return;
    }

    const result = transformByCollection(maybeCollectionName, doc);

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(outputWarnings ? result : result.value, null, 2));

    await mongoose.disconnect();
    return;
  }

  // Sample mode
  if (maybeCollectionName || maybeId) {
    usage();
    process.exitCode = 1;
    await mongoose.disconnect();
    return;
  }

  const sampleCount = Math.max(parseInt(process.env.SAMPLE_COUNT || '5', 10) || 5, 1);
  const sampleRandom = process.env.SAMPLE_RANDOM === 'true';

  const db = mongoose.connection.db!;
  const output: Record<string, Array<{ sourceId: string; transformed: any; warnings: string[] }>> = {};

  for (const collectionName of DEFAULT_COLLECTIONS) {
    const collection = db.collection(collectionName);

    const docs = sampleRandom
      ? await collection.aggregate([{ $sample: { size: sampleCount } }]).toArray()
      : await collection.find({}).sort({ _id: 1 }).limit(sampleCount).toArray();

    output[collectionName] = docs.map((doc: any) => {
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

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  });
}
