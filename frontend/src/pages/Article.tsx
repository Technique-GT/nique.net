import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import Navbar from "../components/Navbar";
import ArticleBlock from "../components/ArticleBlock";
import Comment from "../components/Comment";
import Spinner from "../components/Spinner";
import articleService from "../services/articleService";
import commentService from "../services/commentService";
import { ArticleDocument, User, Comment as CommentType } from "../types/article";

/**
 * Map API comment (backend shape) to display format.
 * backend uses `username` directly, not `author.name/avatar`.
 */
const mapApiCommentToDisplay = (comment: CommentType) => {
  return {
    _id: comment._id,
    content: comment.content,
    createdAt: comment.createdAt,
    thumbsUp: comment.thumbsUp ?? 0,
    thumbsDown: comment.thumbsDown ?? 0,
    username: comment.username || "Anonymous",
  };
};

type DisplayComment = ReturnType<typeof mapApiCommentToDisplay>;

const sortComments = (
  list: DisplayComment[],
  sortMode: "Best" | "Newest" | "Oldest"
): DisplayComment[] => {
  const clone = [...list];
  switch (sortMode) {
    case "Oldest":
      return clone.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case "Newest":
      return clone.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    default:
      return clone.sort((a, b) => (b.thumbsUp || 0) - (a.thumbsUp || 0));
  }
};

/**
 * Flatten nested comment replies into a single list (if needed).
 */
const flattenComments = (comments: CommentType[]): CommentType[] => {
  const result: CommentType[] = [];
  for (const comment of comments) {
    result.push(comment);
    if (comment.replies && comment.replies.length > 0) {
      result.push(...flattenComments(comment.replies));
    }
  }
  return result;
};

export default function Article() {
  const { id, slug } = useParams();
  const normalizedId = useMemo(() => {
    if (slug) return undefined; // prefer slug if available
    if (!id) return undefined;
    return /^[a-f0-9]{24}:\d+$/i.test(id) ? id.split(":")[0] : id;
  }, [id, slug]);
  const [isLoading, setIsLoading] = useState(true);
  const [article, setArticle] = useState<ArticleDocument | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<ArticleDocument[]>([]);
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [numCommentsToView, setNumCommentsToView] = useState(5);
  const [commentsSortBy, setCommentsSort] = useState<"Best" | "Newest" | "Oldest">("Best");

  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!normalizedId && !slug) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        setIsLoading(true);
        let fetchedArticle: ArticleDocument;

        if (slug) {
          fetchedArticle = await articleService.fetchArticleBySlug(slug, controller.signal);
        } else if (normalizedId) {
          fetchedArticle = await articleService.fetchArticleById(normalizedId, controller.signal);
        } else {
          return;
        }

        setArticle(fetchedArticle);

        // backend uses categoryId (populated object), not categories[]
        const categoryId = fetchedArticle.categoryId?._id;

        if (categoryId) {
          try {
            const relatedArticles = await articleService.fetchArticlesByCategory(
              categoryId,
              4,
              controller.signal
            );

            const fetchedArticleId = fetchedArticle._id || "";

            const filteredRelated = relatedArticles.filter((item) => item._id !== fetchedArticleId);
            setRelatedArticles(filteredRelated);
          } catch (relatedErr) {
            console.warn("Unable to load related articles", relatedErr);
            setRelatedArticles([]);
          }
        } else {
          setRelatedArticles([]);
        }

        if (fetchedArticle.allowComments) {
          try {
            const fetchedComments = await commentService.fetchCommentsByArticle(
              fetchedArticle._id, // use the real ID from the fetched article
              controller.signal
            );
            // Flatten any nested replies and map to display format
            const flattened = flattenComments(fetchedComments);
            const mappedComments = flattened.map(mapApiCommentToDisplay);
            setComments(sortComments(mappedComments, commentsSortBy));
          } catch {
            setComments([]);
          }
        } else {
          setComments([]);
        }
      } catch (err) {
        if (
          (err as { name?: string; code?: string })?.name === "CanceledError" ||
          (err as { code?: string })?.code === "ERR_CANCELED"
        ) {
          return;
        }
        console.error("Failed to load article", err);
        setArticle(null);
        setRelatedArticles([]);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [normalizedId, slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [normalizedId, slug]);

  const articleContent = typeof article?.content === "string" ? article.content : null;

  const normalizeSpansToParagraphs = (raw: string) =>
    raw.replace(/<\s*span([^>]*)>/gi, "<p$1>").replace(/<\/\s*span\s*>/gi, "</p>");

  const sanitizedContent = useMemo(() => {
    if (!articleContent) return "";
    const normalized = normalizeSpansToParagraphs(articleContent);
    return DOMPurify.sanitize(normalized);
  }, [articleContent]);

  const handleSubmitComment = async () => {
    const articleId = article?._id || normalizedId;
    if (!articleId || !newCommentText.trim() || isSubmittingComment) {
      return;
    }

    setIsSubmittingComment(true);
    setCommentSubmitError(null);

    try {
      const createdComment = await commentService.createComment(articleId, {
        content: newCommentText.trim(),
        username: newCommentName.trim() || undefined,
      });

      const displayComment = mapApiCommentToDisplay(createdComment);
      setComments((prev) => sortComments([displayComment, ...prev], commentsSortBy));
      setNewCommentText("");
      setNewCommentName("");
    } catch (error) {
      console.error("Error creating comment:", error);
      setCommentSubmitError("Unable to submit your comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  useEffect(() => {
    setNumCommentsToView(5);
    setComments((prev) => sortComments(prev, commentsSortBy));
  }, [commentsSortBy]);

  const updateCommentsSort = () => {
    setCommentsSort((prev) => {
      if (prev === "Best") return "Newest";
      if (prev === "Newest") return "Oldest";
      return "Best";
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!article) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <p className="text-lg text-nique-blue">Article not found.</p>
        </div>
      </>
    );
  }

  // Extract author names from backend's authors[].authorId shape
  const authorNames =
    article.authors?.map((authorEntry) => {
      const authorId = authorEntry.authorId;
      if (!authorId) return null;
      // If populated (User object with name)
      if (typeof authorId === "object") {
        const user = authorId as User;
        return user.name || null;
      }
      // If string (shouldn't happen when populated)
      if (typeof authorId === "string") return authorId;
      return null;
    }).filter((name): name is string => Boolean(name)) || [];

  const authorsDisplay = authorNames.length ? authorNames.join(" • ") : "Technique Staff";

  const publishedDate =
    article.publishedAt &&
    new Date(article.publishedAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // backend uses tagIds, not tags
  const tagsDisplay = article.tagIds?.map((tag) => tag.name).filter(Boolean).join(" • ");
  const featuredMedia =
    article.featuredMediaId && typeof article.featuredMediaId === "object"
      ? article.featuredMediaId
      : null;

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Title */}
        <header className="space-y-2">
          <h3 className="text-4xl font-bold mt-2 mb-1">{article.title}</h3>
          <h4 className="flex flex-wrap mb-2 gap-x-4 text-nique-blue text-lg justify-between">
            <div>
              <span>{authorsDisplay}</span>
              {publishedDate && <span> • {publishedDate}</span>}
            </div>
            {/* backend uses categoryId (single object), not categories[] */}
            {article.categoryId && (
              <span>{article.categoryId.name}</span>
            )}
          </h4>
          {tagsDisplay && <p className="text-xs text-nique-blue">{tagsDisplay}</p>}
          <hr className="opacity-50" />
        </header>

        {/* Featured Image - backend uses featuredMediaId, not featuredImage */}
        {featuredMedia && (
          <figure className="my-3 max-w-3xl w-full mx-auto text-sm">
            <img
              className="w-full aspect-3/2 object-cover rounded-md"
              src={featuredMedia.url}
              loading="lazy"
              alt={featuredMedia.altText || article.title}
            />
            {article.imageCaption && (
              <figcaption className="w-full text-xs text-nique-blue mt-2">
                {article.imageCaption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Article Content */}
        <section className="prose prose-lg max-w-4xl mx-auto text-[#1A1E47] article-body">
          {sanitizedContent ? (
            <article dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
          ) : (
            <p>{article.excerpt}</p>
          )}
        </section>

        {/* Related Articles - fetches 4 published articles from the same category */}
        {relatedArticles.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-nique-blue">Related Articles</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {relatedArticles.map((related) => (
                <ArticleBlock key={related._id || related.slug} article={related} height="230px" />
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-nique-blue">
              Comments ({comments.length})
            </h3>
            <button
              onClick={updateCommentsSort}
              className="text-sm text-nique-blue underline"
            >
              Sort: {commentsSortBy}
            </button>
          </div>

          {article.allowComments ? (
            <>
              <div className="grid gap-4">
                {comments.slice(0, numCommentsToView).map((com) => (
                  <Comment
                    key={com._id}
                    commentId={com._id}
                    username={com.username}
                    content={com.content}
                    createdAt={new Date(com.createdAt).toLocaleString()}
                    thumbsDown={com.thumbsDown}
                    thumbsUp={com.thumbsUp}
                  />
                ))}
              </div>

              {numCommentsToView < comments.length && (
                <button
                  onClick={() => setNumCommentsToView((prev) => prev + 5)}
                  className="text-sm text-nique-blue underline"
                >
                  Load more comments
                </button>
              )}

              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-nique-blue">Leave a comment</h4>
                <input
                  value={newCommentName}
                  onChange={(event) => setNewCommentName(event.target.value)}
                  placeholder="Name"
                  className="w-full border border-nique-blue/40 rounded-md px-3 py-2"
                />
                <textarea
                  value={newCommentText}
                  onChange={(event) => setNewCommentText(event.target.value)}
                  placeholder="Comment"
                  className="w-full border border-nique-blue/40 rounded-md px-3 py-2"
                  rows={4}
                />
                {commentSubmitError && (
                  <p className="text-sm text-red-600">{commentSubmitError}</p>
                )}
                <button
                  onClick={handleSubmitComment}
                  disabled={!newCommentText.trim() || isSubmittingComment}
                  className="px-4 py-2 bg-nique-blue text-white rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <h4>{isSubmittingComment ? "Submitting..." : "Submit"}</h4>
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-nique-blue">Comments are disabled for this article.</p>
          )}
        </section>
      </div>
    </>
  );
}
