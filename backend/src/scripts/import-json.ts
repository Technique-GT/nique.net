/**
 * Import JSON exports into local MongoDB.
 *
 * Resolves conflicts by prioritizing existing documents:
 * - Users: match by email → use existing Mongo user's _id
 * - Categories: match by slug → use existing Mongo category's _id
 * - Subcategories: match by slug → use existing Mongo subcategory's _id
 * - Tags: match by slug → use existing Mongo tag's _id
 *
 * Import order: users → categories → subcategories → tags → articles → comments → slivers
 *
 * Usage:
 *   cd backend
 *   ATLAS_URI='mongodb://localhost:27017' MONGO_DB_NAME=technique EXPORT_DIR=../db-migration/export npx tsx src/scripts/import-json.ts
 *
 * Env:
 *   ATLAS_URI       - MongoDB connection string (required)
 *   MONGO_DB_NAME  - Database name (default: test)
 *   EXPORT_DIR      - Path to export folder (default: ../db-migration/export)
 *   DRY_RUN         - If "true", log actions without writing (default: false)
 *   ARTICLE_LIMIT   - Max articles to import (default: no limit). Use 1 for a single-article test run.
 *   ARTICLE_SLUG     - Import only the article with this slug (implies single-article + associated records only).
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

type IdMap = Map<string, ObjectId>;

function parseExtendedJson(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(parseExtendedJson);
  if (typeof obj === 'object' && obj !== null) {
    const o = obj as Record<string, unknown>;
    if ('$oid' in o && typeof o.$oid === 'string') {
      return new ObjectId(o.$oid);
    }
    if ('$date' in o && typeof o.$date === 'string') {
      return new Date(o.$date);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) out[k] = parseExtendedJson(v);
    return out;
  }
  return obj;
}

function toHex(id: unknown): string | null {
  if (!id) return null;
  if (id instanceof ObjectId) return id.toHexString();
  if (typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)) return id;
  if (typeof id === 'object' && id !== null && '$oid' in (id as object)) {
    return (id as { $oid: string }).$oid;
  }
  return null;
}

function mapId(idMap: IdMap, id: unknown): ObjectId | null {
  const hex = toHex(id);
  if (!hex) return null;
  const mapped = idMap.get(hex);
  if (mapped) return mapped;
  if (ObjectId.isValid(hex)) return new ObjectId(hex);
  return null;
}

function loadJson<T>(filePath: string): T[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error(`Expected array in ${filePath}`);
  return parsed.map((item) => parseExtendedJson(item) as T);
}

async function main() {
  const uri = process.env.ATLAS_URI;
  if (!uri) throw new Error('Missing ATLAS_URI');

  const dbName = process.env.MONGO_DB_NAME || 'test';
  const exportDirRaw = process.env.EXPORT_DIR;
  const candidates = exportDirRaw
    ? [path.resolve(process.cwd(), exportDirRaw)]
    : [
        path.resolve(process.cwd(), '../db-migration/export'),
        path.resolve(process.cwd(), '../../../Technique/db-migration/export'),
      ];
  const exportDir = candidates.find((d) => fs.existsSync(d));
  const dryRun = process.env.DRY_RUN === 'true';
  const articleSlug = process.env.ARTICLE_SLUG?.trim() || '';
  const articleLimit = articleSlug ? 1 : parseInt(process.env.ARTICLE_LIMIT || '0', 10) || 0;

  if (!exportDir) {
    throw new Error(
      `Export directory not found. Tried: ${candidates.join(', ')}. Set EXPORT_DIR to the path containing users.json, categories.json, etc.`,
    );
  }

  let client: MongoClient;
  try {
    client = new MongoClient(uri);
    await client.connect();
  } catch (err) {
    throw new Error(`MongoDB connection failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  const db = client.db(dbName);

  const userMap: IdMap = new Map();
  const categoryMap: IdMap = new Map();
  const subcategoryMap: IdMap = new Map();
  const tagMap: IdMap = new Map();
  const articleMap: IdMap = new Map();

  const usersCol = db.collection('users');
  const categoriesCol = db.collection('categories');
  const subcategoriesCol = db.collection('subcategories');
  const tagsCol = db.collection('tags');
  const articlesCol = db.collection('articles');
  const commentsCol = db.collection('comments');
  const sliversCol = db.collection('slivers');

  // When articleLimit is set, collect IDs needed by the limited articles only
  let neededUserIds = new Set<string>();
  let neededCategoryIds = new Set<string>();
  let neededSubcategoryIds = new Set<string>();
  let neededTagIds = new Set<string>();
  if (articleLimit > 0) {
    const articlesPathForScan = path.join(exportDir, 'articles.json');
    if (fs.existsSync(articlesPathForScan)) {
      const allArticlesForScan = loadJson<JsonArticle>(articlesPathForScan);
      const limitedArticles = articleSlug
        ? allArticlesForScan.filter((a) => (a.slug || '').trim() === articleSlug)
        : allArticlesForScan.slice(0, articleLimit);
      if (articleSlug && limitedArticles.length === 0) {
        throw new Error(`Article with slug "${articleSlug}" not found in export`);
      }
      for (const a of limitedArticles) {
        const ownerHex = toHex(a.ownerId);
        if (ownerHex) neededUserIds.add(ownerHex);
        for (const auth of a.authors || []) {
          const ah = toHex(auth.authorId);
          if (ah) neededUserIds.add(ah);
        }
        const catHex = toHex(a.categoryId);
        if (catHex) neededCategoryIds.add(catHex);
        const subHex = toHex(a.subcategoryId);
        if (subHex) neededSubcategoryIds.add(subHex);
        for (const tid of a.tagIds || []) {
          const th = toHex(tid);
          if (th) neededTagIds.add(th);
        }
      }
      const subcategoriesPathForScan = path.join(exportDir, 'subcategories.json');
      if (fs.existsSync(subcategoriesPathForScan)) {
        const subcategories = loadJson<JsonSubcategory>(subcategoriesPathForScan);
        for (const s of subcategories) {
          if (neededSubcategoryIds.has(toHex(s._id) || '')) {
            const ch = toHex(s.categoryId);
            if (ch) neededCategoryIds.add(ch);
          }
        }
      }
    }
    if (neededUserIds.size || neededCategoryIds.size || neededSubcategoryIds.size || neededTagIds.size) {
      const slugNote = articleSlug ? ` (slug: ${articleSlug})` : '';
      console.log(
        `Article limit${slugNote}: only importing ${neededUserIds.size} users, ${neededCategoryIds.size} categories, ${neededSubcategoryIds.size} subcategories, ${neededTagIds.size} tags`,
      );
    }
  }

  type JsonUser = { _id: unknown; name: string; email?: string; isAdmin?: boolean; socialLinks?: unknown[] };
  type JsonCategory = { _id: unknown; name: string; slug: string };
  type JsonSubcategory = { _id: unknown; categoryId: unknown; name: string; slug: string };
  type JsonTag = { _id: unknown; name: string; slug: string };
  type JsonArticle = {
    _id: unknown;
    title: string;
    slug: string;
    content: string;
    authors: Array<{ authorId: unknown; order: number }>;
    tagIds: unknown[];
    categoryId?: unknown;
    subcategoryId?: unknown;
    ownerId: unknown;
    published?: boolean;
    publishedAt?: unknown;
    allowComments?: boolean;
    isFeatured?: boolean;
    isSticky?: boolean;
    reviewStatus?: string;
    viewCount?: number;
    featuredMediaUrl?: string;
    imageCaption?: string;
    createdAt?: unknown;
    updatedAt?: unknown;
  };
  type JsonComment = {
    _id: unknown;
    articleId: unknown;
    parentCommentId?: unknown;
    content: string;
    username: string;
    thumbsUp?: number;
    thumbsDown?: number;
    approved?: boolean;
    createdAt?: unknown;
    updatedAt?: unknown;
  };
  type JsonSliver = { _id: unknown; text: string; expiresAt: unknown; createdAt?: unknown; updatedAt?: unknown };

  let usersInserted = 0;
  let usersSkipped = 0;
  let categoriesInserted = 0;
  let categoriesSkipped = 0;
  let subcategoriesInserted = 0;
  let subcategoriesSkipped = 0;
  let tagsInserted = 0;
  let tagsSkipped = 0;
  let articlesInserted = 0;
  let articlesSkipped = 0;
  let commentsInserted = 0;
  let sliversInserted = 0;

  // --- Users ---
  const usersPath = path.join(exportDir, 'users.json');
  if (fs.existsSync(usersPath)) {
    const allUsers = loadJson<JsonUser>(usersPath);
    const users = articleLimit > 0 ? allUsers.filter((u) => neededUserIds.has(toHex(u._id) || '')) : allUsers;
    for (const u of users) {
      const jsonId = toHex(u._id);
      if (!jsonId) continue;

      const email = typeof u.email === 'string' ? u.email.toLowerCase().trim() : undefined;
      let existing: { _id: ObjectId } | null = null;
      if (email) {
        existing = await usersCol.findOne({ email }, { projection: { _id: 1 } });
      }

      if (existing) {
        userMap.set(jsonId, existing._id);
        usersSkipped++;
      } else {
        const doc = {
          _id: new ObjectId(jsonId),
          name: u.name || 'Unknown',
          ...(email ? { email } : {}),
          isAdmin: Boolean(u.isAdmin),
          socialLinks: Array.isArray(u.socialLinks) ? u.socialLinks : [],
        };
        if (!dryRun) {
          try {
            await usersCol.insertOne(doc);
          } catch (err: unknown) {
            if ((err as { code?: number }).code === 11000) {
              const existingUser = await usersCol.findOne({ _id: doc._id }, { projection: { _id: 1 } });
              if (existingUser) {
                userMap.set(jsonId, existingUser._id);
                usersSkipped++;
                continue;
              }
            }
            throw err;
          }
        }
        userMap.set(jsonId, doc._id);
        usersInserted++;
      }
    }
    console.log(`Users: ${usersInserted} inserted, ${usersSkipped} used existing (by email)`);
  }

  // --- Categories ---
  const categoriesPath = path.join(exportDir, 'categories.json');
  if (fs.existsSync(categoriesPath)) {
    const allCategories = loadJson<JsonCategory>(categoriesPath);
    const categories = articleLimit > 0 ? allCategories.filter((c) => neededCategoryIds.has(toHex(c._id) || '')) : allCategories;
    for (const c of categories) {
      const jsonId = toHex(c._id);
      if (!jsonId) continue;

      const existing = await categoriesCol.findOne({ slug: c.slug }, { projection: { _id: 1 } });
      if (existing) {
        categoryMap.set(jsonId, existing._id);
        categoriesSkipped++;
      } else {
        const doc = {
          _id: new ObjectId(jsonId),
          name: c.name,
          slug: c.slug,
        };
        if (!dryRun) {
          try {
            await categoriesCol.insertOne(doc);
          } catch (err: unknown) {
            if ((err as { code?: number }).code === 11000) {
              const existingCat = await categoriesCol.findOne({ slug: c.slug }, { projection: { _id: 1 } });
              if (existingCat) {
                categoryMap.set(jsonId, existingCat._id);
                categoriesSkipped++;
                continue;
              }
            }
            throw err;
          }
        }
        categoryMap.set(jsonId, doc._id);
        categoriesInserted++;
      }
    }
    console.log(`Categories: ${categoriesInserted} inserted, ${categoriesSkipped} used existing (by slug)`);
  }

  // --- Subcategories ---
  const subcategoriesPath = path.join(exportDir, 'subcategories.json');
  if (fs.existsSync(subcategoriesPath)) {
    const allSubcategories = loadJson<JsonSubcategory>(subcategoriesPath);
    const subcategories = articleLimit > 0 ? allSubcategories.filter((s) => neededSubcategoryIds.has(toHex(s._id) || '')) : allSubcategories;
    for (const s of subcategories) {
      const jsonId = toHex(s._id);
      if (!jsonId) continue;

      const mappedCategoryId = mapId(categoryMap, s.categoryId) ?? (toHex(s.categoryId) ? new ObjectId(toHex(s.categoryId)!) : null);
      if (!mappedCategoryId) continue;
      const existing = await subcategoriesCol.findOne({ slug: s.slug }, { projection: { _id: 1 } });
      if (existing) {
        subcategoryMap.set(jsonId, existing._id);
        subcategoriesSkipped++;
      } else {
        const doc = {
          _id: new ObjectId(jsonId),
          categoryId: mappedCategoryId,
          name: s.name,
          slug: s.slug,
        };
        if (!dryRun) {
          try {
            await subcategoriesCol.insertOne(doc);
          } catch (err: unknown) {
            if ((err as { code?: number }).code === 11000) {
              const existingSub = await subcategoriesCol.findOne({ slug: s.slug }, { projection: { _id: 1 } });
              if (existingSub) {
                subcategoryMap.set(jsonId, existingSub._id);
                subcategoriesSkipped++;
                continue;
              }
            }
            throw err;
          }
        }
        subcategoryMap.set(jsonId, doc._id);
        subcategoriesInserted++;
      }
    }
    console.log(`Subcategories: ${subcategoriesInserted} inserted, ${subcategoriesSkipped} used existing (by slug)`);
  }

  // --- Tags ---
  const tagsPath = path.join(exportDir, 'tags.json');
  if (fs.existsSync(tagsPath)) {
    const allTags = loadJson<JsonTag>(tagsPath);
    const tags = articleLimit > 0 ? allTags.filter((t) => neededTagIds.has(toHex(t._id) || '')) : allTags;
    for (const t of tags) {
      const jsonId = toHex(t._id);
      if (!jsonId) continue;

      const existing = await tagsCol.findOne({ slug: t.slug }, { projection: { _id: 1 } });
      if (existing) {
        tagMap.set(jsonId, existing._id);
        tagsSkipped++;
      } else {
        const doc = {
          _id: new ObjectId(jsonId),
          name: t.name,
          slug: t.slug,
        };
        if (!dryRun) {
          try {
            await tagsCol.insertOne(doc);
          } catch (err: unknown) {
            if ((err as { code?: number }).code === 11000) {
              const existingTag = await tagsCol.findOne({ slug: t.slug }, { projection: { _id: 1 } });
              if (existingTag) {
                tagMap.set(jsonId, existingTag._id);
                tagsSkipped++;
                continue;
              }
            }
            throw err;
          }
        }
        tagMap.set(jsonId, doc._id);
        tagsInserted++;
      }
    }
    console.log(`Tags: ${tagsInserted} inserted, ${tagsSkipped} used existing (by slug)`);
  }

  // --- Articles ---
  const articlesPath = path.join(exportDir, 'articles.json');
  if (fs.existsSync(articlesPath)) {
    const allArticles = loadJson<JsonArticle>(articlesPath);
    const articles = articleLimit > 0
      ? articleSlug
        ? allArticles.filter((a) => (a.slug || '').trim() === articleSlug)
        : allArticles.slice(0, articleLimit)
      : allArticles;
    if (articleLimit > 0) {
      const slugNote = articleSlug ? ` slug="${articleSlug}"` : '';
      console.log(`Article limit${slugNote}: importing ${articles.length} of ${allArticles.length} articles`);
    }
    const BATCH = 500;
    for (let i = 0; i < articles.length; i += BATCH) {
      const batch = articles.slice(i, i + BATCH);
      const toInsert: Record<string, unknown>[] = [];

      for (const a of batch) {
        const jsonId = toHex(a._id);
        if (!jsonId) continue;

        const existingBySlug = await articlesCol.findOne({ slug: a.slug }, { projection: { _id: 1 } });
        if (existingBySlug) {
          articleMap.set(jsonId, existingBySlug._id);
          articlesSkipped++;
          continue;
        }

        const ownerId = mapId(userMap, a.ownerId);
        const categoryId = mapId(categoryMap, a.categoryId);
        if (!ownerId) continue;
        const authors = (a.authors || [])
          .map((auth) => {
            const aid = mapId(userMap, auth.authorId);
            return aid ? { authorId: aid, order: auth.order ?? 0 } : null;
          })
          .filter((x): x is { authorId: ObjectId; order: number } => x !== null);
        if (authors.length === 0) authors.push({ authorId: ownerId, order: 0 });

        const tagIds = (a.tagIds || [])
          .map((tid) => mapId(tagMap, tid))
          .filter((x): x is ObjectId => x !== null);
        const subcategoryId = mapId(subcategoryMap, a.subcategoryId);

        const doc = {
          _id: new ObjectId(jsonId),
          title: a.title || 'Untitled',
          slug: a.slug || `article-${jsonId}`,
          content: a.content || '',
          authors,
          categoryId: categoryId ?? undefined,
          subcategoryId: subcategoryId || undefined,
          tagIds,
          ownerId,
          published: Boolean(a.published),
          publishedAt: a.publishedAt instanceof Date ? a.publishedAt : a.publishedAt ? new Date(String(a.publishedAt)) : null,
          allowComments: a.allowComments !== false,
          isFeatured: Boolean(a.isFeatured),
          isSticky: Boolean(a.isSticky),
          reviewStatus: a.reviewStatus || 'draft',
          viewCount: typeof a.viewCount === 'number' ? a.viewCount : 0,
          featuredMediaUrl: a.featuredMediaUrl,
          imageCaption: a.imageCaption,
          createdAt: a.createdAt instanceof Date ? a.createdAt : a.createdAt ? new Date(String(a.createdAt)) : new Date(),
          updatedAt: a.updatedAt instanceof Date ? a.updatedAt : a.updatedAt ? new Date(String(a.updatedAt)) : new Date(),
        };

        toInsert.push(doc);
        articleMap.set(jsonId, doc._id);
      }

      if (!dryRun && toInsert.length > 0) {
        try {
          const result = await articlesCol.insertMany(toInsert, { ordered: false });
          articlesInserted += result.insertedCount;
        } catch (err: unknown) {
          const insertedIds = (err as { insertedIds?: Record<number, ObjectId> }).insertedIds;
          articlesInserted += insertedIds ? Object.keys(insertedIds).length : 0;
        }
      } else if (dryRun) {
        articlesInserted += toInsert.length;
      }
    }
    console.log(`Articles: ${articlesInserted} inserted, ${articlesSkipped} skipped (slug exists)`);
  }

  // --- Comments ---
  const commentsPath = path.join(exportDir, 'comments.json');
  if (fs.existsSync(commentsPath)) {
    const comments = loadJson<JsonComment>(commentsPath);
    const BATCH = 500;
    for (let i = 0; i < comments.length; i += BATCH) {
      const batch = comments.slice(i, i + BATCH);
      const toInsert: Record<string, unknown>[] = [];

      for (const c of batch) {
        const articleId = mapId(articleMap, c.articleId);
        if (!articleId) continue;

        const commentId = toHex(c._id) ? new ObjectId(toHex(c._id)!) : new ObjectId();
        const parentCommentId = toHex(c.parentCommentId)
          ? new ObjectId(toHex(c.parentCommentId)!)
          : undefined;

        const doc = {
          _id: commentId,
          articleId,
          parentCommentId,
          content: c.content || '',
          username: c.username || 'anonymous',
          thumbsUp: typeof c.thumbsUp === 'number' ? c.thumbsUp : 0,
          thumbsDown: typeof c.thumbsDown === 'number' ? c.thumbsDown : 0,
          approved: c.approved !== false,
          createdAt: c.createdAt instanceof Date ? c.createdAt : c.createdAt ? new Date(String(c.createdAt)) : new Date(),
          updatedAt: c.updatedAt instanceof Date ? c.updatedAt : c.updatedAt ? new Date(String(c.updatedAt)) : new Date(),
        };
        toInsert.push(doc);
      }

      if (!dryRun && toInsert.length > 0) {
        try {
          await commentsCol.insertMany(toInsert, { ordered: false });
        } catch {
          // Ignore duplicate key errors for comments
        }
        commentsInserted += toInsert.length;
      }
    }
    console.log(`Comments: ${commentsInserted} inserted`);
  }

  // --- Slivers ---
  const sliversPath = path.join(exportDir, 'slivers.json');
  if (articleLimit === 0 && fs.existsSync(sliversPath)) {
    const slivers = loadJson<JsonSliver>(sliversPath);
    const BATCH = 1000;
    for (let i = 0; i < slivers.length; i += BATCH) {
      const batch = slivers.slice(i, i + BATCH);
      const toInsert = batch.map((s) => {
        const expiresAt = s.expiresAt instanceof Date ? s.expiresAt : s.expiresAt ? new Date(String(s.expiresAt)) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const now = new Date();
        return {
          _id: toHex(s._id) ? new ObjectId(toHex(s._id)!) : new ObjectId(),
          text: s.text || '',
          expiresAt,
          createdAt: s.createdAt instanceof Date ? s.createdAt : s.createdAt ? new Date(String(s.createdAt)) : now,
          updatedAt: s.updatedAt instanceof Date ? s.updatedAt : s.updatedAt ? new Date(String(s.updatedAt)) : now,
        };
      });
      if (!dryRun && toInsert.length > 0) {
        try {
          const result = await sliversCol.insertMany(toInsert, { ordered: false });
          sliversInserted += result.insertedCount;
        } catch (err: unknown) {
          const insertedIds = (err as { insertedIds?: Record<number, ObjectId> }).insertedIds;
          sliversInserted += insertedIds ? Object.keys(insertedIds).length : 0;
        }
      }
    }
    console.log(`Slivers: ${sliversInserted} inserted`);
  }

  console.log('Import complete.');
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
