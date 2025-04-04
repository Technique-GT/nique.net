import axios from "axios";
import cookie from "js-cookie";
import { Home, Users, FileText, BarChart, Folder, MessageSquare, Image, Shield, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SettingsTab from "./dashboard/Settings";
import Permissions from "./dashboard/Permissions";
import Subscribers from "./dashboard/Subscriber";
import Staff from "./dashboard/Staff";
import Articles from "./dashboard/Articles";
import Categories from "./dashboard/Categories";
import Tags from "./dashboard/Tags";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("UserRoles");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [articlesDropdownOpen, setArticlesDropdownOpen] = useState(false);

  useEffect(() => {
    const jwt_token = cookie.get("jwt");
    if (!jwt_token) {
      navigate("/admin"); // Redirect if not logged in
    } else {
      axios
        .get("http://127.0.0.1:5050/auth/test_token", {
          headers: { Authorization: `Bearer ${jwt_token}` },
        })
        .then(
          () => {},
          () => navigate("/admin") // Expired session
        );
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "UserRoles":
        return <Permissions />;
      case "Subscribers":
        return <Subscribers />;
      case "Staff":
        return <Staff />;
      case "ManageArticles":
        return <Articles />;
      case "ManageCategories":
        return <Categories />;
      case "ManageTags":
        return <Tags />;
      case "DashboardFeatures":
        return <div>Dashboard Features & Metrics</div>;
      case "Comments":
        return <div>Comment Moderation</div>;
      case "Media":
        return <div>Media Uploads & Library</div>;
      case "Analytics":
        return <div>Website Analytics & User Sessions</div>;
      case "APIs":
        return <div>Frontend Integration APIs</div>;
      case "Misc":
        return <div>Miscellaneous Features</div>;
      case "Security":
        return <div>Security Settings & Protections</div>;
      case "Settings":
        return <SettingsTab />;
      default:
        return <div>Welcome to the Dashboard!</div>;
    }
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
    if (articlesDropdownOpen) setArticlesDropdownOpen(false);
  };

  const toggleArticlesDropdown = () => {
    setArticlesDropdownOpen(!articlesDropdownOpen);
    if (userDropdownOpen) setUserDropdownOpen(false);
  };

  return (
    <div className="flex flex-row h-screen">
      {/* Sidebar */}
      <div className="bg-nique-blue min-w-60 flex flex-col p-4">
        <div
          className="flex flex-row justify-center items-center text-white text-2xl hover:cursor-pointer"
          onClick={() => navigate("/")}
        >
          <Home className="mr-2" />
          <h4>Technique</h4>
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-10 space-y-1">
          {/* User Dropdown */}
          <div className="mb-2">
            <div
              className={`
                group flex flex-row items-center text-lg p-3 rounded-lg 
                cursor-pointer transition-all duration-300
                hover:bg-blue-600 hover:shadow-lg
                active:bg-blue-700
                relative overflow-hidden
                ${activeTab.startsWith('User') ? 'bg-blue-800 text-white' : 'text-gray-200 hover:text-white'}
              `}
              onClick={toggleUserDropdown}
            >
              <Users className={`transition-transform duration-300 ${activeTab.startsWith('User') ? 'scale-110 text-white' : 'group-hover:scale-110'}`} />
              <span className={`ml-3 transition-all duration-300 ${activeTab.startsWith('User') ? 'font-bold' : 'group-hover:font-semibold'}`}>
                Users
              </span>
              <div className="ml-auto">
                {userDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
            
            {userDropdownOpen && (
              <div className="ml-8 mt-1 space-y-1">
                <SidebarButton
                  label="User Roles"
                  onClick={() => {
                    setActiveTab("UserRoles");
                    setUserDropdownOpen(false);
                  }}
                  isActive={activeTab === "UserRoles"}
                  indent
                />
                <SidebarButton
                  label="Subscribers"
                  onClick={() => {
                    setActiveTab("Subscribers");
                    setUserDropdownOpen(false);
                  }}
                  isActive={activeTab === "Subscribers"}
                  indent
                />
                <SidebarButton
                  label="Staff"
                  onClick={() => {
                    setActiveTab("Staff");
                    setUserDropdownOpen(false);
                  }}
                  isActive={activeTab === "Staff"}
                  indent
                />
              </div>
            )}
          </div>

          {/* Articles Dropdown */}
          <div className="mb-2">
            <div
              className={`
                group flex flex-row items-center text-lg p-3 rounded-lg 
                cursor-pointer transition-all duration-300
                hover:bg-blue-600 hover:shadow-lg
                active:bg-blue-700
                relative overflow-hidden
                ${activeTab.startsWith('Manage') ? 'bg-blue-800 text-white' : 'text-gray-200 hover:text-white'}
              `}
              onClick={toggleArticlesDropdown}
            >
              <FileText className={`transition-transform duration-300 ${activeTab.startsWith('Manage') ? 'scale-110 text-white' : 'group-hover:scale-110'}`} />
              <span className={`ml-3 transition-all duration-300 ${activeTab.startsWith('Manage') ? 'font-bold' : 'group-hover:font-semibold'}`}>
                Articles
              </span>
              <div className="ml-auto">
                {articlesDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
            
            {articlesDropdownOpen && (
              <div className="ml-8 mt-1 space-y-1">
                <SidebarButton
                  label="Manage Articles"
                  onClick={() => {
                    setActiveTab("ManageArticles");
                    setArticlesDropdownOpen(false);
                  }}
                  isActive={activeTab === "ManageArticles"}
                  indent
                />
                <SidebarButton
                  label="Manage Categories"
                  onClick={() => {
                    setActiveTab("ManageCategories");
                    setArticlesDropdownOpen(false);
                  }}
                  isActive={activeTab === "ManageCategories"}
                  indent
                />
                <SidebarButton
                  label="Manage Tags"
                  onClick={() => {
                    setActiveTab("ManageTags");
                    setArticlesDropdownOpen(false);
                  }}
                  isActive={activeTab === "ManageTags"}
                  indent
                />
              </div>
            )}
          </div>

          <SidebarButton
            icon={<BarChart />}
            label="Dashboard Features"
            onClick={() => setActiveTab("DashboardFeatures")}
            isActive={activeTab === "DashboardFeatures"}
          />
          <SidebarButton
            icon={<MessageSquare />}
            label="Comments"
            onClick={() => setActiveTab("Comments")}
            isActive={activeTab === "Comments"}
          />
          <SidebarButton
            icon={<Image />}
            label="Media Uploads"
            onClick={() => setActiveTab("Media")}
            isActive={activeTab === "Media"}
          />
          <SidebarButton
            icon={<BarChart />}
            label="Analytics"
            onClick={() => setActiveTab("Analytics")}
            isActive={activeTab === "Analytics"}
          />
          <SidebarButton
            icon={<FileText />}
            label="APIs"
            onClick={() => setActiveTab("APIs")}
            isActive={activeTab === "APIs"}
          />
          <SidebarButton
            icon={<Shield />}
            label="Security"
            onClick={() => setActiveTab("Security")}
            isActive={activeTab === "Security"}
          />
          <SidebarButton
            icon={<Settings />}
            label="Settings"
            onClick={() => setActiveTab("Settings")}
            isActive={activeTab === "Settings"}
          />
        </nav>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex-1 bg-gray-200 p-10">
        <h4 className="text-4xl tracking-wider border-b-2 mb-5 border-b-gray-300">
          {activeTab.replace(/([A-Z])/g, " $1").trim()}
        </h4>
        {renderTabContent()}
      </div>
    </div>
  );
}

function SidebarButton({
  icon,
  label,
  onClick,
  isActive,
  indent = false
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
        ${isActive ? 'bg-blue-800 text-white' : 'text-gray-200 hover:text-white'}
        ${indent ? 'pl-10' : ''}
      `}
      onClick={onClick}
    >
      {icon && (
        <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'group-hover:scale-110'}`}>
          {icon}
        </div>
      )}
      <span className={`${icon ? 'ml-3' : ''} transition-all duration-300 ${isActive ? 'font-bold' : 'group-hover:font-semibold'}`}>
        {label}
      </span>
      
      {isActive && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-l-full"></div>
      )}
    </div>
  );
}