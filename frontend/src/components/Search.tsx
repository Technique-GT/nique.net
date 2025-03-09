import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Search() {

    const [text, setText] = useState('')
    const [isSearchOn, setIsSearchOn] = useState(false) 
    const navigate = useNavigate()

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

    return (
        <div className="flex items-center justify-between border border-gray-300 rounded-full p-2 bg-white">
            {!isSearchOn && <button><FaSearch onClick={handleOpenSearch} className="text-blue-950 hover:text-blue-900" size='20'/></button>}
            {isSearchOn && <button><FaTimes onClick={handleCloseSearch} className="text-blue-950 hover:text-blue-900" size='15'/></button>}
            {isSearchOn && <div>
                <input
                type="text"
                value={text}
                className="flex-grow mx-2 outline-none bg-transparent"
                onChange={(e) => setText(e.target.value)}
                placeholder="Search Article"
            />
            {<button><FaSearch onClick={handleSearch} className="text-blue-950 hover:text-blue-900" size='20'/></button>}
            </div>}
            
        </div>
    )
}

export default Search