import { useState } from "react";

export default function Slug() {
  const [slug, setSlug] = useState<string>("");

  // Function to handle input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Allow only letters, numbers, and dashes
    if (/^[a-zA-Z0-9-]*$/.test(value)) {
      setSlug(value);
    }
  };

  return (
    <div className="section p-4">
      <h2 className="font-bold mt-0 mb-2">Custom Slug</h2>
      <input
        className="w-full border border-gray-300 rounded-md p-2"
        type="text"
        value={slug}
        onChange={handleChange}
        placeholder="(letters, numbers, and dashes only)"
      />
    </div>
  );
}