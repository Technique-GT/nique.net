// node migration/scripts/normalize-article-objectids.js \
//   "migration/Archive 2/Untitled-1.json" \
//   "migration/Archive 2/articles-objectids.json"

const fs = require("fs");
const path = require("path");

const inputPath =
  process.argv[2] || path.join("migration", "Archive 2", "Untitled-1.json");
const outputPath =
  process.argv[3] || path.join("migration", "Archive 2", "articles-objectids.json");

const readJsonArray = (raw) => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line) => JSON.parse(line));
};

const toObjectId = (value) => {
  if (!value) return value;
  if (typeof value === "object" && typeof value.$oid === "string") return value;
  if (typeof value === "string") return { $oid: value };
  return value;
};

const toObjectIdArray = (value) => {
  if (Array.isArray(value)) return value.map(toObjectId);
  if (typeof value === "string") return [{ $oid: value }];
  return [];
};

const raw = fs.readFileSync(inputPath, "utf8");
const articles = readJsonArray(raw);

let updated = 0;

const normalized = articles.map((article) => {
  if (!article || typeof article !== "object") return article;
  updated += 1;

  const next = { ...article };
  next._id = toObjectId(next._id);
  next.categoryId = toObjectId(next.categoryId);
  next.subcategoryId = toObjectId(next.subcategoryId);
  next.ownerId = toObjectId(next.ownerId);
  if (next.reviewedBy) {
    next.reviewedBy = toObjectId(next.reviewedBy);
  }

  if (Array.isArray(next.authors)) {
    next.authors = next.authors.map((author) => {
      if (!author || typeof author !== "object") return author;
      return {
        ...author,
        authorId: toObjectId(author.authorId),
      };
    });
  }

  if (next.tagIds !== undefined) {
    next.tagIds = toObjectIdArray(next.tagIds);
  } else if (next.tagId !== undefined) {
    next.tagIds = toObjectIdArray(next.tagId);
    delete next.tagId;
  } else {
    next.tagIds = [];
  }

  return next;
});

fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2));

// eslint-disable-next-line no-console
console.log(`Normalized ${updated} articles to ObjectId form.`);
