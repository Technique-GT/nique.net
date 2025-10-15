import { useEffect, useState } from "react";
import {
  RiThumbUpLine,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbDownFill,
} from "react-icons/ri";

interface CommentProps {
  imageURL: string;
  name: string;
  createdAt: string;
  thumbsUp: number;
  thumbsDown: number;
  content: string;
}

const Comment = (data: CommentProps) => {
  type Vote = "thumbs up" | "thumbs down" | "none";
  const [vote, setVote] = useState<Vote>("none");
  const [dateText, setDateText] = useState<string>("");

  useEffect(() => {
    // const temp = new Date(data.createdAt);
    var seconds = Math.floor(
      (new Date().getTime() - new Date(data.createdAt).getTime()) / 1000
    );

    var interval = seconds / 31536000;

    if (interval > 1) {
      const temp = Math.floor(interval) == 1 ? " year ago" : " years ago";
      setDateText(Math.floor(interval) + temp);
      return;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      const temp = Math.floor(interval) == 1 ? " month ago" : " months ago";
      setDateText(Math.floor(interval) + temp);
      return;
    }
    interval = seconds / 86400;
    if (interval > 1) {
      const temp = Math.floor(interval) == 1 ? " day ago" : " days ago";
      setDateText(Math.floor(interval) + temp);
      return;
    }
    interval = seconds / 3600;
    if (interval > 1) {
      const temp = Math.floor(interval) == 1 ? " hour ago" : " hours ago";
      setDateText(Math.floor(interval) + temp);
      return;
    }
    interval = seconds / 60;
    if (interval > 1) {
      const temp = Math.floor(interval) == 1 ? " minute ago" : " minutes ago";
      setDateText(Math.floor(interval) + temp);
      return;
    }
    const temp = Math.floor(interval) == 1 ? " second ago" : " seconds ago";
    setDateText(Math.floor(seconds) + temp);
  }, []);

  return (
    <div className="flex gap-4 mb-5">
      <img src={data.imageURL} className="border border-gray-300 max-w-16 max-h-16 min-w-16 min-h-16 rounded-lg" />
      <div className="flex-auto flex flex-col gap-3">
        <div className="flex items-center gap-6">
          <div>
            <p>
              <b>{data.name}</b>
            </p>
            <p className="text-xs text-nique-blue mt-auto">{dateText}</p>
          </div>
          <div className="flex items-center gap-0.5">
            {vote == "thumbs up" ? (
              <RiThumbUpFill
                size={24}
                className="hover:text-nique-blue-hover cursor-pointer"
                onClick={() => setVote("none")}
              />
            ) : (
              <RiThumbUpLine
                size={24}
                className="hover:text-nique-blue-hover cursor-pointer"
                onClick={() => setVote("thumbs up")}
              />
            )}
            <p>{data.thumbsUp}</p>
          </div>
          <div className="flex items-center gap-0.5">
            {vote == "thumbs down" ? (
              <RiThumbDownFill
                size={24}
                className="hover:text-nique-blue-hover cursor-pointer"
                onClick={() => setVote("none")}
              />
            ) : (
              <RiThumbDownLine
                size={24}
                className="hover:text-nique-blue-hover cursor-pointer"
                onClick={() => setVote("thumbs down")}
              />
            )}
            <p>{data.thumbsDown}</p>
          </div>
        </div>
        <p>{data.content}</p>
      </div>
    </div>
  );
};

export default Comment;
