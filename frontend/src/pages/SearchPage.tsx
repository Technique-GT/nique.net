import { useState } from 'react'
import { FaSearch, FaTimes } from 'react-icons/fa'

const SearchPage = () => {

    const [text, setText] = useState('')

  return (
    <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between border border-gray-300 rounded-full p-2 bg-white">
            <button><FaTimes className="text-blue-950 hover:text-blue-900" size='15'/></button>
            <input
            type="text"
            value={text}
            className="flex-grow mx-2 outline-none bg-transparent"
            onChange={(e) => setText(e.target.value)}
            placeholder="Search Article"
            />
            <button><FaSearch className="text-blue-950 hover:text-blue-900" size='20'/></button>
        </div>
        Searching results for
    </div>
  )
}

export default SearchPage
