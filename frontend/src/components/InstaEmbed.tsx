import { useEffect } from 'react';

function InstagramEmbed({ username }: { username: string }) {
  useEffect(() => {
    // Load Instagram embed script dynamically
    const script = document.createElement('script');
    script.src = "//www.instagram.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <blockquote 
      className="instagram-media !min-w-0 !rounded-md"
      data-instgrm-permalink={"https://www.instagram.com/"+username+"/?utm_source=ig_embed&utm_campaign=loading"}
      data-instgrm-version="14"
    >
    </blockquote>
  );
}

export default InstagramEmbed;