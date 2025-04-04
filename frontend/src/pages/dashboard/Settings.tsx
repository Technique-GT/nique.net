import React, { useState } from "react";
import { Edit } from "lucide-react";

const SettingsTab: React.FC = () => {
  // Example user data (Replace with actual data fetching)
  const [user, setUser] = useState({
    username: "john_doe",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    bio: "A passionate developer",
    website: "https://johndoe.com",
    role: "subscriber",
    socialMedia: {
      twitter: "@johndoe",
      instagram: "john_doe",
      linkedin: "john-doe",
    },
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-nique-blue mb-4">Profile Information</h2>

      {/* Profile Fields */}
      {[ 
        { label: "Username", value: user.username },
        { label: "Email", value: user.email },
        { label: "First Name", value: user.firstName },
        { label: "Last Name", value: user.lastName },
        { label: "Bio", value: user.bio },
        { label: "Website", value: user.website },
        { label: "Role", value: user.role },
      ].map((field) => (
        <div key={field.label} className="flex justify-between items-center mb-3 p-2 border-b">
          <div>
            <span className="text-lg font-medium">{field.label}:</span> {field.value}
          </div>
          <button className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500">
            <Edit size={16} />
          </button>
        </div>
      ))}

      {/* Social Media */}
      <h2 className="text-2xl font-bold text-nique-blue mt-6 mb-4">Social Media</h2>
      {Object.entries(user.socialMedia).map(([platform, handle]) => (
        <div key={platform} className="flex justify-between items-center mb-3 p-2 border-b">
          <div>
            <span className="text-lg font-medium capitalize">{platform}:</span> {handle}
          </div>
          <button className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500">
            <Edit size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default SettingsTab;

