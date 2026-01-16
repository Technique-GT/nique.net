import { ArticleDocument, Post, User } from "../types/article";

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/**
 * Resolve author name from newbackend's `authors[].authorId` shape.
 * authorId is populated to a User object with `name` field.
 */
const resolveAuthorName = (article: Pick<ArticleDocument, "authors">) => {
  const primaryAuthorEntry = article.authors?.[0];
  if (!primaryAuthorEntry) return "Technique Staff";

  const authorId = primaryAuthorEntry.authorId;

  // If populated (User object)
  if (authorId && typeof authorId === "object") {
    const user = authorId as User;
    if (user.name) return user.name;
  }

  // If string (unpopulated ObjectId) - shouldn't happen with newbackend but defensive
  if (typeof authorId === "string" && authorId.trim()) {
    return authorId;
  }

  return "Technique Staff";
};

const normalizeArticleId = (value: string) => {
  if (/^[a-f0-9]{24}:\d+$/i.test(value)) {
    return value.split(":")[0];
  }
  return value;
};

/**
 * Map a full ArticleDocument (newbackend shape) to a simplified Post for list views.
 */
export const mapArticleToPost = (article: ArticleDocument): Post => {
  const rawId = article._id || article.slug || "";
  const fallbackId = normalizeArticleId(rawId);

  const desc = article.excerpt || article.content || "";

  return {
    id: fallbackId,
    slug: article.slug,
    title: article.title || "",
    excerpt: article.excerpt,
    desc: stripHtml(desc),
    author: resolveAuthorName(article),
    // newbackend uses categoryId (populated object), not categories[]
    category: article.categoryId?.name || "",
    // newbackend uses featuredMediaId, not featuredImage
    featuredImage: article.featuredMediaId || null,
    imageCaption: article.imageCaption,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    isSticky: article.isSticky,
  };
};
