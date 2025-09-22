import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ArticleBlock from "../components/ArticleBlock";
import { Post } from "../types/article";
import MockAPI from "../services/MockAPI";
import Spinner from "../components/Spinner";
import { FaRegThumbsUp, FaRegThumbsDown } from "react-icons/fa";
import Comment from "../components/Comment";

export default function Article() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [post, setPost] = useState<Post[]>([]);

  const { id } = useParams();
  const navigate = useNavigate();

  const [comments, setComments] = useState<
    {
      imageURL: string;
      name: string;
      createdAt: string;
      thumbsUp: number;
      thumbsDown: number;
      content: string;
    }[]
  >();
  const [numCommentsToView, setNumCommentsToView] = useState<number>(5);
  const [commentsSortBy, setCommentsSort] = useState<
    "Best" | "Newest" | "Oldest"
  >("Best");
  const updateCommentsSort = () => {
    switch (commentsSortBy) {
      case "Best":
        setCommentsSort("Newest");
        break;
      case "Newest":
        setCommentsSort("Oldest");
        break;
      default:
        setCommentsSort("Best");
    }
  };

  const [newCommentName, setNewCommentName] = useState<string>("");
  const [newCommentText, setNewCommentText] = useState<string>("");

  useEffect(() => {
    getPost();
    getComments();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useMemo(() => {
    setNumCommentsToView(5);
    if (comments !== undefined) {
      switch (commentsSortBy) {
        case "Oldest":
          setComments(
            [...comments].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            )
          );
          break;
        case "Newest":
          setComments(
            [...comments].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
          );
          break;
        default:
          setComments([...comments].sort((a, b) => b.thumbsUp - a.thumbsUp));
      }
    }
  }, [commentsSortBy]);

  const getPost = () => {
    MockAPI.getPost.then((resp) => {
      const result = resp.data.slice(0, 25).map((item: any) => ({
        id: item.id,
        title: item.title,
        desc: item.summary,
        author: item.user.first_name + " " + item.user.last_name,
        category: item.category,
        coverImage: item.featured_image,
      }));
      setPost(result);
      setIsLoading(false);
    });
  };

  const getComments = () => {
    MockAPI.getPost.then((resp) => {
      setComments(
        resp.data.slice(1, 25).map((item: any) => {
          return {
            imageURL: item.featured_image,
            name: item.user.first_name + " " + item.user.last_name,
            createdAt: new Date(
              new Date().getTime() - Math.floor(Math.random() * 1000000)
            ).toString(),
            thumbsUp: Math.floor(Math.random() * 1000),
            thumbsDown: Math.floor(Math.random() * 1000),
            content: item.subtitle,
          };
        })
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-2">
        <h3 className="text-4xl font-bold mt-2 mb-1">{post[0].title}</h3>
        <div className="flex flex-wrap mb-2 gap-x-4">
          <h4 className="flex-auto text-lg text-nique-blue">
            {post[0].author} • November 27, 2024 • {post[0].category}
          </h4>
          <p className="text-xs text-nique-blue mt-auto">tag1 • tag2 • tag3</p>
        </div>
        <hr className="opacity-50" />
        <div className="my-3 max-w-3xl w-full m-auto text-sm">
          <img
            className="w-full aspect-3/2 object-cover"
            src="https://picsum.photos/900/600"
          />
          <div className="w-full flex justify-between text-xs text-nique-blue">
            <h4>bbno$ looking out into the crowd at McCamish Pavilion</h4>
            <h4>Photo by: Samuel Loung, Student Publications</h4>
          </div>
          <p>
            bbno$ took the stage at McCamish Pavilion on Tuesday, Nov. 19,
            during an annual event hosted by SCPC. Unfortunately, the crowd was
            much smaller than in previous years, but SCPC hopes rebranding as
            the Fall Concert will benefit the event in years to come.
          </p>
        </div>
        <p>
          Homecoming brings the Institute alive. With students full of energy
          and excitement for the many activities throughout the week and
          hundreds of alumni returning, it is one of the most eventful times on
          campus. This year, the Institute had a successful Homecoming week with
          the Student Center Programs Council (SCPC), bringing back many of the
          beloved traditions that are integral to the Institute, but many
          students felt something was missing from the event lineup: the annual
          Homecoming Concert.
        </p>
        <p>
          The annual concert traditionally happens the week before Homecoming,
          building up student excitement and energy for the upcoming Homecoming
          events. However, this year, SCPC took a different approach, placing
          the concert after homecoming and waiting until later to announce the
          concert date and attending artists publicly.
        </p>
        <p>
          The lack of noise from SCPC led many students to ask what was
          happening with the concert, but it went ahead on Nov. 19, headlined by
          bbno$, a rap artist people may know from his songs that have gone
          viral on TikTok, like ‘Lockjaw’ and ‘Lalala.’’
        </p>
        <p>
          Like most concerts, SCPC had opening acts DJ HUY and Tiny Music Man,
          two current students at the Institute, to warm the crowd.
        </p>
        <p>
          The whole event was planned by Riddhi Bhattacharya, fourth-year CHEME,
          the concert chair of SCPC.
        </p>
        <p>
          “I think it was just feasibility and what worked best with our team,
          the artist team, the venue, all of that put together,” Bhattacharya
          said. “I think over the last three years, we’re kind of drifting away
          from the Homecoming concert concept that we’ve kind of stuck to the
          years before that.”
        </p>
        <p>
          Instead of a Homecoming concert, SCPC rebranded the event as the Fall
          Concert and plans on keeping the new name in future years.
        </p>
        <p>
          “Now we’re approaching it with a more open mindset than any time in
          the fall, irrespective of Homecoming,” Bhattacharya said. “I think
          that we’re just trying to keep our calendars open, trying to see what
          works best for the artist we want most, and then figuring it out,
          rather than picking a date and then seeing which artist works best
          with that date.”
        </p>
        <p>
          The selection of the student openers was a long process. “Students can
          submit an audition file to the SCPC’s student open audition that
          happens around early fall every summer, every year. And then from
          there on, they kind of get chosen based upon energy song choices, the
          songs that they perform, the overall talent,” Bhattacharya said.
        </p>
        <p>
          Whether the new time frame and artist selection were effective or not
          is an open question. There was a significant decline in attendance at
          this event than in previous years.
        </p>
        <p>
          Despite SCPC offering free tickets to all students, McCamish Pavilion
          was mostly empty. The exclusivity of the VIP Floor Tickets, offered to
          the first 250 students to arrive, lost all meaning after security
          asked all students in attendance to come down the pit. The floor was
          not even 75 percent filled, giving attendees ample room to move around
          and dance.
        </p>
        <p>
          Part of the lack of attendance may be attributed to the headlining
          artist, bbno$. Bbno$ sports an impressive 9 million monthly listeners
          on Spotify; however, this is ten million less than NLE Choppa, last
          year’s headliner who packed out the basketball arena.
        </p>
        <div className="my-3 max-w-2xl w-full m-auto text-sm">
          <img
            className="w-full aspect-3/2 object-cover"
            src="https://picsum.photos/900/600"
          />
          <div className="w-full flex justify-between text-xs text-nique-blue">
            <h4>bbno$ and Buzz show off their musical talent together.</h4>
            <h4>Photo by: Samuel Loung, Student Publications</h4>
          </div>
        </div>
        <p>
          Additionally, SCPC did not promote the concert as much as they did in
          years past. SCPC announced the concert via Instagram just one day
          before it took place. Hype and publicity for the event were limited to
          social media, with no time for word-of-mouth communication. For last
          year’s performance by NLE Choppa, SCPC first made a post about the
          event four days before it took place, giving students time to talk
          with friends and build up excitement around the concert.
        </p>
        <p>
          The quality of the actual concert SCPC put on cannot be denied. Though
          attendance was slim, the students who did attend had a unique concert
          experience. Due to the small crowd, all the performers could have a
          real connection with the crowd, and the venue was filled with intimacy
          and togetherness.
        </p>
        <p>Maya Zhang, Ph.D. BME came to the concert just for bbno$.</p>
        <p>
          “My friends in college introduced me to him. My friends saw him live,
          and I wanted to see him live. He’s supposed to have a concert in
          February, and I was gonna buy tickets, but I found out about this, and
          this is free, so it’s even better,” Zhang said.
        </p>
        <p>
          Zhang, similar to many attendees, found out about the concert at the
          very last minute. “I found out this morning on Instagram. I was
          scrolling in bed,” Zhang said.
        </p>
        <p>
          The lack of attendance was unfortunate. SCPC organized spectacular
          student and outside artist performances, but there was no massive
          crowd to match the energy.
        </p>
        <hr className="mt-5 mb-3" />
        <div className="flex items-center gap-1">
          <h4 className="flex-auto font-bold text-nique-blue text-xl">
            Comments
          </h4>
          <p
            className="cursor-pointer select-none"
            onClick={updateCommentsSort}
          >
            Sort by <b>{commentsSortBy}</b>
          </p>
        </div>
        {comments?.slice(0, numCommentsToView).map((comment) => {
          return (
            <Comment
              key={comment.imageURL}
              imageURL={comment.imageURL}
              name={comment.name}
              createdAt={comment.createdAt}
              thumbsUp={comment.thumbsUp}
              thumbsDown={comment.thumbsDown}
              content={comment.content}
            />
          );
        })}
        {comments !== undefined && numCommentsToView < comments.length ? 
        <div
          className={"bg-nique-blue mx-auto max-w-60 text-center hover:bg-nique-blue-hover cursor-pointer text-white rounded-sm px-4 py-1"}
          onClick={() => {
            setNumCommentsToView(Math.min(numCommentsToView + 5, comments.length));
          }}
        >
          <h4 className="text-sm">Load More Comments</h4>
        </div> : null}
        <div className="mb-8" />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <p>Leave a comment as </p>
            <input
              className="flex-auto items-center border border-gray-300 p-2 bg-transparent h-8"
              placeholder="your name"
              maxLength={50}
              value={newCommentName}
              onChange={(e) => {
                setNewCommentName(e.target.value);
              }}
            />
          </div>
          <div className="flex flex-col min-h-24 border border-gray-300">
            <textarea
              className="flex-auto p-2 bg-transparent min-h-24 text-wrap resize-none"
              placeholder="Leave your comment here..."
              maxLength={500}
              value={newCommentText}
              onChange={(e) => {
                setNewCommentText(e.target.value);
              }}
            />
          </div>
          <div className="flex">
            <p className="text-nique-blue">{500 - newCommentText.length}</p>
            <div className="flex-auto" />
            <div
              className={`${
                newCommentName.length == 0 || newCommentText.length == 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-nique-blue hover:bg-nique-blue-hover cursor-pointer"
              } text-white rounded-sm px-4 py-1`}
              onClick={() => {
                if (
                  !(newCommentName.length == 0 || newCommentText.length == 0)
                ) {
                  alert("comment has been made!");
                }
              }}
            >
              <h4 className="text-sm">Submit Comment</h4>
            </div>
          </div>
        </div>
        {/* <div className="border-1 border-nique-">
                    <textarea maxLength={500} className='h-[60px] w-full border-solid border-1 border-nique-blue rounded-md p-2'></textarea>
                </div> */}
        <hr className="mt-5 mb-3" />
        <h4 className="font-bold text-nique-blue text-xl">
          Recommended Stories
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          <ArticleBlock post={post[1]} height="240px" />
          <ArticleBlock post={post[2]} height="240px" />
          <ArticleBlock post={post[3]} height="240px" />
          <ArticleBlock post={post[4]} height="240px" />
        </div>
      </div>
    </>
  );
}
