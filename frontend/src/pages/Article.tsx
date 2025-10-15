import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ArticleBlock from "../components/ArticleBlock";
import { Post } from "../types/article";
import MockAPI from "../services/MockAPI";
import Spinner from "../components/Spinner";
<<<<<<< Updated upstream
=======
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
    id: article.id,
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
>>>>>>> Stashed changes

export default function Article() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [post, setPost] = useState<Post[]>([]);

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        getPost();
    }, [])

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const getPost = () => {
        MockAPI.getPost.then(resp => {
            const result = resp.data.slice(0, 25).map((item: any) => ({
                id: item.id,
                title: item.title,
                desc: item.summary,
                author: item.user.first_name + " " + item.user.last_name,
                category: item.category,
                coverImage: item.featured_image
            }));
            setPost(result);
            setIsLoading(false);
        })
    }

<<<<<<< Updated upstream
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner/>
            </div>
=======
        if (categoryId) {
          const relatedResponse = await articleService.fetchArticlesByCategory(
            categoryId,
            4,
            controller.signal
          );

          const mappedRelated = (relatedResponse.data as ArticleDocument[])
            .filter((item) => item.id !== fetchedArticle.id)
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
>>>>>>> Stashed changes
        );
    }

    return (
        <>
            <Navbar />
            <div className="max-w-6xl mx-auto p-6 space-y-2">
                <h3 className="text-4xl font-bold mt-2 mb-1">{id}</h3>
                <h4 className="text-lg mb-2 text-nique-blue">Madison Winston • November 27, 2024 • Featured Story</h4>
                <hr className="opacity-50"/>
                <div className="my-3 max-w-3xl w-full m-auto text-sm">
                    <img className="w-full aspect-3/2 object-cover" src="https://picsum.photos/900/600" />
                    <div className="w-full flex justify-between text-xs text-nique-blue">
                        <h4>bbno$ looking out into the crowd at McCamish Pavilion</h4>
                        <h4>Photo by: Samuel Loung, Student Publications</h4>
                    </div>
                    <p>bbno$ took the stage at McCamish Pavilion on Tuesday, Nov. 19, during an annual event hosted by SCPC. Unfortunately, the crowd was much smaller than in previous years, but SCPC hopes rebranding as the Fall Concert will benefit the event in years to come.</p>
                </div>
                <p>Homecoming brings the Institute alive. With students full of energy and excitement for the many activities throughout the week and hundreds of alumni returning, it is one of the most eventful times on campus. This year, the Institute had a successful Homecoming week with the Student Center Programs Council (SCPC), bringing back many of the beloved traditions that are integral to the Institute, but many students felt something was missing from the event lineup: the annual Homecoming Concert.</p>
                <p>The annual concert traditionally happens the week before Homecoming, building up student excitement and energy for the upcoming Homecoming events. However, this year, SCPC took a different approach, placing the concert after homecoming and waiting until later to announce the concert date and attending artists publicly.</p>
                <p>The lack of noise from SCPC led many students to ask what was happening with the concert, but it went ahead on Nov. 19, headlined by bbno$, a rap artist people may know from his songs that have gone viral on TikTok, like ‘Lockjaw’ and ‘Lalala.’’</p>
                <p>Like most concerts, SCPC had opening acts DJ HUY and Tiny Music Man, two current students at the Institute, to warm the crowd.</p>
                <p>The whole event was planned by Riddhi Bhattacharya, fourth-year CHEME, the concert chair of SCPC.</p>
                <p>“I think it was just feasibility and what worked best with our team, the artist team, the venue, all of that put together,” Bhattacharya said. “I think over the last three years, we’re kind of drifting away from the Homecoming concert concept that we’ve kind of stuck to the years before that.”</p>
                <p>Instead of a Homecoming concert, SCPC rebranded the event as the Fall Concert and plans on keeping the new name in future years.</p>
                <p>“Now we’re approaching it with a more open mindset than any time in the fall, irrespective of Homecoming,” Bhattacharya said. “I think that we’re just trying to keep our calendars open, trying to see what works best for the artist we want most, and then figuring it out, rather than picking a date and then seeing which artist works best with that date.”</p>
                <p>The selection of the student openers was a long process. “Students can submit an audition file to the SCPC’s student open audition that happens around early fall every summer, every year. And then from there on, they kind of get chosen based upon energy song choices, the songs that they perform, the overall talent,” Bhattacharya said.</p>
                <p>Whether the new time frame and artist selection were effective or not is an open question. There was a significant decline in attendance at this event than in previous years.</p>
                <p>Despite SCPC offering free tickets to all students, McCamish Pavilion was mostly empty. The exclusivity of the VIP Floor Tickets, offered to the first 250 students to arrive, lost all meaning after security asked all students in attendance to come down the pit. The floor was not even 75 percent filled, giving attendees ample room to move around and dance.</p>
                <p>Part of the lack of attendance may be attributed to the headlining artist, bbno$. Bbno$ sports an impressive 9 million monthly listeners on Spotify; however, this is ten million less than NLE Choppa, last year’s headliner who packed out the basketball arena.</p>
                <div className="my-3 max-w-2xl w-full m-auto text-sm">
                    <img className="w-full aspect-3/2 object-cover" src="https://picsum.photos/900/600" />
                    <div className="w-full flex justify-between text-xs text-nique-blue">
                        <h4>bbno$ and Buzz show off their musical talent together.</h4>
                        <h4>Photo by: Samuel Loung, Student Publications</h4>
                    </div>
                </div>
                <p>Additionally, SCPC did not promote the concert as much as they did in years past. SCPC announced the concert via Instagram just one day before it took place. Hype and publicity for the event were limited to social media, with no time for word-of-mouth communication. For last year’s performance by NLE Choppa, SCPC first made a post about the event four days before it took place, giving students time to talk with friends and build up excitement around the concert.</p>
                <p>The quality of the actual concert SCPC put on cannot be denied. Though attendance was slim, the students who did attend had a unique concert experience. Due to the small crowd, all the performers could have a real connection with the crowd, and the venue was filled with intimacy and togetherness.</p>
                <p>Maya Zhang, Ph.D. BME came to the concert just for bbno$.</p>
                <p>“My friends in college introduced me to him. My friends saw him live, and I wanted to see him live. He’s supposed to have a concert in February, and I was gonna buy tickets, but I found out about this, and this is free, so it’s even better,” Zhang said.</p>
                <p>Zhang, similar to many attendees, found out about the concert at the very last minute. “I found out this morning on Instagram. I was scrolling in bed,” Zhang said.</p>
                <p>The lack of attendance was unfortunate. SCPC organized spectacular student and outside artist performances, but there was no massive crowd to match the energy.</p>
                <hr className="mt-5 mb-3" />
                <h4 className="font-bold text-nique-blue text-xl">Recommended Stories</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
                    <ArticleBlock post={post[1]} height='240px' />
                    <ArticleBlock post={post[2]} height='240px' />
                    <ArticleBlock post={post[3]} height='240px' />
                    <ArticleBlock post={post[4]} height='240px' />
                </div>
            </div>
<<<<<<< Updated upstream
        </>
    );
}
=======
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
                {comments.slice(0, numCommentsToView).map((com) => (
                  <Comment
                    key={com._id}
                    name={com.author?.name || "Reader"}
                    imageURL={
                      com.author?.avatar || "https://picsum.photos/seed/comment/80"
                    }
                    content={com.content}
                    createdAt={new Date(com.createdAt).toLocaleString()}
                    thumbsDown={com.thumbsDown ?? 0}
                    thumbsUp={com.thumbsUp ?? 0}
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
>>>>>>> Stashed changes
