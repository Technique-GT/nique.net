import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

/**
 * migrate-subcategories.ts
 *
 * Backfills `test.articles.subcategoryId` using legacy `technique.articles.subcategories`.
 *
 * Safety:
 * - Never writes to the `technique` database.
 * - Refuses to run if TARGET_DB_NAME is `technique`.
 *
 * Usage:
 *   ATLAS_URI='...' pnpm tsx src/scripts/migrate-subcategories.ts
 *
 * Options:
 *   SOURCE_DB_NAME=technique   (default)
 *   TARGET_DB_NAME=test        (default)
 *   DRY_RUN=true               (default false)
 *   LIMIT=0                    (default 0 = no limit)
 */

const ATLAS_URI = process.env.ATLAS_URI;
if (!ATLAS_URI) {
  throw new Error('Missing ATLAS_URI in env');
}

const SOURCE_DB_NAME = process.env.SOURCE_DB_NAME || 'technique';
const TARGET_DB_NAME = process.env.TARGET_DB_NAME || process.env.MONGO_DB_NAME || 'test';

if (TARGET_DB_NAME === 'technique') {
  throw new Error('Refusing to write to TARGET_DB_NAME=technique');
}

const DRY_RUN = process.env.DRY_RUN === 'true';
const LIMIT = Math.max(parseInt(process.env.LIMIT || '0', 10) || 0, 0);

type LegacySubcategoryEntry = {
  category?: string;
  value?: string;
};

const normalizeKey = (value: string) => {
  const lowered = value.toLowerCase().trim();

  // Normalize common punctuation and symbols.
  const normalized = lowered
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Known alias: legacy value is plural, canonical subcategory name is singular.
  if (normalized === 'letters to the editor') return 'letter to the editor';

  return normalized;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const isObjectId = (value: unknown): value is ObjectId => value instanceof ObjectId;

const toObjectIdOrNull = (value: unknown): ObjectId | null => {
  if (!value) return null;
  if (isObjectId(value)) return value;
  if (typeof value === 'string' && ObjectId.isValid(value)) return new ObjectId(value);
  return null;
};

type LookupMaps = {
  // key = `${categoryIdHex}|${normalizedName}`
  byCategoryAndName: Map<string, ObjectId>;
  // key = `${categoryIdHex}|${slug}`
  byCategoryAndSlug: Map<string, ObjectId>;
};

async function loadCategorySlugToIdMap(db: any): Promise<Map<string, ObjectId>> {
  const rows = await db.collection('categories').find({}, { projection: { slug: 1 } }).toArray();
  const map = new Map<string, ObjectId>();
  for (const row of rows) {
    if (typeof row?.slug === 'string' && row._id) {
      map.set(row.slug.toLowerCase(), row._id);
    }
  }
  return map;
}

async function ensureSubcategory(params: { db: any; categoryId: ObjectId; name: string; slug: string }): Promise<ObjectId> {
  const { db, categoryId, name, slug } = params;

  const existing = await db.collection('subcategories').findOne(
    {
      categoryId,
      $or: [{ slug }, { name }],
    },
    { projection: { _id: 1 } },
  );

  if (existing?._id) return existing._id as ObjectId;

  const res = await db.collection('subcategories').insertOne({ categoryId, name, slug, __v: 0 });
  return res.insertedId;
}

async function loadSubcategoryLookup(db: any): Promise<LookupMaps> {
  const rows = await db
    .collection('subcategories')
    .find({}, { projection: { name: 1, slug: 1, categoryId: 1, category: 1, __v: 1 } })
    .toArray();

  const byCategoryAndName = new Map<string, ObjectId>();
  const byCategoryAndSlug = new Map<string, ObjectId>();

  for (const row of rows) {
    const id = toObjectIdOrNull(row?._id);
    if (!id) continue;

    const categoryId = toObjectIdOrNull(row?.categoryId) ?? toObjectIdOrNull(row?.category);
    if (!categoryId) continue;

    const name = typeof row?.name === 'string' ? row.name : '';
    const slug = typeof row?.slug === 'string' ? row.slug : '';

    if (name) {
      byCategoryAndName.set(`${categoryId.toHexString()}|${normalizeKey(name)}`, id);
    }

    if (slug) {
      byCategoryAndSlug.set(`${categoryId.toHexString()}|${slug.toLowerCase()}`, id);
    }
  }

  return { byCategoryAndName, byCategoryAndSlug };
}

async function resolveSubcategoryId(params: {
  legacyEntry: LegacySubcategoryEntry;
  categorySlugToId: Map<string, ObjectId>;
  lookup: LookupMaps;
  targetDb: any;
}): Promise<{ subcategoryId: ObjectId | null; reason?: string; created?: boolean }> {
  const { legacyEntry, categorySlugToId, lookup, targetDb } = params;

  const legacyCategorySlug = typeof legacyEntry.category === 'string' ? legacyEntry.category.toLowerCase() : '';
  const legacyValue = typeof legacyEntry.value === 'string' ? legacyEntry.value : '';

  if (!legacyCategorySlug || !legacyValue) {
    return { subcategoryId: null, reason: 'missing legacy category/value' };
  }

  const categoryId = categorySlugToId.get(legacyCategorySlug);
  if (!categoryId) {
    return { subcategoryId: null, reason: `unknown category slug: ${legacyCategorySlug}` };
  }

  const keyByName = `${categoryId.toHexString()}|${normalizeKey(legacyValue)}`;
  const directByName = lookup.byCategoryAndName.get(keyByName);
  if (directByName) {
    return { subcategoryId: directByName };
  }

  const keyBySlug = `${categoryId.toHexString()}|${slugify(legacyValue)}`;
  const directBySlug = lookup.byCategoryAndSlug.get(keyBySlug);
  if (directBySlug) {
    return { subcategoryId: directBySlug };
  }

  // If no match exists, create it in the target DB (this is the canonical store).
  if (!DRY_RUN) {
    const createdId = await ensureSubcategory({
      db: targetDb,
      categoryId,
      name: legacyValue,
      slug: slugify(legacyValue),
    });

    lookup.byCategoryAndName.set(keyByName, createdId);
    lookup.byCategoryAndSlug.set(keyBySlug, createdId);

    return { subcategoryId: createdId, created: true };
  }

  return {
    subcategoryId: null,
    reason: `no subcategory match for value="${legacyValue}" category="${legacyCategorySlug}"`,
  };
}

async function fixDanglingSubcategoryIds(params: { targetDb: any }) {
  const { targetDb } = params;

  const existing = await targetDb
    .collection('subcategories')
    .find({}, { projection: { _id: 1 } })
    .toArray();

  const existingIds = new Set(existing.map((d: any) => String(d._id)));

  const cursor = targetDb
    .collection('articles')
    .find({ subcategoryId: { $exists: true, $ne: null } }, { projection: { _id: 1, subcategoryId: 1 } });

  let total = 0;
  let dangling = 0;

  for await (const doc of cursor) {
    total += 1;
    const subId = doc.subcategoryId;
    if (!subId || !existingIds.has(String(subId))) {
      dangling += 1;
      if (!DRY_RUN) {
        await targetDb.collection('articles').updateOne({ _id: doc._id }, { $unset: { subcategoryId: '' } });
      }
    }
  }

  return { total, dangling };
}

async function main() {
  const client = new MongoClient(ATLAS_URI as string);
  await client.connect();

  const sourceDb = client.db(SOURCE_DB_NAME);
  const targetDb = client.db(TARGET_DB_NAME);

  const categorySlugToId = await loadCategorySlugToIdMap(sourceDb);
  const lookup = await loadSubcategoryLookup(targetDb);

  const sourceQuery = { subcategories: { $exists: true, $ne: [] } };
  const projection = { _id: 1, title: 1, subcategories: 1 };

  const cursor = sourceDb.collection('articles').find(sourceQuery, { projection });

  let processed = 0;
  let updated = 0;
  let missingTarget = 0;
  let missingMapping = 0;
  let multi = 0;
  const sampleMissing: Array<{ id: string; title?: string | undefined; value?: string | undefined; category?: string | undefined; reason?: string | undefined }> = [];

  for await (const legacy of cursor) {
    processed += 1;
    if (LIMIT > 0 && processed > LIMIT) break;

    const subcats = Array.isArray(legacy.subcategories) ? (legacy.subcategories as LegacySubcategoryEntry[]) : [];
    if (subcats.length === 0) continue;
    if (subcats.length > 1) multi += 1;

    const first = subcats[0] || {};
    const { subcategoryId, reason } = await resolveSubcategoryId({
      legacyEntry: first,
      categorySlugToId,
      lookup,
      targetDb,
    });

    if (!subcategoryId) {
      missingMapping += 1;
      if (sampleMissing.length < 25) {
        sampleMissing.push({
          id: String(legacy._id),
          title: typeof legacy.title === 'string' ? legacy.title : undefined,
          value: first.value,
          category: first.category,
          reason,
        });
      }
      continue;
    }

    const existsInTarget = await targetDb.collection('articles').findOne({ _id: legacy._id }, { projection: { _id: 1 } });
    if (!existsInTarget) {
      missingTarget += 1;
      continue;
    }

    if (!DRY_RUN) {
      await targetDb.collection('articles').updateOne({ _id: legacy._id }, { $set: { subcategoryId } });
    }

    updated += 1;
  }

  const danglingResult = await fixDanglingSubcategoryIds({ targetDb });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        meta: {
          sourceDb: SOURCE_DB_NAME,
          targetDb: TARGET_DB_NAME,
          dryRun: DRY_RUN,
          limit: LIMIT,
          finishedAt: new Date().toISOString(),
        },
        processed,
        updated,
        missingTarget,
        missingMapping,
        multiSubcategoryArticles: multi,
        danglingCleanup: danglingResult,
        sampleMissing,
      },
      null,
      2,
    ),
  );

  await client.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
