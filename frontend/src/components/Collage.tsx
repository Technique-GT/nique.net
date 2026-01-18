import { ArticleListProps } from "../types/article";
import { getArticleImage } from "../utils/articlePresentation";

function Collage({ articles, width = '500px' }: ArticleListProps) {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="scroll-container">
        <div className="scroll-content flex">
          {articles.map((article, index) => {
            if (!article) return null;
            const image = getArticleImage(article);
            const imageUrl = image?.url || "https://picsum.photos/600/800";
            const altText = article.title || "Article image";
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
          {articles.map((article, index) => {
            if (!article) return null;
            const image = getArticleImage(article);
            const imageUrl = image?.url || "https://picsum.photos/600/800"; //placeholder
            const altText = article.title || "Article image";
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
