// node migration/scripts/attach-featured-media-url.js \
//   "migration/Archive 2/normalized-articles.json" \
//   "migration/Archive 2/normalized-articles.json"

const fs = require("fs");
const path = require("path");

const inputPath =
  process.argv[2] || path.join("migration", "Archive 2", "normalized-articles.json");
const outputPath = process.argv[3] || inputPath;

const readId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value.$oid === "string") return value.$oid;
    if (typeof value._id === "string") return value._id;
  }
  return null;
};

const raw = fs.readFileSync(inputPath, "utf8");
const payload = JSON.parse(raw);

const mediaList = Array.isArray(payload.media) ? payload.media : [];
const articleList = Array.isArray(payload.articles) ? payload.articles : [];

const mediaById = new Map(
  mediaList
    .map((media) => {
      const id = readId(media?._id);
      if (!id) return null;
      return [id, media];
    })
    .filter(Boolean),
);

let updated = 0;
let missingMedia = 0;
let missingId = 0;
const missingIdArticles = [];
const missingMediaArticles = [];

const updatedArticles = articleList.map((article) => {
  const featuredMediaId = readId(article?.featuredMediaId);
  if (!featuredMediaId) {
    missingId += 1;
    missingIdArticles.push({
      _id: readId(article?._id),
      slug: article?.slug,
      title: article?.title,
    });
    if (!article || typeof article !== "object") return article;
    const { featuredMediaId: _omit, ...rest } = article;
    return rest;
  }
  const media = mediaById.get(featuredMediaId);
  if (!media || typeof media.url !== "string" || !media.url.trim()) {
    missingMedia += 1;
    missingMediaArticles.push({
      _id: readId(article?._id),
      slug: article?.slug,
      title: article?.title,
      featuredMediaId,
    });
    if (!article || typeof article !== "object") return article;
    const { featuredMediaId: _omit, ...rest } = article;
    return rest;
  }
  updated += 1;
  const { featuredMediaId: _omit, ...rest } = article;
  return {
    ...rest,
    featuredMediaUrl: media.url.trim(),
  };
});

const nextPayload = {
  ...payload,
  articles: updatedArticles,
};

fs.writeFileSync(outputPath, JSON.stringify(nextPayload, null, 2));

// eslint-disable-next-line no-console
console.log(
  `Updated ${updated} articles. Missing featuredMediaId: ${missingId}. Missing media url: ${missingMedia}.`,
);
if (missingIdArticles.length) {
  // eslint-disable-next-line no-console
  console.log("Missing featuredMediaId articles:", missingIdArticles);
}
if (missingMediaArticles.length) {
  // eslint-disable-next-line no-console
  console.log("Missing media url articles:", missingMediaArticles);
}
