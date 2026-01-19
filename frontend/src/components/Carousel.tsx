import { useNavigate } from 'react-router-dom';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../index.css';
import { ArticleListProps } from '../types/article';
import { getArticleDescription, getArticleImage, getArticleLink } from '../utils/articlePresentation';

export default function Carousel( {articles, width}: ArticleListProps ) {
  const navigate=useNavigate();
  
  return (
      <div className="relative lg:mx-auto max-w-5xl mx-[1.5rem]">
        <Swiper
          modules={[EffectCoverflow, Pagination, Navigation]}
          navigation={{
            nextEl: '.my-swiper-button-next',
            prevEl: '.my-swiper-button-prev',
          }}
          effect={'coverflow'}
          loop={true}
          spaceBetween={50}
          slidesPerView={1}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          centeredSlides={true}
          grabCursor={true}
          coverflowEffect={{
            rotate: 0,
            slideShadows: false,
          }}
          style={{ width: `${width}` }}
          className="coverflow h-96"
        >
          {articles.map((article, index) => {
            const link = getArticleLink(article);
            const image = getArticleImage(article);
            const desc = getArticleDescription(article);
            return (
              <SwiperSlide 
                key={index} 
                onClick={()=>navigate(link)} 
                className={`cursor-pointer rounded-lg relative flex items-end h-full overflow-hidden group ${
                  image ? "" : "bg-gradient-to-b from-nique-blue/10 to-white"
                }`}
              >
                {image?.url && (
                    <img 
                        src={image.url} 
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                    />
                )}
                
                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: image ? 'linear-gradient(to bottom, rgba(0,0,0,0) 80%, rgba(255,255,255,1))' : undefined
                    }}
                />

                <h6 
                  className="text-[#1A1E47] text-sm absolute bottom-0 left-0 m-6 overflow-hidden z-10"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                }}>
                    {desc}
                </h6>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* custom navigation buttons */}
        <div
          className="my-swiper-button-prev absolute top-1/2 left-4 -translate-y-1/2 
                    z-10 cursor-pointer bg-transparent p-2"
        >
          <ArrowLeft size={32} />
        </div>
        <div
          className="my-swiper-button-next absolute top-1/2 right-4 -translate-y-1/2 
                    z-10 cursor-pointer bg-transparent p-2"
        >
          <ArrowRight size={32} />
        </div>
      </div>
  );
}
