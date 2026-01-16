import { ArticleDocument, Post } from "../types/article";

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const resolveAuthorName = (article: Pick<ArticleDocument, "authors">) => {
  const primaryAuthor = article.authors?.[0]?.user;
  let authorName = "Technique Staff";

  if (typeof primaryAuthor === "string") {
    authorName = primaryAuthor;
  } else if (primaryAuthor) {
    const composed = [primaryAuthor.firstName, primaryAuthor.lastName]
      .filter(Boolean)
      .join(" ");

    authorName =
      primaryAuthor.username ||
      composed ||
      primaryAuthor.email ||
      authorName;
  }

  return authorName;
};

const normalizeArticleId = (value: string) => {
  if (/^[a-f0-9]{24}:\d+$/i.test(value)) {
    return value.split(":")[0];
  }
  return value;
};

export const mapArticleToPost = (article: ArticleDocument): Post => {
  const rawId =
    article.id ||
    article._id ||
    article.slug ||
    "";
  const fallbackId = normalizeArticleId(rawId);

  const desc = article.excerpt || article.content || "";

  return {
    id: fallbackId,
    slug: article.slug,
    title: article.title || "",
    excerpt: article.excerpt,
    desc: stripHtml(desc),
    author: resolveAuthorName(article),
    category: article.categories?.[0]?.name || "",
    featuredImage: article.featuredImage || null,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    isSticky: article.isSticky,
  };
};
