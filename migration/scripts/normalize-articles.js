// node migration/scripts/normalize-articles.js \  "migration/Archive 2/articles.json" \
//   "migration/Archive 2/normalized-articles.json" \
//   "migration/Archive 2/normalize-report.json"  

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const inputPath = process.argv[2] || path.join("migration", "Archive 2", "articles.json");
const outputPath =
  process.argv[3] || path.join("migration", "Archive 2", "normalized-articles.json");
const reportPath =
  process.argv[4] || path.join("migration", "Archive 2", "normalize-report.json");

const raw = fs.readFileSync(inputPath, "utf8");
const payload = JSON.parse(raw);

const authorList = Array.isArray(payload.authors) ? payload.authors : [];
const articleList = Array.isArray(payload.articles) ? payload.articles : [];
const attachmentList = Array.isArray(payload.attachments) ? payload.attachments : [];
const attachmentById = new Map(
  attachmentList
    .filter((attachment) => attachment && attachment.id !== undefined && attachment.id !== null)
    .map((attachment) => [String(attachment.id), attachment]),
);

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

const userMap = new Map();
const userIdMap = {};
const missingAuthors = new Set();

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

const unknownUserId = toObjectId("user:unknown");

authorList.forEach((author) => {
  const username = normalizeKey(author?.username);
  const email = normalizeKey(author?.email);
  const nameValue = [author?.firstName, author?.lastName].filter(Boolean).join(" ");
  const name = normalizeKey(nameValue);
  const idSeed = username || email || name;
  if (!idSeed) return;
  const userId = toObjectId(`user:${idSeed}`);

  [username, email, name].filter(Boolean).forEach((key) => {
    userMap.set(key, userId);
  });
  userIdMap[idSeed] = userId;
});

const categoryIdMap = {};
const tagIdMap = {};
const mediaIdMap = {};

const usersById = new Map();
const categoriesById = new Map();
const tagsById = new Map();
const mediaById = new Map();

const ensureCategoryId = (slug) => {
  const key = normalizeKey(slug);
  if (!key) return null;
  if (!categoryIdMap[key]) {
    categoryIdMap[key] = toObjectId(`category:${key}`);
  }
  return categoryIdMap[key];
};

const ensureTagId = (name) => {
  const key = normalizeKey(name);
  if (!key) return null;
  if (!tagIdMap[key]) {
    tagIdMap[key] = toObjectId(`tag:${key}`);
  }
  return tagIdMap[key];
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
  if (!mediaIdMap[key]) {
    mediaIdMap[key] = toObjectId(`media:${key}`);
  }
  const mediaId = mediaIdMap[key];
  if (!mediaById.has(mediaId)) {
    mediaById.set(mediaId, {
      _id: mediaId,
      url: key,
      altText: String(resolvedAltText || "").trim(),
    });
  }
  return mediaIdMap[key];
};

const ensureUser = ({ name, email, keySeed }) => {
  const normalizedName = normalizeAuthorName(name);
  const nameKey = normalizeKey(normalizedName);
  const emailKey = normalizeKey(email);
  const seed = keySeed || emailKey || nameKey;
  if (!seed) return null;
  const userId = toObjectId(`user:${seed}`);
  if (!usersById.has(userId)) {
    usersById.set(userId, {
      _id: userId,
      name: normalizedName || "Unknown Author",
      ...(emailKey ? { email: emailKey } : {}),
      isAdmin: false,
      socialLinks: [],
    });
  }
  return userId;
};

authorList.forEach((author) => {
  const username = normalizeKey(author?.username);
  const email = normalizeKey(author?.email);
  const nameValue = [author?.firstName, author?.lastName].filter(Boolean).join(" ");
  const userId = ensureUser({ name: nameValue, email, keySeed: username || email });
  if (!userId) return;
  [username, email, normalizeKey(nameValue)].filter(Boolean).forEach((key) => {
    userMap.set(key, userId);
  });
});

usersById.set(unknownUserId, {
  _id: unknownUserId,
  name: "Unknown Author",
  isAdmin: false,
  socialLinks: [],
});

attachmentList.forEach((attachment) => {
  const altText = attachment?.title || attachment?.caption || "";
  ensureMediaId(attachment?.url, altText);
});

const normalizedArticles = articleList.map((article, index) => {
  const title = String(article?.title || "").trim();
  const slug = article?.slug ? String(article.slug).trim() : slugify(title);
  const content = normalizeContent(article?.content || "");

  const categoryId = Array.isArray(article?.categories)
    ? ensureCategoryId(article.categories[0])
    : ensureCategoryId(article?.category);

  if (categoryId && !categoriesById.has(categoryId)) {
    const categoryName = Array.isArray(article?.categories)
      ? String(article.categories[0] || "").trim()
      : String(article?.category || "").trim();
    categoriesById.set(categoryId, {
      _id: categoryId,
      name: categoryName,
      slug: slugify(categoryName),
    });
  }

  const tagIds = Array.isArray(article?.tags)
    ? article.tags
        .map((tag) => {
          const tagId = ensureTagId(tag);
          if (!tagId) return null;
          if (!tagsById.has(tagId)) {
            const tagName = String(tag || "").trim();
            tagsById.set(tagId, { _id: tagId, name: tagName, slug: slugify(tagName) });
          }
          return tagId;
        })
        .filter(Boolean)
    : [];

  const rawAuthors = Array.isArray(article?.authors) ? article.authors : [];
  const authors = rawAuthors
    .map((authorKey, index) => {
      const normalizedName = normalizeAuthorName(authorKey);
      const key = normalizeKey(normalizedName);
      if (!key) return null;
      const userId = userMap.get(key) || ensureUser({ name: normalizedName, keySeed: key });
      if (!userMap.get(key)) {
        missingAuthors.add(key);
      }
      return { authorId: userId, order: index };
    })
    .filter(Boolean);

  const ownerId = authors[0]?.authorId || unknownUserId;
  const published = article?.status === "published" || article?.published === true;
  const publishedAt = parseDate(article?.publishedAt);
  const updatedAt = parseDate(article?.updatedAt);
  const createdAt = parseDate(article?.createdAt) || publishedAt || updatedAt;

  const featuredMediaId = ensureMediaId(article?.featuredImage);

  return {
    _id: toObjectId(`article:${slug || title || index}`),
    title,
    slug,
    content,
    ...(article?.excerpt ? { excerpt: String(article.excerpt).trim() } : {}),
    authors,
    ...(categoryId ? { categoryId } : {}),
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
  };
});

const normalizedUsers = Array.from(usersById.values());
const normalizedCategories = Array.from(categoriesById.values());
const normalizedTags = Array.from(tagsById.values());
const normalizedMedia = Array.from(mediaById.values());

const outputPayload = {
  users: normalizedUsers,
  categories: normalizedCategories,
  tags: normalizedTags,
  media: normalizedMedia,
  articles: normalizedArticles,
};

const report = {
  input: inputPath,
  output: outputPath,
  totals: {
    authors: authorList.length,
    articles: articleList.length,
    users: normalizedUsers.length,
    categories: normalizedCategories.length,
    tags: normalizedTags.length,
    media: normalizedMedia.length,
    normalizedArticles: normalizedArticles.length,
    missingAuthors: missingAuthors.size,
  },
  missingAuthors: Array.from(missingAuthors).sort(),
  userIdMap,
  categoryIdMap,
  tagIdMap,
  mediaIdMap,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(outputPayload, null, 2));
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`Wrote ${normalizedArticles.length} articles to ${outputPath}`);
console.log(`Report written to ${reportPath}`);
