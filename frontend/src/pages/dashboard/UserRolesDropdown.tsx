import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Define the possible user roles as a type
type UserRoleOption = "Subscribers" | "Staff";

interface UserRolesDropdownProps {
  selectedOption: UserRoleOption;
  onSelect: (option: UserRoleOption) => void;
}

const UserRolesDropdown: React.FC<UserRolesDropdownProps> = ({
  selectedOption,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const options: UserRoleOption[] = ["Subscribers", "Staff"];

  return (
    <div className="relative inline-block text-left w-full max-w-xs">
      <button
        type="button"
        className="inline-flex justify-between items-center w-full px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border border-gray-300 rounded-md shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {options.map((option: UserRoleOption) => (
              <button
                key={option}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  selectedOption === option
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRolesDropdown;