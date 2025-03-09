import { useEffect, useState } from 'react'
import { FaSearch, FaTimes } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'

const SearchPage = () => {

    const [text, setText] = useState('')
    const [searchedText, setSearchedText] = useState('')
    const navigate = useNavigate()

    const handleSearch = () => {
        if (text.trim()) {
            navigate(`/search?query=${encodeURIComponent(text)}`)
            setText("")
        }
    }

    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const queryText = queryParams.get("query") || "No search term" 

    useEffect(() => {
        setSearchedText(queryText)
    }, [queryText])

  return (
    <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between border border-gray-300 rounded-full p-2 bg-white">
            <input
            type="text"
            value={text}
            className="flex-grow mx-2 outline-none bg-transparent"
            onChange={(e) => setText(e.target.value)}
            placeholder="Search Article"
            />
            <button><FaSearch onClick={handleSearch} className="text-blue-950 hover:text-blue-900" size='20'/></button>
        </div>
        <div className='font-bold py-3 text-2xl'>
            Searching results for <span className="text-blue-900">{searchedText}</span>
        </div>
    </div>
  )
}

export default SearchPage
