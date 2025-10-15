import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ArticleBlock from "../components/ArticleBlock";
import Comment from "../components/Comment";
import Spinner from "../components/Spinner";
import { FaRegThumbsDown, FaRegThumbsUp } from "react-icons/fa";
import articleService from "../services/articleService";
import { ArticleDocument, Post } from "../types/article";

interface LoadedComment {
  _id: string;
  author?: {
    name?: string;
    avatar?: string;
  };
  createdAt: string;
  content: string;
  thumbsUp?: number;
  thumbsDown?: number;
}

const mapArticleToPost = (article: ArticleDocument): Post => {
  const descriptionSource = article.excerpt || article.content || "";
  const normalizedDescription =
    typeof descriptionSource === "string"
      ? descriptionSource.replace(/<[^>]*>/g, "").slice(0, 220)
      : "";

  const primaryAuthor = article.authors?.[0];
  const authorUser = primaryAuthor?.user as ArticleDocument["authors"][number]["user"];

  let authorName = "Technique Staff";
  if (typeof authorUser === "string") {
    authorName = authorUser;
  } else if (authorUser) {
    const composedName = [authorUser.firstName, authorUser.lastName]
      .filter(Boolean)
      .join(" ");
    authorName = authorUser.username || composedName || authorUser.email || authorName;
  }

  return {
    id: article._id,
    title: article.title || "",
    slug: article.slug,
    content: article.content,
    excerpt: article.excerpt,
    authors: article.authors || [],
    categories: article.categories || [],
    tags: article.tags || [],
    featuredImage: article.featuredImage,
    status: article.status,
    isSticky: article.isSticky ?? false,
    allowComments: article.allowComments ?? true,
    viewCount: article.viewCount ?? 0,
    publishedAt: article.publishedAt,
    updatedBy: article.updatedBy,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    desc: normalizedDescription,
    author: authorName,
    category: article.categories?.[0]?.name || "",
  };
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
          const relatedResponse = await articleService.fetchArticlesByCategory(
            categoryId,
            4,
            controller.signal
          );

          const mappedRelated = (relatedResponse.data as ArticleDocument[])
            .filter((item) => item._id !== fetchedArticle._id)
            .map(mapArticleToPost);

          setRelatedArticles(mappedRelated);
        } else {
          setRelatedArticles([]);
        }

        if (fetchedArticle.allowComments) {
          try {
            const commentsResponse = await articleService.fetchArticleComments(
              id,
              controller.signal
            );
            setComments(commentsResponse.data || []);
          } catch {
            setComments([]);
          }
        } else {
          setComments([]);
        }
      } catch (err) {
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

  useMemo(() => {
    setNumCommentsToView(5);
    if (!comments?.length) return;

    switch (commentsSortBy) {
      case "Oldest":
        setComments((prev) =>
          [...prev].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        );
        break;
      case "Newest":
        setComments((prev) =>
          [...prev].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        break;
      default:
        setComments((prev) =>
          [...prev].sort((a, b) => (b.thumbsUp || 0) - (a.thumbsUp || 0))
        );
    }
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

  const primaryAuthorUser = article.authors?.[0]?.user;
  const primaryAuthor =
    typeof primaryAuthorUser === "string"
      ? primaryAuthorUser
      : [primaryAuthorUser?.firstName, primaryAuthorUser?.lastName]
          .filter(Boolean)
          .join(" ") ||
        primaryAuthorUser?.username ||
        "Technique Staff";

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
              <span>{primaryAuthor}</span>
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
        <figure className="my-3 max-w-3xl w-full mx-auto text-sm">
          <img
            className="w-full aspect-3/2 object-cover rounded-md"
            src={article.featuredImage.url || "https://picsum.photos/900/600"}
            alt={article.featuredImage.altText || article.title || "Article featured"}
          />
          {(article.featuredImage.title || article.featuredImage.caption) && (
            <figcaption className="w-full flex flex-col sm:flex-row sm:justify-between text-xs text-nique-blue mt-2 space-y-1 sm:space-y-0">
              <span>{article.featuredImage.title}</span>
              <span>{article.featuredImage.caption}</span>
            </figcaption>
          )}
        </figure>

        {/* Article Content */}
        <section className="prose prose-lg max-w-3xl mx-auto text-[#1A1E47]">
          {typeof article.content === "string" ? (
            <p>{ article.content }</p>
          ) : (
            <p>{article.excerpt}</p>
          )}
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-nique-blue">Related Articles</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {relatedArticles.map((related) => (
                <ArticleBlock key={related.id} post={related} height="230px" />
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
                {comments.slice(0, numCommentsToView).map((comment) => (
                  <Comment
                    key={comment._id}
                    name={comment.author?.name || "Reader"}
                    imageURL={
                      comment.author?.avatar || "https://picsum.photos/seed/comment/80"
                    }
                    comment={comment.content}
                    createdAt={new Date(comment.createdAt).toLocaleString()}
                    thumbsDown={comment.thumbsDown ?? 0}
                    thumbsUp={comment.thumbsUp ?? 0}
                    iconUp={<FaRegThumbsUp />}
                    iconDown={<FaRegThumbsDown />}
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
                <button className="px-4 py-2 bg-nique-blue text-white rounded-md">
                  Submit
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
