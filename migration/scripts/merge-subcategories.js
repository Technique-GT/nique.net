// node migration/scripts/normalize-articles.js \  "migration/Archive 2/articles.json" \
//   "migration/Archive 2/normalized-articles.json" \
//   "migration/Archive 2/normalize-report.json"  

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const inputPath =
  process.argv[2] || path.join("migration", "Archive 2", "normalized-articles.json");
const newArticlesPath =
  process.argv[3] || path.join("migration", "Archive 2", "new_articles.json");
const outputPath =
  process.argv[4] || path.join("migration", "Archive 2", "normalized-articles.json");
const reportPath =
  process.argv[5] || path.join("migration", "Archive 2", "merge-subcategories-report.json");

const normalizedRaw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const newPayload = JSON.parse(fs.readFileSync(newArticlesPath, "utf8"));

const normalized = Array.isArray(normalizedRaw)
  ? { users: [], categories: [], tags: [], media: [], articles: normalizedRaw }
  : normalizedRaw;

const articleList = Array.isArray(newPayload.articles) ? newPayload.articles : [];
const attachmentList = Array.isArray(newPayload.attachments) ? newPayload.attachments : [];
const attachmentById = new Map(
  attachmentList
    .filter((attachment) => attachment && attachment.id !== undefined && attachment.id !== null)
    .map((attachment) => [String(attachment.id), attachment]),
);
const authorList = Array.isArray(newPayload.authors) ? newPayload.authors : [];

const toObjectId = (value) =>
  crypto.createHash("md5").update(String(value)).digest("hex").slice(0, 24);

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const str = String(value).trim();
  if (!str) return null;
  const normalized = str.includes("T") ? str : str.replace(" ", "T");
  const asDate = new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`);
  if (Number.isNaN(asDate.getTime())) return null;
  return asDate.toISOString();
};

const normalizeContent = (html) => {
  if (typeof html !== "string") return "<p></p>";
  let cleaned = html.replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/<span[^>]*>/gi, "").replace(/<\/span>/gi, "");
  cleaned = cleaned.replace(/&nbsp;/gi, " ").trim();

  if (/<p[\s>]/i.test(cleaned)) {
    return cleaned;
  }

  const blocks = cleaned
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return cleaned ? `<p>${cleaned}</p>` : "<p></p>";
  }

  return blocks.map((block) => `<p>${block}</p>`).join("\n");
};

const capitalizeFirst = (value) => {
  const str = String(value || "").trim();
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const normalizeAuthorName = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes(".")) {
    return raw
      .split(".")
      .map((part) => capitalizeFirst(part))
      .filter(Boolean)
      .join(" ");
  }
  return raw
    .split(/\s+/)
    .map((part) => capitalizeFirst(part))
    .join(" ");
};

normalized.users = Array.isArray(normalized.users) ? normalized.users : [];
normalized.categories = Array.isArray(normalized.categories) ? normalized.categories : [];
normalized.tags = Array.isArray(normalized.tags) ? normalized.tags : [];
normalized.media = Array.isArray(normalized.media) ? normalized.media : [];
normalized.articles = Array.isArray(normalized.articles) ? normalized.articles : [];
normalized.subcategories = Array.isArray(normalized.subcategories)
  ? normalized.subcategories
  : [];

const userMap = new Map();
const categoryMap = new Map();
const tagMap = new Map();
const mediaMap = new Map();
const subcategoryMap = new Map();

normalized.users.forEach((user) => {
  if (user && user._id) userMap.set(String(user._id), user);
});
normalized.categories.forEach((category) => {
  if (!category) return;
  const slug = slugify(category.slug || category.name);
  if (slug) categoryMap.set(slug, category);
});
normalized.tags.forEach((tag) => {
  if (!tag) return;
  const slug = slugify(tag.slug || tag.name);
  if (slug) tagMap.set(slug, tag);
});
normalized.media.forEach((media) => {
  if (media && media._id) mediaMap.set(String(media._id), media);
});
normalized.subcategories.forEach((subcat) => {
  if (!subcat) return;
  const slug = slugify(subcat.slug || subcat.name);
  const categoryId = String(subcat.categoryId || "");
  if (slug && categoryId) subcategoryMap.set(`${categoryId}|${slug}`, subcat);
});

const ensureCategoryId = (value) => {
  const slug = slugify(value);
  if (!slug) return null;
  if (categoryMap.has(slug)) return categoryMap.get(slug)._id;
  const categoryId = toObjectId(`category:${slug}`);
  const name = String(value || "").trim();
  const entry = { _id: categoryId, name, slug };
  normalized.categories.push(entry);
  categoryMap.set(slug, entry);
  return categoryId;
};

const ensureTagId = (value) => {
  const slug = slugify(value);
  if (!slug) return null;
  if (tagMap.has(slug)) return tagMap.get(slug)._id;
  const tagId = toObjectId(`tag:${slug}`);
  const name = String(value || "").trim();
  const entry = { _id: tagId, name, slug };
  normalized.tags.push(entry);
  tagMap.set(slug, entry);
  return tagId;
};

const ensureMediaId = (value, altText) => {
  if (value === null || value === undefined || value === "") return null;
  const attachment =
    typeof value === "number" || /^[0-9]+$/.test(String(value))
      ? attachmentById.get(String(value))
      : null;
  const resolvedUrl = attachment?.url ? String(attachment.url) : String(value);
  const resolvedAltText = attachment?.title || attachment?.caption || altText;
  const key = String(resolvedUrl).trim();
  if (!key) return null;
  const mediaId = toObjectId(`media:${key}`);
  if (!mediaMap.has(mediaId)) {
    const entry = { _id: mediaId, url: key, altText: String(resolvedAltText || "").trim() };
    normalized.media.push(entry);
    mediaMap.set(mediaId, entry);
  }
  return mediaId;
};

const ensureUserId = ({ name, email, keySeed }) => {
  const normalizedName = normalizeAuthorName(name);
  const seed = keySeed || normalizeKey(email) || normalizeKey(normalizedName);
  if (!seed) return null;
  const userId = toObjectId(`user:${seed}`);
  if (!userMap.has(userId)) {
    const entry = {
      _id: userId,
      name: normalizedName || "Unknown Author",
      ...(email ? { email: normalizeKey(email) } : {}),
      isAdmin: false,
      socialLinks: [],
    };
    normalized.users.push(entry);
    userMap.set(userId, entry);
  }
  return userId;
};

const ensureSubcategoryId = ({ categoryId, value }) => {
  const slug = slugify(value);
  if (!slug || !categoryId) return null;
  const key = `${categoryId}|${slug}`;
  if (subcategoryMap.has(key)) return subcategoryMap.get(key)._id;
  const subcategoryId = toObjectId(`subcategory:${slug}`);
  const entry = { _id: subcategoryId, categoryId, name: String(value || "").trim(), slug };
  normalized.subcategories.push(entry);
  subcategoryMap.set(key, entry);
  return subcategoryId;
};

authorList.forEach((author) => {
  const username = normalizeKey(author?.username);
  const email = normalizeKey(author?.email);
  const nameValue = [author?.firstName, author?.lastName].filter(Boolean).join(" ");
  ensureUserId({ name: nameValue, email, keySeed: username || email });
});

attachmentList.forEach((attachment) => {
  ensureMediaId(attachment?.url, attachment?.title || attachment?.caption || "");
});

const normalizedByKey = new Map();
normalized.articles.forEach((article) => {
  const key = slugify(article?.slug || article?.title);
  if (key) normalizedByKey.set(key, article);
});

const missingMatches = [];
let mergedCount = 0;
let addedCount = 0;

articleList.forEach((article, index) => {
  const key = slugify(article?.slug || article?.title);
  if (!key) {
    missingMatches.push({ title: article?.title || "", reason: "missing slug/title" });
    return;
  }

  const rawSubcategory = Array.isArray(article?.subcategories)
    ? article.subcategories[0]
    : null;
  const subcategoryValue =
    rawSubcategory && typeof rawSubcategory === "object" ? rawSubcategory.value : null;
  const subcategoryCategory =
    rawSubcategory && typeof rawSubcategory === "object" ? rawSubcategory.category : null;

  const categorySource = subcategoryCategory || (Array.isArray(article?.categories) ? article.categories[0] : null);
  const categoryId = ensureCategoryId(categorySource);
  const subcategoryId = ensureSubcategoryId({
    categoryId,
    value: subcategoryValue,
  });

  const existing = normalizedByKey.get(key);
  if (existing) {
    if (subcategoryId) {
      existing.subcategoryId = subcategoryId;
    }
    mergedCount += 1;
    return;
  }

  const title = String(article?.title || "").trim();
  const slug = article?.slug ? String(article.slug).trim() : slugify(title);
  const content = normalizeContent(article?.content || "");
  const tagIds = Array.isArray(article?.tags)
    ? article.tags.map(ensureTagId).filter(Boolean)
    : [];

  const rawAuthors = Array.isArray(article?.authors) ? article.authors : [];
  const authors = rawAuthors
    .map((authorKey, authorIndex) => {
      const normalizedName = normalizeAuthorName(authorKey);
      const userId = ensureUserId({ name: normalizedName, keySeed: normalizeKey(normalizedName) });
      if (!userId) return null;
      return { authorId: userId, order: authorIndex };
    })
    .filter(Boolean);

  const ownerId = authors[0]?.authorId || toObjectId("user:unknown");
  const published = article?.status === "published" || article?.published === true;
  const publishedAt = parseDate(article?.publishedAt);
  const updatedAt = parseDate(article?.updatedAt);
  const createdAt = parseDate(article?.createdAt) || publishedAt || updatedAt;
  const featuredMediaId = ensureMediaId(article?.featuredImage);

  normalized.articles.push({
    _id: toObjectId(`article:${slug || title || index}`),
    title,
    slug,
    content,
    ...(article?.excerpt ? { excerpt: String(article.excerpt).trim() } : {}),
    authors,
    ...(categoryId ? { categoryId } : {}),
    ...(subcategoryId ? { subcategoryId } : {}),
    ...(tagIds.length ? { tagIds } : {}),
    ...(featuredMediaId ? { featuredMediaId } : {}),
    published,
    ...(publishedAt ? { publishedAt } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
    isFeatured: Boolean(article?.isFeatured),
    isSticky: Boolean(article?.isSticky),
    allowComments: article?.allowComments !== undefined ? Boolean(article.allowComments) : true,
    ownerId,
    reviewStatus: published ? "published" : "draft",
    hasPendingChanges: false,
    viewCount: Number.isFinite(article?.viewCount) ? Number(article.viewCount) : 0,
  });

  normalizedByKey.set(key, normalized.articles[normalized.articles.length - 1]);
  addedCount += 1;
});

const report = {
  input: inputPath,
  newArticlesInput: newArticlesPath,
  output: outputPath,
  totals: {
    users: normalized.users.length,
    categories: normalized.categories.length,
    tags: normalized.tags.length,
    media: normalized.media.length,
    subcategories: normalized.subcategories.length,
    articles: normalized.articles.length,
  },
  mergedArticles: mergedCount,
  addedArticles: addedCount,
  missingMatches,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2));
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`Merged subcategories into ${outputPath}`);
console.log(`Report written to ${reportPath}`);
