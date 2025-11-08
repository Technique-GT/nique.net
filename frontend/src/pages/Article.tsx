import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import Navbar from "../components/Navbar";
import ArticleBlock from "../components/ArticleBlock";
import Comment from "../components/Comment";
import Spinner from "../components/Spinner";
import articleService from "../services/articleService";
import commentService from "../services/commentService";
import { ArticleDocument, Post } from "../types/article";
import { mapArticleToPost } from "../utils/articleMapping";

interface LoadedComment {
  _id: string;
  author: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  content: string;
  thumbsUp: number;
  thumbsDown: number;
}

const mapApiCommentToLoaded = (comment: any): LoadedComment => {
  const authorInfo = comment.author

  return {
    _id: comment?._id,
    content: comment?.content,
    createdAt: comment?.createdAt,
    thumbsUp: comment?.thumbsUp ?? comment?.Up ?? 0,
    thumbsDown: comment?.thumbsDown ?? comment?.Down ?? 0,
    author: {
      name: authorInfo.name,
      avatar: authorInfo.avatar
    },
  };
};

const sortComments = (
  list: LoadedComment[],
  sortMode: "Best" | "Newest" | "Oldest"
): LoadedComment[] => {
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

export default function Article() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [article, setArticle] = useState<ArticleDocument | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Post[]>([]);
  const [comments, setComments] = useState<LoadedComment[]>([]);
  const [numCommentsToView, setNumCommentsToView] = useState(5);
  const [commentsSortBy, setCommentsSort] = useState<"Best" | "Newest" | "Oldest">("Best");

  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        setIsLoading(true);
        const articleResponse = await articleService.fetchArticleById(id, controller.signal);
        const fetchedArticle: ArticleDocument = articleResponse.data;
        setArticle(fetchedArticle);

        const categoryId =
          fetchedArticle.categories?.[0]?._id ||
          (typeof fetchedArticle.categories?.[0] === "string"
            ? fetchedArticle.categories?.[0]
            : undefined);

        if (categoryId) {
          try {
            const relatedResponse = await articleService.fetchArticles(
              { category: categoryId, status: "published", limit: 4 },
              controller.signal
            );

            const fetchedArticleId =
              fetchedArticle.id ||
              (fetchedArticle as unknown as { _id?: string })._id ||
              "";

            const mappedRelated = (relatedResponse.data as ArticleDocument[])
              .filter((item) => {
                const candidateId =
                  item.id || (item as unknown as { _id?: string })._id || "";
                return candidateId !== fetchedArticleId;
              })
              .map(mapArticleToPost);

            setRelatedArticles(mappedRelated);
          } catch (relatedErr) {
            console.warn("Unable to load related articles", relatedErr);
            setRelatedArticles([]);
          }
        } else {
          setRelatedArticles([]);
        }

        if (fetchedArticle.allowComments) {
          try {
            const commentsResponse = await commentService.fetchCommentsByArticle(
              id,
              controller.signal
            );
            const mappedComments: LoadedComment[] = (commentsResponse.data || []).map(
              mapApiCommentToLoaded
            );
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
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const articleContent =typeof article?.content === "string" ? (article.content as string) : null;

  const normalizeSpansToParagraphs = (raw: string) => raw.replace(/<\s*span([^>]*)>/gi, "<p$1>").replace(/<\/\s*span\s*>/gi, "</p>");

  const sanitizedContent = useMemo(() => {
    if (!articleContent) return "";
    const normalized = normalizeSpansToParagraphs(articleContent);
    return DOMPurify.sanitize(normalized);
  }, [articleContent]);

  const handleSubmitComment = async () => {
    if (!id || !newCommentText.trim() || isSubmittingComment) {
      return;
    }

    setIsSubmittingComment(true);
    setCommentSubmitError(null);

    try {
      const response = await commentService.createComment(id, {
        content: newCommentText.trim(),
        name: newCommentName.trim() || undefined,
      });

      const createdComment = mapApiCommentToLoaded(response.data);
      setComments((prev) =>
        sortComments([createdComment, ...prev], commentsSortBy)
      );
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

  const authorNames =
    article.authors?.map((author) => {
      const authorUser = author.user;
      if (!authorUser) return null;
      if (typeof authorUser === "string") return authorUser;
      const composedName = [authorUser.firstName, authorUser.lastName].filter(Boolean).join(" ");
      return composedName || authorUser.username || authorUser.email || null;
    }).filter((name): name is string => Boolean(name)) || [];

  const authorsDisplay = authorNames.length ? authorNames.join(" • ") : "Technique Staff";

  const publishedDate =
    article.publishedAt &&
    new Date(article.publishedAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const tagsDisplay = article.tags?.map((tag) => tag.name).filter(Boolean).join(" • ");

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
              {article.categories?.length > 0 &&
                article.categories
                  .filter((cat) => !!cat?.name)
                  .map((cat, idx) => (
                    <span key={cat._id || cat.name}>
                      {idx > 0 && " • "}
                      {cat.name}
                    </span>
              ))}
          </h4>
          {tagsDisplay && <p className="text-xs text-nique-blue">{tagsDisplay}</p>}
          <hr className="opacity-50" />
        </header>

        {/* Featured Image */}
        {article.featuredImage && (
          <figure className="my-3 max-w-3xl w-full mx-auto text-sm">
            <img
              className="w-full aspect-3/2 object-cover rounded-md"
              src={article.featuredImage.url}
              alt={article.featuredImage.altText || article.title}
            />
            {(article.featuredImage.title || article.featuredImage.caption) && (
              <figcaption className="w-full flex flex-col sm:flex-row sm:justify-between text-xs text-nique-blue mt-2 space-y-1 sm:space-y-0">
                <span>{article.featuredImage.title}</span>
                <span>{article.featuredImage.caption}</span>
              </figcaption>
            )}
          </figure>
        )}

        {/* Article Content */}
        <section className="prose prose-lg max-w-3xl mx-auto text-[#1A1E47] article-body">
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
              {relatedArticles.map((related, index) => (
                <ArticleBlock key={index} post={related} height="230px" />
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
                    name={com.author.name}
                    avatar={com.author.avatar}
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
