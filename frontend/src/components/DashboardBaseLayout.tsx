import {
  Camera,
  ChevronDown,
  ChevronUp,
  FileText,
  Home,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardBaseLayout(props: { children: any }) {
  const { children } = props;

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const postsNames = ["All Posts", "Add New Posts", "Categories", "Tags"];
  const usersNames = [
    "Subscribers",
    "Staff",
    "Add New User",
    "Profile",
    "User Role Editor",
  ];
  const mediaNames = ["Library", "New Media"];

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [articlesDropdownOpen, setArticlesDropdownOpen] = useState(false);
  const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
    if (articlesDropdownOpen) setArticlesDropdownOpen(false);
    if (mediaDropdownOpen) setMediaDropdownOpen(false);
  };

  const toggleArticlesDropdown = () => {
    setArticlesDropdownOpen(!articlesDropdownOpen);
    if (userDropdownOpen) setUserDropdownOpen(false);
    if (mediaDropdownOpen) setMediaDropdownOpen(false);
  };

  const toggleMediaDropdown = () => {
    setMediaDropdownOpen(!mediaDropdownOpen);
    if (userDropdownOpen) setUserDropdownOpen(false);
    if (articlesDropdownOpen) setArticlesDropdownOpen(false);
  };

  return (
    <div className="flex flex-row min-h-screen h-full">
      <div className="bg-nique-blue min-w-65">
        <div
          className="my-10 flex flex-row justify-center items-center **:text-white text-2xl text-center hover:cursor-pointer"
          onClick={() => {
            navigate("/");
          }}
        >
          <Home />
          <h4 className="ml-3">Technique</h4>
        </div>
        <div
          className="bg-white text-center mx-5 my-10 rounded-2xl p-3 hover:cursor-pointer"
          onClick={() => {
            setActiveTab("Dashboard");
            navigate("/dashboard");
          }}
        >
          <h6 className="text-lg font-bold text-nique-blue">Dashboard</h6>
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-10 space-y-1 px-2">
          {/* Articles Dropdown */}
          <div className="mb-2">
            <div
              className={`
                group flex flex-row items-center text-lg p-3 rounded-lg 
                cursor-pointer transition-all duration-300
                hover:bg-blue-600 hover:shadow-lg
                active:bg-blue-700
                relative overflow-hidden
                ${
                  postsNames.includes(activeTab)
                    ? "bg-blue-800 text-white"
                    : "text-gray-200 hover:text-white"
                }
              `}
              onClick={toggleArticlesDropdown}
            >
              <FileText
                className={`transition-transform duration-300 ${
                  postsNames.includes(activeTab)
                    ? "scale-110 text-white"
                    : "group-hover:scale-110"
                }`}
              />
              <span
                className={`ml-3 transition-all duration-300 ${
                  postsNames.includes(activeTab)
                    ? "font-bold"
                    : "group-hover:font-semibold"
                }`}
              >
                Posts
              </span>
              <div className="ml-auto">
                {articlesDropdownOpen ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </div>

            {articlesDropdownOpen && (
              <div className="ml-8 mt-1 space-y-1">
                <SidebarButton
                  label="All Posts"
                  onClick={() => {
                    setActiveTab("All Posts");
                    // setArticlesDropdownOpen(false);
                    navigate("/dashboard/all-posts");
                  }}
                  isActive={activeTab === "All Posts"}
                  indent
                />
                <SidebarButton
                  label="Add New Posts"
                  onClick={() => {
                    setActiveTab("Add New Posts");
                    // setArticlesDropdownOpen(false);
                    navigate("/dashboard/edit-article");
                  }}
                  isActive={activeTab === "Add New Posts"}
                  indent
                />
                <SidebarButton
                  label="Categories"
                  onClick={() => {
                    setActiveTab("Categories");
                    // setArticlesDropdownOpen(false);
                    navigate("/dashboard/categories");
                  }}
                  isActive={activeTab === "Categories"}
                  indent
                />
                <SidebarButton
                  label="Tags"
                  onClick={() => {
                    setActiveTab("Tags");
                    // setArticlesDropdownOpen(false);
                    navigate("/dashboard/tags");
                  }}
                  isActive={activeTab === "Tags"}
                  indent
                />
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="mb-2">
            <div
              className={`
                group flex flex-row items-center text-lg p-3 rounded-lg 
                cursor-pointer transition-all duration-300
                hover:bg-blue-600 hover:shadow-lg
                active:bg-blue-700
                relative overflow-hidden
                ${
                  usersNames.includes(activeTab)
                    ? "bg-blue-800 text-white"
                    : "text-gray-200 hover:text-white"
                }
              `}
              onClick={toggleUserDropdown}
            >
              <Users
                className={`transition-transform duration-300 ${
                  usersNames.includes(activeTab)
                    ? "scale-110 text-white"
                    : "group-hover:scale-110"
                }`}
              />
              <span
                className={`ml-3 transition-all duration-300 ${
                  usersNames.includes(activeTab)
                    ? "font-bold"
                    : "group-hover:font-semibold"
                }`}
              >
                Users
              </span>
              <div className="ml-auto">
                {userDropdownOpen ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </div>

            {userDropdownOpen && (
              <div className="ml-8 mt-1 space-y-1">
                <SidebarButton
                  label="Subscribers"
                  onClick={() => {
                    setActiveTab("Subscribers");
                    // setUserDropdownOpen(false);
                    navigate("/dashboard/subscribers");
                  }}
                  isActive={activeTab === "Subscribers"}
                  indent
                />
                <SidebarButton
                  label="Staff"
                  onClick={() => {
                    setActiveTab("Staff");
                    // setUserDropdownOpen(false);
                    navigate("/dashboard/staff");
                  }}
                  isActive={activeTab === "Staff"}
                  indent
                />
                <SidebarButton
                  label="Add New User"
                  onClick={() => {
                    setActiveTab("Add New User");
                    // setUserDropdownOpen(false);
                    navigate("/dashboard/add-new-user");
                  }}
                  isActive={activeTab === "Add New User"}
                  indent
                />
                <SidebarButton
                  label="Profile"
                  onClick={() => {
                    setActiveTab("Profile");
                    // setUserDropdownOpen(false);
                    navigate("/dashboard/profile");
                  }}
                  isActive={activeTab === "Profile"}
                  indent
                />
                <SidebarButton
                  label="User Role Editor"
                  onClick={() => {
                    setActiveTab("User Role Editor");
                    // setUserDropdownOpen(false);
                    navigate("/dashboard/user-role-editor");
                  }}
                  isActive={activeTab === "User Role Editor"}
                  indent
                />
              </div>
            )}
          </div>

          {/* Media Dropdown */}
          <div className="mb-2">
            <div
              className={`group flex flex-row items-center text-lg p-3 rounded-lg cursor-pointer
                transition-all duration-300 hover:bg-blue-600 hover:shadow-lg active:bg-blue-700
                relative overflow-hidden ${
                  mediaNames.includes(activeTab)
                    ? "bg-blue-800 text-white"
                    : "text-gray-200 hover:text-white"
                } `}
              onClick={toggleMediaDropdown}
            >
              <Camera
                className={`transition-transform duration-300 ${
                  mediaNames.includes(activeTab)
                    ? "scale-110 text-white"
                    : "group-hover:scale-110"
                }`}
              />
              <span
                className={`ml-3 transition-all duration-300 ${
                  mediaNames.includes(activeTab)
                    ? "font-bold"
                    : "group-hover:font-semibold"
                }`}
              >
                Media
              </span>
              <div className="ml-auto">
                {mediaDropdownOpen ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </div>

            {mediaDropdownOpen && (
              <div className="ml-8 mt-1 space-y-1">
                <SidebarButton
                  label="Library"
                  onClick={() => {
                    setActiveTab("Library");
                    // setUserDropdownOpen(false);
                    navigate("/dashboard/library");
                  }}
                  isActive={activeTab === "Library"}
                  indent
                />
                <SidebarButton
                  label="New Media"
                  onClick={() => {
                    setActiveTab("New Media");
                    // setUserDropdownOpen(false);
                    navigate("/dashboard/add-new-media-file");
                  }}
                  isActive={activeTab === "New Media"}
                  indent
                />
              </div>
            )}
          </div>
          <SidebarButton
            icon={<Settings />}
            label="Settings"
            onClick={() => {
              setActiveTab("Settings");
              navigate("/dashboard/settings");
            }}
            isActive={activeTab === "Settings"}
          />
        </nav>
      </div>
      <div className="flex-6 bg-gray-100 pb-20">
        <h4 className="px-15 py-8 text-4xl tracking-wider border-b-2 mb-5 border-b-gray-300">
          {activeTab}
        </h4>
        {children}
      </div>
    </div>
  );
}

DashboardBaseLayout.defaultProps = {
  children: [],
};

function SidebarButton({
  icon,
  label,
  onClick,
  isActive,
  indent = false,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={`
        group flex flex-row items-center text-lg p-3 rounded-lg 
        cursor-pointer transition-all duration-300
        hover:bg-blue-600 hover:shadow-lg
        active:bg-blue-700
        relative overflow-hidden
        ${
          isActive ? "bg-blue-800 text-white" : "text-gray-200 hover:text-white"
        }
        ${indent ? "pl-10" : ""}
      `}
      onClick={onClick}
    >
      {icon && (
        <div
          className={`transition-transform duration-300 ${
            isActive ? "scale-110 text-white" : "group-hover:scale-110"
          }`}
        >
          {icon}
        </div>
      )}
      <span
        className={`${icon ? "ml-3" : ""} transition-all duration-300 ${
          isActive ? "font-bold" : "group-hover:font-semibold"
        }`}
      >
        {label}
      </span>

      {isActive && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-l-full"></div>
      )}
    </div>
  );
}
