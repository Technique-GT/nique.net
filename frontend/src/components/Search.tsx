import { useState, useRef, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface SearchProps {
    searchOn?: boolean;
}

function Search({ searchOn = false }: SearchProps) {

    const [text, setText] = useState('')
    const [isSearchOn, setIsSearchOn] = useState(searchOn) 
    const navigate = useNavigate()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isSearchOn && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isSearchOn])

    const handleOpenSearch = () => {
        setIsSearchOn(true)
    }

    const handleCloseSearch = () => {
        setIsSearchOn(false)
        setText("")
    }

    const handleSearch = () => {
        if (text.trim()) {
            navigate(`/search?query=${encodeURIComponent(text)}`)
            setIsSearchOn(false)
            setText("")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="flex items-center border border-gray-300 rounded-full p-2 bg-transparent h-8">
            {!isSearchOn ? (
                <button className="shrink-0" onClick={handleOpenSearch} aria-label="Open search">
                    <FaSearch className="text-blue-950 hover:text-blue-900" size='15'/>
                </button>
            ) : (
                <div className="flex items-center w-full">
                    <button className="shrink-0 mr-2" onClick={handleCloseSearch} aria-label="Close search">
                        <FaTimes className="text-blue-950 hover:text-blue-900" size='15'/>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={text}
                        className="grow outline-none bg-transparent text-left w-full"
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search articles"
                        aria-label="Search articles"
                    />
                    <button className="shrink-0 ml-2" onClick={handleSearch} aria-label="Submit search">
                        <FaSearch className="text-blue-950 hover:text-blue-900" size='15'/>
                    </button>
                </div>
            )}
        </div>
    )
}

export default Search
