import { useState, useRef, useEffect } from "react";
import { MdOutlineClose } from "react-icons/md";

const authors = [
    "Abigail Liang",
    "America George",
    "Amelia Perez",
    "Amanda Carpenter",
    "Ava Edwards",
    "Benjamin Evans",
    "Charlotte Reed",
    "Charlotte Wright",
    "Christopher Scott",
    "Daniel Taylor",
    "David Miller",
    "Dylan Cook",
    "Ella Mitchell",
    "Emily Davis",
    "Emma Adams",
    "Ethan Hall",
    "Olivia Clark",
    "Grace King",
    "Henry Baker",
    "Jack Martin",
    "James Cooper",
    "James Johnson",
    "Jacob Robinson",
    "Jessica Moore",
    "John Smith",
    "Jack Morris",
    "Lily Walker",
    "Lucas Turner",
    "Matthew Harris",
    "Michael Brown",
    "Mia Carter",
    "Olivia Clark",
    "Samuel Young",
    "Sarah Wilson",
    "Sophia Allen",
    "Sophie Anderson",
    "William Lewis",
    "Xander Chang"
];

export default function Authors() {
    const [inputValue, setInputValue] = useState("");
    const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!inputValue) {
            setFilteredOptions([]);
        } else {
            setFilteredOptions(
                authors.sort().filter((author) =>
                    author.toLowerCase().startsWith(inputValue.toLowerCase())
                )
            );
            setActiveIndex(0);
        }
    }, [inputValue]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setFilteredOptions([]);
                setActiveIndex(0);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = async (value: string) => {
        if (!selectedAuthors.includes(value)) {
            setSelectedAuthors((prev) => [...prev, value]);
        }
        setInputValue("");
        setFilteredOptions([]);
        setActiveIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            setActiveIndex((prev) =>
                prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            setActiveIndex((prev) =>
                prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
        } else if (e.key === "Enter") {
            if (activeIndex > -1 && filteredOptions[activeIndex]) {
                handleSelect(filteredOptions[activeIndex]);
            } else {
                handleSelect(inputValue.trim());
            }
        }
    };

    const handleRemoveAuthor = (author: string) => {
        setSelectedAuthors((prev) => prev.filter((item) => item !== author)); // Remove the author from the list
    };

    return (
        <div className="section p-4">
            <h2 className="font-bold mt-0 mb-2">Authors</h2>
        <div className="flex flex-col w-full">
            <div className="w-full relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Add author..."
                />
                {filteredOptions.length > 0 && (
                    <div
                        ref={dropdownRef}
                        className="absolute w-full mt-1 bg-white border rounded-md shadow-sm z-10"
                    >
                        {filteredOptions.map((option, index) => (
                            <div
                                key={option}
                                onClick={() => handleSelect(option)}
                                className={`p-2 cursor-pointer ${activeIndex === index ? "bg-nique-blue text-white" : "hover:bg-gray-200"}`}
                            >
                                {option}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected author tags */}
            <div className="flex flex-wrap mt-3 gap-2">
                {selectedAuthors.map((author) => (
                    <div
                        key={author}
                        className="px-3 text-sm py-1 flex items-center bg-nique-blue text-white rounded-full cursor-pointer hover:bg-nique-blue-hover"
                        onClick={() => handleRemoveAuthor(author)}
                    >
                        <MdOutlineClose className="mr-2" /> {author}
                    </div>
                ))}
            </div>
        </div>
        </div>
    );
}