import { Link } from 'react-router-dom'
import { ArticleBlockProps } from '../types/article'
import {
  getArticleAuthorName,
  getArticleCategoryName,
  getArticleLink,
} from '../utils/articlePresentation'

function ArticleBlock({ article, height }: ArticleBlockProps) {
    const link = getArticleLink(article);
    const category = getArticleCategoryName(article);
    const author = getArticleAuthorName(article);

    const artAny = article as any;
    const media = artAny.featuredMedia;
    const rawUrl = typeof media === 'string' ? media : media?.url || artAny.featuredMediaUrl;

    // generates variant URLs for older uploaded images
    const getFallbackUrl = (width: number, format: string) => {
        if (!rawUrl) return '';
        return rawUrl.replace(/\/master_[^/]+$/, `/variants/${width}w.${format}`);
    };

    const avifVariants = media?.variants?.filter((v: any) => v.format?.trim() === 'avif') && media.variants.length > 0 
        ? media.variants.filter((v: any) => v.format?.trim() === 'avif') 
        : [
            { width: 400, url: getFallbackUrl(400, 'avif') },
            { width: 800, url: getFallbackUrl(800, 'avif') },
            { width: 1600, url: getFallbackUrl(1600, 'avif') },
          ];

    const webpVariants = media?.variants?.filter((v: any) => v.format?.trim() === 'webp') && media.variants.length > 0 
        ? media.variants.filter((v: any) => v.format?.trim() === 'webp') 
        : [
            { width: 400, url: getFallbackUrl(400, 'webp') },
            { width: 800, url: getFallbackUrl(800, 'webp') },
            { width: 1600, url: getFallbackUrl(1600, 'webp') },
          ];

    return (
        <Link
            to={link}
            className='relative cursor-pointer rounded-md max-h-[50vh] md:max-h-none w-full flex items-end p-3 overflow-hidden group'
            style={{ height: `${height}` }}
        >
            {rawUrl && (
                <picture className="absolute inset-0 w-full h-full">
                    <source
                        srcSet={avifVariants.map((v: any) => `${v.url} ${v.width}w`).join(', ')}
                        type="image/avif"
                    />
                    <source
                        srcSet={webpVariants.map((v: any) => `${v.url} ${v.width}w`).join(', ')}
                        type="image/webp"
                    />
                    <img 
                        src={rawUrl} 
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                    />
                </picture>
            )}
            
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to bottom, rgba(26, 30, 71, 0.15), rgba(26, 30, 71, 1) 85%)'
                }}
            />

            <div className="relative z-10 w-full pointer-events-none">
                <h3
                    className="title text-white font-bold text-2xl/7 mb-2 overflow-hidden"
                    style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {article.title}
                </h3>
                <h6 className="text-[#BAC0FF] text-sm"><span className="uppercase">{category}</span> &#8226; {author}</h6>
            </div>
        </Link>
    )
}

export default ArticleBlock