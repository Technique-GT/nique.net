import { useEffect, useState } from "react";

/**
 * Comment component props aligned with backend Comment shape.
 * Uses `username` instead of `author.name/avatar`.
 */
interface CommentProps {
  commentId: string;
  username: string;
  createdAt: string;
  thumbsUp: number;
  thumbsDown: number;
  content: string;
}

// Default avatar placeholder (simple user icon via data URI)
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z'/%3E%3C/svg%3E";

const Comment = (data: CommentProps) => {
  const [dateText, setDateText] = useState<string>("");

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

  return (
    <div className="flex gap-4 mb-5">
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
        <p>{data.content}</p>
      </div>
    </div>
  );
};

export default Comment;
