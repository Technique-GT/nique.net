import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SuccessTick from "../components/SuccessTick";
import DOMPurify from "dompurify";
import Navbar from "../components/Navbar";
import ArticleBlock from "../components/ArticleBlock";
import Comment from "../components/Comment";
import Spinner from "../components/Spinner";
import articleService from "../services/articleService";
import { articleCache } from "../services/articleCache";
import commentService from "../services/commentService";
import { ArticleDocument, User, Comment as CommentType } from "../types/article";

type DisplayComment = {
  _id: string;
  commentId: string;
  content: string;
  createdAt: string;
  thumbsUp: number;
  thumbsDown: number;
  myReaction: "up" | "down" | null;
  parentCommentId?: string;
  username: string;
  replies: DisplayComment[];
};

/**
 * Map API comment (backend shape) to display format.
 * backend uses `username` directly, not `author.name/avatar`.
 */
const mapApiCommentToDisplay = (comment: CommentType): DisplayComment => {
  return {
    _id: comment._id,
    commentId: comment._id,
    content: comment.content,
    createdAt: typeof comment.createdAt === "string" ? comment.createdAt : String(comment.createdAt),
    thumbsUp: comment.thumbsUp ?? 0,
    thumbsDown: comment.thumbsDown ?? 0,
    myReaction: comment.myReaction ?? null,
    parentCommentId: comment.parentCommentId,
    username: comment.username || "Anonymous",
    replies: (comment.replies || []).map(mapApiCommentToDisplay),
  };
};

const sortRepliesByOldest = (list: DisplayComment[]): DisplayComment[] => {
  const mapped = list.map((comment) => ({
    ...comment,
    replies: sortRepliesByOldest(comment.replies || []),
  }));
  return mapped.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

const sortComments = (
  list: DisplayComment[],
  sortMode: "Best" | "Newest" | "Oldest"
): DisplayComment[] => {
  const withSortedReplies = list.map((comment) => ({
    ...comment,
    replies: sortRepliesByOldest(comment.replies || []),
  }));

  switch (sortMode) {
    case "Oldest":
      return [...withSortedReplies].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case "Newest":
      return [...withSortedReplies].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    default:
      return [...withSortedReplies].sort((a, b) => (b.thumbsUp || 0) - (a.thumbsUp || 0));
  }
};

export default function Article() {
  const { id, slug } = useParams();
  const normalizedId = useMemo(() => {
    if (slug) return undefined; // prefer slug if available
    if (!id) return undefined;
    return /^[a-f0-9]{24}:\d+$/i.test(id) ? id.split(":")[0] : id;
  }, [id, slug]);

  // Check cache immediately for instant display
  const initialCachedArticle = useMemo(() => {
    const cacheKey = slug || normalizedId || '';
    return cacheKey ? articleCache.get(cacheKey) : null;
  }, [slug, normalizedId]);

  const [isLoading, setIsLoading] = useState(!initialCachedArticle);
  const [article, setArticle] = useState<ArticleDocument | null>(initialCachedArticle);
  const [relatedArticles, setRelatedArticles] = useState<ArticleDocument[]>([]);
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [numCommentsToView, setNumCommentsToView] = useState(5);
  const [commentsSortBy, setCommentsSort] = useState<"Best" | "Newest" | "Oldest">("Best");

  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showSubmitMessage, setShowSubmitMessage] = useState(false);
  const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!normalizedId && !slug) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        // Only show loading if we don't have cached data
        if (!article) {
          setIsLoading(true);
        }
        let fetchedArticle: ArticleDocument;

        if (slug) {
          fetchedArticle = await articleService.fetchArticleBySlug(slug, controller.signal);
        } else if (normalizedId) {
          fetchedArticle = await articleService.fetchArticleById(normalizedId, controller.signal);
        } else {
          return;
        }

        setArticle(fetchedArticle);
        // Update cache with fresh data
        articleCache.set(fetchedArticle);

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
            const mappedComments = fetchedComments.map(mapApiCommentToDisplay);
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
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
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
      await commentService.createComment(articleId, {
        content: newCommentText.trim(),
        username: newCommentName.trim() || undefined,
      });

      // const displayComment = mapApiCommentToDisplay(createdComment);
      // setComments((prev) => sortComments([displayComment, ...prev], commentsSortBy));
      setShowSubmitMessage(true);
      setTimeout(() => setShowSubmitMessage(false), 3000);
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
  const featuredMedia = article.featuredMediaUrl && typeof article.featuredMediaUrl === "string"
      ? article.featuredMediaUrl
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

        {/* Featured Image - backend uses featuredMediaUrl, not featuredImage */}
        {featuredMedia && (
          <figure className="my-3 max-w-3xl w-full mx-auto text-sm">
            <img
              className="w-full aspect-3/2 object-cover rounded-md"
              src={featuredMedia}
              loading="lazy"
              alt={article.title}
            />
            {article.imageCaption && (
              <figcaption className="w-full text-xs text-nique-blue mt-2">
                {article.imageCaption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Article Content */}
        <section className="prose prose-lg max-w-3xl mx-auto text-nique-blue article-body">
          {sanitizedContent ? (
            <article dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
          ) : null}
        </section>

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
                    key={com.commentId}
                    commentId={com.commentId}
                    username={com.username}
                    content={com.content}
                    createdAt={String(com.createdAt)}
                    thumbsDown={com.thumbsDown}
                    thumbsUp={com.thumbsUp}
                    myReaction={com.myReaction}
                    replies={com.replies}
                    articleId={article._id}
                    onReplySubmitted={() => {
                      setShowSubmitMessage(true);
                      setTimeout(() => setShowSubmitMessage(false), 3000);
                    }}
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
                <div className='flex flex-row'>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newCommentText.trim() || isSubmittingComment}
                    className="px-4 py-2 bg-nique-blue text-white rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <h4>{isSubmittingComment ? "Submitting..." : "Submit"}</h4>
                  </button>
                  {showSubmitMessage && (
                    <div className="flex flex-row submit-toast fixed top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-gray-200/70 text-nique-blue backdrop-blur-xs py-2 px-4 gap-2 rounded-md items-center">
                      <SuccessTick className='text-nique-blue'/>
                      <p>Your comment has been submitted and is awaiting approval. Check back in a bit!</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-nique-blue">Comments are disabled for this article.</p>
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

      </div>
    </>
  );
}
