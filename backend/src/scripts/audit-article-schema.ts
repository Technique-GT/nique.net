import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

/**
 * Non-destructive audit script.
 *
 * Validates sampled documents in each collection against the canonical
 * MongoDB $jsonSchema contract stored at `server/json-schemas/canonical-contract.json`.
 *
 * This is meant to answer: “How far is the current DB from the new contract?”
 * It only reads from the database.
 *
 * Usage:
 *   cd server
 *   ATLAS_URI='...' MONGO_DB_NAME='technique' npx ts-node src/scripts/audit-article-schema.ts > audit.json
 *
 * Optional env vars:
 *   SAMPLE_SIZE=500
 *   REPORT_LIMIT=25
 *   CONTRACT_PATH=./json-schemas/canonical-contract.json
 */

dotenv.config({ quiet: true });

type Issue = {
  code: string;
  detail?: string;
};

type DocSummary = {
  id: string;
  label: string | undefined;
  issues: Issue[];
};

type CollectionAudit = {
  name: string;
  sampled: number;
  issueSummary: Array<{ code: string; count: number; percent: number }>;
  mostProblematic: Array<{
    id: string;
    label: string | undefined;
    issueCount: number;
    issues: Issue[];
  }>;
};

type JsonSchema = {
  bsonType?: string | string[];
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
};

type ContractEntry = {
  collection: string;
  validationLevel?: string;
  validationAction?: string;
  validator: {
    $jsonSchema: JsonSchema;
  };
};

type IndexCheck = {
  collection: string;
  checks: Array<{ name: string; ok: boolean; detail?: string }>;
};

const MAX_ARRAY_ITEMS_TO_VALIDATE = 25;

const isObjectIdLike = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return /^[a-fA-F0-9]{24}$/.test(value);
  }

  if (value && typeof value === 'object') {
    const maybe = value as any;

    // BSON ObjectId from the Mongo driver
    if (maybe._bsontype === 'ObjectId') return true;

    // Mongoose ObjectId
    if (maybe instanceof mongoose.Types.ObjectId) return true;

    // Duck-type
    if (typeof maybe.toHexString === 'function') return true;
  }

  return false;
};

const bsonTypeOf = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'missing';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';

  if (isObjectIdLike(value)) return 'objectId';

  switch (typeof value) {
    case 'string':
      return 'string';
    case 'boolean':
      return 'bool';
    case 'number':
      // We treat JS numbers as BSON double for validation purposes.
      return 'double';
    case 'object':
      return 'object';
    default:
      return typeof value;
  }
};

const normalizeExpectedBsonTypes = (expected: string | string[]): string[] => {
  const list = Array.isArray(expected) ? expected : [expected];

  // Treat Mongo numeric types as compatible with JS numbers.
  // (You said to assume we fix int/long/double.)
  const expanded: string[] = [];
  for (const t of list) {
    if (t === 'int' || t === 'long' || t === 'double' || t === 'decimal') {
      expanded.push('double', 'int', 'long', 'decimal');
    } else {
      expanded.push(t);
    }
  }

  return Array.from(new Set(expanded));
};

const validateValue = (
  schema: JsonSchema,
  value: unknown,
  fieldPath: string,
  issues: Issue[],
): void => {
  if (!schema.bsonType) return;

  const actual = bsonTypeOf(value);
  const expected = normalizeExpectedBsonTypes(schema.bsonType);

  // `missing` is handled by `required` checks.
  if (actual === 'missing') return;

  const ok = expected.includes(actual);
  if (!ok) {
    issues.push({
      code: `contract.type.${fieldPath}`,
      detail: `expected=${expected.join('|')} actual=${actual}`,
    });
    return;
  }

  // Recurse into object properties
  if (schema.properties && actual === 'object') {
    for (const [key, childSchema] of Object.entries(schema.properties)) {
      validateValue(childSchema, (value as any)?.[key], `${fieldPath}.${key}`, issues);
    }
  }

  // Recurse into array items
  if (schema.items && actual === 'array') {
    const arr = value as any[];
    const count = Math.min(arr.length, MAX_ARRAY_ITEMS_TO_VALIDATE);
    for (let i = 0; i < count; i += 1) {
      validateValue(schema.items, arr[i], `${fieldPath}[]`, issues);
    }
  }
};

const validateDocumentAgainstContract = (contract: JsonSchema, doc: any): Issue[] => {
  const issues: Issue[] = [];

  // Required fields
  for (const field of contract.required ?? []) {
    if (doc?.[field] === undefined) {
      issues.push({ code: `contract.missing.${field}` });
    }
  }

  // Type validation for declared properties
  for (const [key, schema] of Object.entries(contract.properties ?? {})) {
    validateValue(schema, doc?.[key], key, issues);
  }

  return issues;
};

const inc = (map: Record<string, number>, key: string, n = 1) => {
  map[key] = (map[key] ?? 0) + n;
};

const summarize = (docs: DocSummary[], issueCounts: Record<string, number>, reportLimit: number): Omit<CollectionAudit, 'name'> => {
  const total = docs.length;

  const issueSummary = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({
      code,
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 1000) / 10,
    }));

  const mostProblematic = [...docs]
    .sort((a, b) => b.issues.length - a.issues.length)
    .slice(0, reportLimit)
    .map((d) => ({
      id: d.id,
      label: d.label,
      issueCount: d.issues.length,
      issues: d.issues,
    }));

  return {
    sampled: total,
    issueSummary,
    mostProblematic,
  };
};

// ---------------------------
// Index audit
// ---------------------------

type IndexInfo = { key: Record<string, number>; unique?: boolean; name: string };

const getIndexes = async (collection: mongoose.mongo.Collection): Promise<IndexInfo[]> => {
  const indexes = await collection.indexes();
  return indexes.map((i: any) => ({ key: i.key, unique: i.unique, name: i.name }));
};

const hasIndex = (indexes: IndexInfo[], key: Record<string, number>, opts?: { unique?: boolean }): boolean => {
  const target = JSON.stringify(key);
  return indexes.some((idx) => {
    if (JSON.stringify(idx.key) !== target) return false;
    if (opts?.unique === true) return idx.unique === true;
    return true;
  });
};

const auditIndexes = async (db: mongoose.mongo.Db): Promise<IndexCheck[]> => {
  const checks: IndexCheck[] = [];

  const articles = db.collection('articles');
  const categories = db.collection('categories');
  const tags = db.collection('tags');
  const comments = db.collection('comments');

  const [articleIndexes, categoryIndexes, tagIndexes, commentIndexes] = await Promise.all([
    getIndexes(articles),
    getIndexes(categories),
    getIndexes(tags),
    getIndexes(comments),
  ]);

  checks.push({
    collection: 'articles',
    checks: [
      {
        name: 'slug unique',
        ok: hasIndex(articleIndexes, { slug: 1 }, { unique: true }),
        detail: 'expected index {slug:1} unique',
      },
      {
        name: 'feed (published + publishedAt)',
        ok: hasIndex(articleIndexes, { published: 1, publishedAt: -1 }),
        detail: 'expected {published:1,publishedAt:-1}',
      },
      {
        name: 'category feed (categoryId + published + publishedAt)',
        ok: hasIndex(articleIndexes, { categoryId: 1, published: 1, publishedAt: -1 }),
        detail: 'expected {categoryId:1,published:1,publishedAt:-1}',
      },
      {
        name: 'featured feed (isFeatured + published + publishedAt)',
        ok: hasIndex(articleIndexes, { isFeatured: 1, published: 1, publishedAt: -1 }),
        detail: 'expected {isFeatured:1,published:1,publishedAt:-1}',
      },
    ],
  });

  checks.push({
    collection: 'comments',
    checks: [
      {
        name: 'article comments (articleId + createdAt)',
        ok: hasIndex(commentIndexes, { articleId: 1, createdAt: 1 }),
        detail: 'expected {articleId:1,createdAt:1}',
      },
    ],
  });

  checks.push({
    collection: 'categories',
    checks: [
      {
        name: 'slug unique',
        ok: hasIndex(categoryIndexes, { slug: 1 }, { unique: true }),
        detail: 'expected index {slug:1} unique',
      },
    ],
  });

  checks.push({
    collection: 'tags',
    checks: [
      {
        name: 'slug unique',
        ok: hasIndex(tagIndexes, { slug: 1 }, { unique: true }),
        detail: 'expected index {slug:1} unique',
      },
    ],
  });

  return checks;
};

// ---------------------------
// Runner
// ---------------------------

const loadContract = (): ContractEntry[] => {
  const contractPath = process.env.CONTRACT_PATH
    ? path.resolve(process.cwd(), process.env.CONTRACT_PATH)
    : path.resolve(process.cwd(), 'json-schemas', 'canonical-contract.json');

  const raw = fs.readFileSync(contractPath, 'utf8');
  return JSON.parse(raw) as ContractEntry[];
};

const labelForCollection = (collection: string, doc: any): string | undefined => {
  switch (collection) {
    case 'articles':
      return typeof doc?.title === 'string' ? doc.title : undefined;
    case 'categories':
    case 'tags':
    case 'subcategories':
      return typeof doc?.name === 'string' ? doc.name : undefined;
    case 'users':
      return typeof doc?.name === 'string' ? doc.name : undefined;
    case 'slivers':
      return typeof doc?.text === 'string' ? String(doc.text).slice(0, 60) : undefined;
    case 'comments':
      return typeof doc?.username === 'string' ? doc.username : undefined;
    default:
      return undefined;
  }
};

async function main() {
  const uri = process.env.ATLAS_URI;
  if (!uri) throw new Error('Missing ATLAS_URI in env');

  const dbName = process.env.MONGO_DB_NAME;
  const sampleSize = Math.max(parseInt(process.env.SAMPLE_SIZE || '500', 10) || 500, 1);
  const reportLimit = Math.max(parseInt(process.env.REPORT_LIMIT || '25', 10) || 25, 1);

  const connectOptions = dbName ? { dbName } : {};
  await mongoose.connect(uri, connectOptions);

  const db = mongoose.connection.db!;

  const contract = loadContract();
  const collections: CollectionAudit[] = [];

  for (const entry of contract) {
    const name = entry.collection;
    const schema = entry.validator.$jsonSchema;

    const collection = db.collection(name);
    const docs = await collection.aggregate([{ $sample: { size: sampleSize } }]).toArray();

    const issueCounts: Record<string, number> = {};
    const summaries: DocSummary[] = [];

    for (const doc of docs) {
      const issues = validateDocumentAgainstContract(schema, doc);
      summaries.push({
        id: String(doc?._id ?? 'unknown'),
        label: labelForCollection(name, doc),
        issues,
      });
      for (const issue of issues) {
        inc(issueCounts, issue.code);
      }
    }

    const summary = summarize(summaries, issueCounts, reportLimit);
    collections.push({
      name,
      ...summary,
    });
  }

  const indexes = await auditIndexes(db);

  const result = {
    meta: {
      dbName: dbName ?? '(default from uri)',
      sampleSizeRequested: sampleSize,
      reportLimit,
      generatedAt: new Date().toISOString(),
    },
    collections,
    indexes,
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
