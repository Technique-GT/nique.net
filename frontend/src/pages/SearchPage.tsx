import { useEffect, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import articleService from "../services/articleService";
import { Post } from "../types/article";
import { mapArticleToPost } from "../utils/articleMapping";

const buildPreview = (primary?: string | null, fallback?: string | null) => {
  const source = primary || fallback;
  if (!source) return "Read more...";
  const snippet = source.slice(0, 200);
  return snippet.length === 200 ? `${snippet}...` : snippet;
};

const SearchPage = () => {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const queryText = queryParams.get("query")?.trim() || "";

  useEffect(() => {
    setText(queryText);
  }, [queryText]);

  useEffect(() => {
    if (!queryText) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await articleService.searchArticles(
          queryText,
          undefined,
          controller.signal
        );

        if (!isMounted) {
          return;
        }

        setResults((response.data || []).map(mapArticleToPost));
      } catch (err: any) {
        if (!isMounted || controller.signal.aborted || err?.code === "ERR_CANCELED") {
          return;
        }
        setError("Unable to fetch search results. Please try again.");
        setResults([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [queryText]);

  const handleSearch = () => {
    if (text.trim()) {
      navigate(`/search?query=${encodeURIComponent(text)}`);
    }
  };

  const handleClearSearch = () => {
    setText("");
    navigate("/search");
  };

  const handleResultClick = (id: string) => {
    navigate(`/${id}`);
  };

  function formatTimeSincePublished(publishedAt?: string | Date) {
      if (!publishedAt) {
          return '';
      }

      const published = new Date(publishedAt);
      if (Number.isNaN(published.getTime())) {
          return '';
      }

      const diff = Date.now() - published.getTime();
      if (diff < 1000) {
          return 'just now';
      }

      const units = [
          { label: 'day', milliseconds: 24 * 60 * 60 * 1000 },
          { label: 'hour', milliseconds: 60 * 60 * 1000 },
          { label: 'minute', milliseconds: 60 * 1000 },
          { label: 'second', milliseconds: 1000 },
      ];

      for (const unit of units) {
          if (diff >= unit.milliseconds) {
              const value = Math.floor(diff / unit.milliseconds);
              const suffix = value === 1 ? unit.label : `${unit.label}s`;
              return `${value} ${suffix} ago`;
          }
      }

      return 'just now';
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="relative border border-gray-300 rounded-full p-3 bg-white">
          <input
            type="text"
            value={text}
            className="w-full pl-4 pr-20 outline-none bg-transparent text-2xl"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
              if (e.key === "Escape") handleClearSearch();
            }}
            placeholder="Search Article"
            aria-label="Search articles"
          />
          {text && (
            <button
              onClick={handleClearSearch}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-blue-950 hover:text-blue-900 mx-2"
              aria-label="Clear search"
            >
              <FaTimes size="24" />
            </button>
          )}
          <button
            onClick={handleSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-950 hover:text-blue-900"
            aria-label="Search"
          >
            <FaSearch size="24" />
          </button>
        </div>

        <div className="font-semibold py-5 text-4xl text-center">
          Search results for{" "}
          <span className="text-blue-900">{queryText}</span>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center text-red-600 text-lg py-10">
            {error}
          </div>
        )}

        {!isLoading && !error && queryText && results.length === 0 && (
          <div className="text-center text-lg text-gray-600 py-10">
            No results found for <span className="font-semibold">{queryText}</span>.
          </div>
        )}

        {!isLoading && !error && results.length > 0 && (
          <div className="flex flex-col gap-8">
            {results.map((post) => {
              const imageUrl = post.featuredImage?.url;
              return (
                <article
                  key={post.id}
                  className="flex flex-col w-full gap-4 border-b border-gray-200 pb-8 md:flex-row"
                >
                  <button
                    type="button"
                    onClick={() => handleResultClick(post.id)}
                    className="text-left flex flex-row gap-4 w-full"
                  >
                    {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={post.title}
                          className="size-48 object-cover rounded-xl transition-transform duration-200 hover:scale-105"
                          style={{
                            backgroundImage: `linear-gradient(to bottom, rgba(26, 30, 71, 0.15), rgba(26, 30, 71, 1) 75%), url(${post.featuredImage?.url})`,
                          }}
                        />
                    )}

                    <div className="flex flex-1 flex-col gap-3">
                        <h3 className="text-2xl font-bold text-blue-950 hover:underline">
                          {post.title}
                        </h3>

                      <div className="text-sm uppercase text-nique-blue">
                        {post.category}
                      </div>

                      <p className="text-base text-gray-700">
                        {buildPreview(post.desc, post.excerpt)}
                      </p>

                      <div className="text-sm text-gray-500">
                        By {post.author}
                      </div>

                      <div className="text-sm text-gray-500 text-right">
                        {formatTimeSincePublished(post.publishedAt)}
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchPage;
