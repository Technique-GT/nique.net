import { ArticleListProps } from "../types/article";

function Collage({ posts, width = '500px' }: ArticleListProps) {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="scroll-container">
        <div className="scroll-content flex">
          {posts.map((post, index) => {
            if (!post) return null;
            const imageUrl = post.featuredImage?.url || "https://picsum.photos/600/800";
            const altText = post.title || "Article image";
            return (
              <div key={`first-${index}`} onDragStart={(e) => e.preventDefault()}>
                <img
                  src={imageUrl}
                  alt={altText}
                  style={{ width, aspectRatio: '3/4'}}
                  className="object-cover md:px-1"
                  draggable={false}
                />
              </div>
            );
          })}
          {posts.map((post, index) => {
            if (!post) return null;
            const imageUrl = post.featuredImage?.url || "https://picsum.photos/600/800"; //placeholder
            const altText = post.title || "Article image";
            return (
              <div key={`second-${index}`} onDragStart={(e) => e.preventDefault()}>
                <img
                  src={imageUrl}
                  alt={altText}
                  style={{ width, aspectRatio: '3/4'}}
                  className="object-cover md:px-1"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Collage;
