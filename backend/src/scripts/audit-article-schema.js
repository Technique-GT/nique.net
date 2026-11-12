"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const mongoose_1 = __importDefault(require("mongoose"));
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
dotenv_1.default.config({ quiet: true });
const MAX_ARRAY_ITEMS_TO_VALIDATE = 25;
const isObjectIdLike = (value) => {
    if (typeof value === 'string') {
        return /^[a-fA-F0-9]{24}$/.test(value);
    }
    if (value && typeof value === 'object') {
        const maybe = value;
        // BSON ObjectId from the Mongo driver
        if (maybe._bsontype === 'ObjectId')
            return true;
        // Mongoose ObjectId
        if (maybe instanceof mongoose_1.default.Types.ObjectId)
            return true;
        // Duck-type
        if (typeof maybe.toHexString === 'function')
            return true;
    }
    return false;
};
const bsonTypeOf = (value) => {
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'missing';
    if (Array.isArray(value))
        return 'array';
    if (value instanceof Date)
        return 'date';
    if (isObjectIdLike(value))
        return 'objectId';
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
const normalizeExpectedBsonTypes = (expected) => {
    const list = Array.isArray(expected) ? expected : [expected];
    // Treat Mongo numeric types as compatible with JS numbers.
    // (You said to assume we fix int/long/double.)
    const expanded = [];
    for (const t of list) {
        if (t === 'int' || t === 'long' || t === 'double' || t === 'decimal') {
            expanded.push('double', 'int', 'long', 'decimal');
        }
        else {
            expanded.push(t);
        }
    }
    return Array.from(new Set(expanded));
};
const validateValue = (schema, value, fieldPath, issues) => {
    if (!schema.bsonType)
        return;
    const actual = bsonTypeOf(value);
    const expected = normalizeExpectedBsonTypes(schema.bsonType);
    // `missing` is handled by `required` checks.
    if (actual === 'missing')
        return;
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
            validateValue(childSchema, value?.[key], `${fieldPath}.${key}`, issues);
        }
    }
    // Recurse into array items
    if (schema.items && actual === 'array') {
        const arr = value;
        const count = Math.min(arr.length, MAX_ARRAY_ITEMS_TO_VALIDATE);
        for (let i = 0; i < count; i += 1) {
            validateValue(schema.items, arr[i], `${fieldPath}[]`, issues);
        }
    }
};
const validateDocumentAgainstContract = (contract, doc) => {
    const issues = [];
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
const inc = (map, key, n = 1) => {
    map[key] = (map[key] ?? 0) + n;
};
const summarize = (docs, issueCounts, reportLimit) => {
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
const getIndexes = async (collection) => {
    const indexes = await collection.indexes();
    return indexes.map((i) => ({ key: i.key, unique: i.unique, name: i.name }));
};
const hasIndex = (indexes, key, opts) => {
    const target = JSON.stringify(key);
    return indexes.some((idx) => {
        if (JSON.stringify(idx.key) !== target)
            return false;
        if (opts?.unique === true)
            return idx.unique === true;
        return true;
    });
};
const auditIndexes = async (db) => {
    const checks = [];
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
const loadContract = () => {
    const contractPath = process.env.CONTRACT_PATH
        ? node_path_1.default.resolve(process.cwd(), process.env.CONTRACT_PATH)
        : node_path_1.default.resolve(process.cwd(), 'json-schemas', 'canonical-contract.json');
    const raw = node_fs_1.default.readFileSync(contractPath, 'utf8');
    return JSON.parse(raw);
};
const labelForCollection = (collection, doc) => {
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
    if (!uri)
        throw new Error('Missing ATLAS_URI in env');
    const dbName = process.env.MONGO_DB_NAME;
    const sampleSize = Math.max(parseInt(process.env.SAMPLE_SIZE || '500', 10) || 500, 1);
    const reportLimit = Math.max(parseInt(process.env.REPORT_LIMIT || '25', 10) || 25, 1);
    const connectOptions = dbName ? { dbName } : {};
    await mongoose_1.default.connect(uri, connectOptions);
    const db = mongoose_1.default.connection.db;
    const contract = loadContract();
    const collections = [];
    for (const entry of contract) {
        const name = entry.collection;
        const schema = entry.validator.$jsonSchema;
        const collection = db.collection(name);
        const docs = await collection.aggregate([{ $sample: { size: sampleSize } }]).toArray();
        const issueCounts = {};
        const summaries = [];
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
    await mongoose_1.default.disconnect();
}
main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
});
