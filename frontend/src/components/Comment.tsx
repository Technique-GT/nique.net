import { ThumbsUp, ThumbsDown, Reply } from "lucide-react";
import { useEffect, useState } from "react";
import commentService from "../services/commentService";

/**
 * Comment component props aligned with backend Comment shape.
 * Uses `username` instead of `author.name/avatar`.
 */
interface CommentData {
  commentId: string;
  username: string;
  createdAt: string;
  thumbsUp: number;
  thumbsDown: number;
  myReaction?: "up" | "down" | null;
  content: string;
  replies?: CommentData[];
}

interface CommentProps extends CommentData {
  depth?: number;
  articleId: string;
  onReplySubmitted?: () => void;
}

// Default avatar placeholder (simple user icon via data URI)
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z'/%3E%3C/svg%3E";

const Comment = (data: CommentProps) => {
  const [dateText, setDateText] = useState<string>("");
  const [thumbsUp, setThumbsUp] = useState<number>(data.thumbsUp);
  const [thumbsDown, setThumbsDown] = useState<number>(data.thumbsDown);
  const [reactionInFlight, setReactionInFlight] = useState<"up" | "down" | null>(null);
  const [reaction, setReaction] = useState<"up" | "down" | null>(data.myReaction ?? null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyName, setReplyName] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(data.createdAt).getTime()) / 1000
    );

    let interval = seconds / 31536000;
    if (interval > 1) {
      const suffix = Math.floor(interval) === 1 ? " year ago" : " years ago";
      setDateText(Math.floor(interval) + suffix);
      return;
    }

    interval = seconds / 2592000;
    if (interval > 1) {
      const suffix = Math.floor(interval) === 1 ? " month ago" : " months ago";
      setDateText(Math.floor(interval) + suffix);
      return;
    }

    interval = seconds / 86400;
    if (interval > 1) {
      const suffix = Math.floor(interval) === 1 ? " day ago" : " days ago";
      setDateText(Math.floor(interval) + suffix);
      return;
    }

    interval = seconds / 3600;
    if (interval > 1) {
      const suffix = Math.floor(interval) === 1 ? " hour ago" : " hours ago";
      setDateText(Math.floor(interval) + suffix);
      return;
    }

    interval = seconds / 60;
    if (interval > 1) {
      const suffix = Math.floor(interval) === 1 ? " minute ago" : " minutes ago";
      setDateText(Math.floor(interval) + suffix);
      return;
    }

    const suffix = Math.floor(seconds) === 1 ? " second ago" : " seconds ago";
    setDateText(Math.floor(seconds) + suffix);
  }, [data.createdAt]);

  useEffect(() => {
    setThumbsUp(data.thumbsUp);
    setThumbsDown(data.thumbsDown);
    setReaction(data.myReaction ?? null);
  }, [data.thumbsUp, data.thumbsDown, data.myReaction]);

  const handleThumbsUp = async () => {
    if (reactionInFlight) return;
    const prevReaction = reaction;
    const prevUp = thumbsUp;
    const prevDown = thumbsDown;

    setReactionInFlight("up");
    if (prevReaction === "up") {
      setReaction(null);
      setThumbsUp((prev) => Math.max(0, prev - 1));
    } else {
      setReaction("up");
      if (prevReaction === "down") {
        setThumbsUp((prev) => prev + 1);
        setThumbsDown((prev) => Math.max(0, prev - 1));
      } else {
        setThumbsUp((prev) => prev + 1);
      }
    }
    try {
      const nextReaction = prevReaction === "up" ? null : "up";
      const updated = await commentService.setCommentReaction(data.commentId, nextReaction);
      if (typeof updated?.thumbsUp === "number") setThumbsUp(updated.thumbsUp);
      if (typeof updated?.thumbsDown === "number") setThumbsDown(updated.thumbsDown);
      if (updated?.myReaction === "up" || updated?.myReaction === "down" || updated?.myReaction === null) {
        setReaction(updated.myReaction ?? null);
      }
    } catch {
      setReaction(prevReaction);
      setThumbsUp(prevUp);
      setThumbsDown(prevDown);
    } finally {
      setReactionInFlight(null);
    }
  };

  const handleThumbsDown = async () => {
    if (reactionInFlight) return;
    const prevReaction = reaction;
    const prevUp = thumbsUp;
    const prevDown = thumbsDown;

    setReactionInFlight("down");
    if (prevReaction === "down") {
      setReaction(null);
      setThumbsDown((prev) => Math.max(0, prev - 1));
    } else {
      setReaction("down");
      if (prevReaction === "up") {
        setThumbsUp((prev) => Math.max(0, prev - 1));
        setThumbsDown((prev) => prev + 1);
      } else {
        setThumbsDown((prev) => prev + 1);
      }
    }
    try {
      const nextReaction = prevReaction === "down" ? null : "down";
      const updated = await commentService.setCommentReaction(data.commentId, nextReaction);
      if (typeof updated?.thumbsUp === "number") setThumbsUp(updated.thumbsUp);
      if (typeof updated?.thumbsDown === "number") setThumbsDown(updated.thumbsDown);
      if (updated?.myReaction === "up" || updated?.myReaction === "down" || updated?.myReaction === null) {
        setReaction(updated.myReaction ?? null);
      }
    } catch {
      setReaction(prevReaction);
      setThumbsUp(prevUp);
      setThumbsDown(prevDown);
    } finally {
      setReactionInFlight(null);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      setReplyError("Reply cannot be empty.");
      return;
    }

    setReplySubmitting(true);
    setReplyError(null);
    try {
      await commentService.createComment(data.articleId, {
        content: replyText.trim(),
        username: replyName.trim() || "Anonymous",
        parentCommentId: data.commentId,
      });
      setReplyText("");
      setReplyName("");
      setShowReplyForm(false);
      data.onReplySubmitted?.();
    } catch {
      setReplyError("Unable to submit reply. Please try again.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const depth = data.depth ?? 0;
  const indentClass = depth > 0 ? "pl-3 border-l border-gray-200" : "";

  return (
    <div className={`flex gap-4 ${indentClass}`}>
      <img
        src={DEFAULT_AVATAR}
        alt={`${data.username}'s avatar`}
        className="border border-gray-300 size-12 rounded-full bg-gray-100"
      />
      <div className="flex-auto flex flex-col gap-3">
        <div className="flex items-center gap-6">
          <div>
            <p>
              <b>{data.username}</b>
            </p>
            <p className="text-xs text-nique-blue mt-auto">{dateText}</p>
          </div>
        </div>
        <p className="whitespace-pre-wrap break-words">{data.content}</p>
        <div className="flex gap-4 text-sm justify-end text-nique-blue">
          <button
            className="flex items-center gap-1 hover:bg-gray-100 rounded-md px-2 py-1"
            onClick={() => setShowReplyForm((prev) => !prev)}
          >
            <Reply size={16} />
          </button>
          <button
            className={`flex items-center gap-1 rounded-md px-2 py-1 disabled:opacity-60 ${
              reaction === "up" ? "bg-nique-blue/5 text-nique-blue font-bold" : "hover:bg-gray-100"
            }`}
            onClick={handleThumbsUp}
            disabled={reactionInFlight !== null}
            aria-pressed={reaction === "up"}
          >
            <ThumbsUp size={16} strokeWidth={reaction === "up" ? 2.5 : 2} />
            <span>{thumbsUp}</span>
          </button>
          <button
            className={`flex items-center gap-1 rounded-md px-2 py-1 disabled:opacity-60 ${
              reaction === "down" ? "bg-nique-blue/5 text-nique-blue font-bold" : "hover:bg-gray-100"
            }`}
            onClick={handleThumbsDown}
            disabled={reactionInFlight !== null}
            aria-pressed={reaction === "down"}
          >
            <ThumbsDown size={16} strokeWidth={reaction === "down" ? 2.5 : 2} />
            <span>{thumbsDown}</span>
          </button>
        </div>
        {showReplyForm && (
          <div className="mt-2 space-y-2">
            <input
              value={replyName}
              onChange={(event) => setReplyName(event.target.value)}
              placeholder="Name"
              className="w-full border border-nique-blue/40 rounded-md px-3 py-2 text-sm"
            />
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder="Write a reply..."
              className="w-full border border-nique-blue/40 rounded-md px-3 py-2 text-sm"
              rows={3}
            />
            {replyError && <p className="text-sm text-red-600">{replyError}</p>}
            <div className="flex justify-end">
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim() || replySubmitting}
                className="px-3 py-1.5 bg-nique-blue text-white rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {replySubmitting ? "Submitting..." : "Reply"}
              </button>
            </div>
          </div>
        )}
        {data.replies && data.replies.length > 0 && (
          <div>
            {data.replies.map((reply) => (
              <Comment
                key={reply.commentId}
                {...reply}
                depth={depth + 1}
                articleId={data.articleId}
                onReplySubmitted={data.onReplySubmitted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
