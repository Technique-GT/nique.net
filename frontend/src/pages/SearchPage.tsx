import { useEffect, useState, useRef } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const SearchPage = () => {
  const [text, setText] = useState("");
  const [searchedText, setSearchedText] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (text.trim()) {
      navigate(`/search?query=${encodeURIComponent(text)}`);
      setText("");
    }
  };

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryText = queryParams.get("query") || "No search term";

  useEffect(() => {
    setSearchedText(queryText);
  }, [queryText]);

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between border border-gray-300 rounded-full p-3 bg-white">
          <input
            type="text"
            value={text}
            className="flex-grow mx-2 outline-none bg-transparent text-2xl"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    handleSearch()
                }
            }}
            placeholder="Search Article"
          />
          <button>
            <FaSearch
              onClick={handleSearch}
              className="text-blue-950 hover:text-blue-900"
              size="30"
            />
          </button>
        </div>
        <div className="font-bold py-5 text-4xl text-center">
          Search results for{" "}
          <span className="text-blue-900">{searchedText.toUpperCase()}</span>
        </div>
      </div>
    </>
  );
};

export default SearchPage;
