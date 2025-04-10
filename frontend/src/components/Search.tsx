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
                <button className="flex-shrink-0">
                    <FaSearch onClick={handleOpenSearch} className="text-blue-950 hover:text-blue-900" size='15'/>
                </button>
            ) : (
                <div className="flex items-center w-full">
                    <button className="flex-shrink-0 mr-2">
                        <FaTimes onClick={handleCloseSearch} className="text-blue-950 hover:text-blue-900" size='15'/>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={text}
                        className="flex-grow outline-none bg-transparent text-left w-full"
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search Article"
                    />
                    <button className="flex-shrink-0 ml-2">
                        <FaSearch onClick={handleSearch} className="text-blue-950 hover:text-blue-900" size='15'/>
                    </button>
                </div>
            )}
        </div>
    )
}

export default Search