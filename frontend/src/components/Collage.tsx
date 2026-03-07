import { ArticleListProps } from "../types/article";
import { getArticleImage } from "../utils/articlePresentation";

function Collage({ articles }: ArticleListProps) {
  const imageWidth = 'clamp(16rem, 60vw, 30rem)';
  return (
    <div className="relative w-full overflow-hidden">
      <div className="scroll-container">
        <div className="scroll-content flex shrink-0">
          {articles.map((article, index) => {
            if (!article) return null;
            const image = getArticleImage(article);
            const imageUrl = image || "https://picsum.photos/600/800";
            const altText = article.title || "Article image";
            return (
              <div key={`first-${index}`} className="flex-none" onDragStart={(e) => e.preventDefault()}>
                <img
                  src={imageUrl}
                  alt={altText}
                  style={{ width: imageWidth, aspectRatio: '3/4'}}
                  className="object-cover md:px-1 shrink-0 max-w-none"
                  draggable={false}
                />
              </div>
            );
          })}
          {articles.map((article, index) => {
            if (!article) return null;
            const image = getArticleImage(article);
            const imageUrl = image || "https://picsum.photos/600/800"; //placeholder
            const altText = article.title || "Article image";
            return (
              <div key={`second-${index}`} className="flex-none" onDragStart={(e) => e.preventDefault()}>
                <img
                  src={imageUrl}
                  alt={altText}
                  style={{ width: imageWidth, aspectRatio: '3/4'}}
                  className="object-cover md:px-1 shrink-0 max-w-none"
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
