import React, { useState, useEffect } from "react";
import { User, Mail, Lock, Eye, EyeOff, Save, X, Edit, Globe, Link, Twitter, Instagram, Linkedin } from "lucide-react";

interface UserSettings {
  id: string;
  username: string;
  email: string;
  profilePicture: string;
  firstName: string;
  lastName: string;
  bio: string;
  website: string;
  socialMedia: {
    twitter: string;
    instagram: string;
    linkedin: string;
  };
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  role: string;
}

interface SettingsProps {
  initialUser?: Partial<UserSettings>;
  onSave?: (userData: UserSettings) => Promise<void>;
  onAvatarUpload?: (file: File) => Promise<string>;
}

const Settings: React.FC<SettingsProps> = ({
  initialUser = {},
  onSave = async () => {
    alert("not implemented");
  },
  onAvatarUpload = async () => {
    alert("not implemented");
    return "dummy";
  },
}) => {
  const [user, setUser] = useState<UserSettings>({
    id: "",
    username: "",
    email: "",
    profilePicture: "",
    firstName: "",
    lastName: "",
    bio: "",
    website: "",
    socialMedia: {
      twitter: "",
      instagram: "",
      linkedin: ""
    },
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    role: "",
    ...initialUser,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('socialMedia.')) {
      const socialMediaField = name.split('.')[1];
      setUser(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialMediaField]: value
        }
      }));
    } else {
      setUser(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!user.username.trim()) newErrors.username = "Username is required";
    if (!user.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (user.newPassword) {
      if (!user.currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }
      if (user.newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters";
      }
      if (user.newPassword !== user.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave(user);
      // Reset password fields after successful save
      setUser(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      console.error("Failed to save settings:", error);
      setErrors(prev => ({
        ...prev,
        form: "Failed to save settings. Please try again.",
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        setIsLoading(true);
        const newAvatarUrl = await onAvatarUpload(e.target.files[0]);
        setUser(prev => ({ ...prev, profilePicture: newAvatarUrl }));
      } catch (error) {
        console.error("Failed to upload avatar:", error);
        setErrors(prev => ({
          ...prev,
          profilePicture: "Failed to upload avatar. Please try again.",
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetPasswordFields = () => {
    setUser(prev => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    setErrors(prev => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  return (
    <div className="settings-container p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

      {errors.form && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <User className="mr-2" size={18} />
            Profile Information
          </h3>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center md:w-1/4">
              <div className="relative mb-4">
                <img
                  src={user.profilePicture || "/default-avatar.png"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover cursor-pointer"
                  onClick={() => setIsAvatarModalOpen(true)}
                />
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full">
                  <Edit size={16} />
                </div>
              </div>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setIsAvatarModalOpen(true)}
              >
                Change Avatar
              </button>
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={user.username}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                      errors.username
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200"
                    }`}
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={user.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                        errors.email
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-200"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={user.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={user.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={user.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={user.website}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                    disabled={isLoading}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Social Media</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="socialMedia.twitter" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Twitter className="mr-2" size={16} />
                Twitter
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link size={16} className="text-gray-400" />
                </div>
                <input
                  type="url"
                  id="socialMedia.twitter"
                  name="socialMedia.twitter"
                  value={user.socialMedia.twitter}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isLoading}
                  placeholder="https://twitter.com/username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="socialMedia.instagram" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Instagram className="mr-2" size={16} />
                Instagram
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link size={16} className="text-gray-400" />
                </div>
                <input
                  type="url"
                  id="socialMedia.instagram"
                  name="socialMedia.instagram"
                  value={user.socialMedia.instagram}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isLoading}
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="socialMedia.linkedin" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Linkedin className="mr-2" size={16} />
                LinkedIn
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link size={16} className="text-gray-400" />
                </div>
                <input
                  type="url"
                  id="socialMedia.linkedin"
                  name="socialMedia.linkedin"
                  value={user.socialMedia.linkedin}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isLoading}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Lock className="mr-2" size={18} />
            Change Password
          </h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={user.currentPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-10 py-2 border rounded focus:outline-none focus:ring-2 ${
                    errors.currentPassword
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isLoading}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={user.newPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-10 py-2 border rounded focus:outline-none focus:ring-2 ${
                    errors.newPassword
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={user.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-10 py-2 border rounded focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {(user.currentPassword || user.newPassword || user.confirmPassword) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-gray-600 hover:text-gray-800 mr-4"
                  onClick={resetPasswordFields}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoading || isSaving}
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2" size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Avatar Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Change Avatar</h3>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <img
                src={user.profilePicture || "/default-avatar.png"}
                alt="Profile Preview"
                className="w-32 h-32 rounded-full object-cover mb-4"
              />
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-2 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => document.getElementById("avatar-upload")?.click()}
                disabled={isLoading}
              >
                {isLoading ? "Uploading..." : "Upload New Image"}
              </button>
              {errors.profilePicture && (
                <p className="mt-1 text-sm text-red-600">{errors.profilePicture}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;