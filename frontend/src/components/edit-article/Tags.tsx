import { useState } from "react";
import { MdOutlineClose } from "react-icons/md";

export default function Tags() {
    const [inputValue, setInputValue] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const handleRemoveTag = (tag: string) => {
        setSelectedTags((prev) => prev.filter((item) => item !== tag));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim() !== "") {
            e.preventDefault();
            if (!selectedTags.includes(inputValue.trim())) {
                setSelectedTags((prev) => [...prev, inputValue.trim()]);
            }
            setInputValue("");
        }
    };

    return (
        <div className="section p-4">
            <h2 className="font-bold mt-0 mb-2">Tags</h2>
            <div className="flex flex-col w-full">
                <div className="w-full relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Add tag..."
                    />
                </div>

                {/* Selected tags */}
                <div className="flex flex-wrap mt-3 gap-2">
                    {selectedTags.map((tag) => (
                        <div
                            key={tag}
                            className="px-3 text-sm py-1 flex items-center bg-nique-blue text-white rounded-full cursor-pointer hover:bg-nique-blue-hover"
                            onClick={() => handleRemoveTag(tag)}
                        >
                            <MdOutlineClose className="mr-2" /> {tag}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}