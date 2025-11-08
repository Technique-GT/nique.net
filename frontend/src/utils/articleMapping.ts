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

export const mapArticleToPost = (article: ArticleDocument): Post => {
  const fallbackId =
    article.id ||
    article._id ||
    article.slug ||
    "";

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
