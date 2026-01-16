import { useNavigate } from 'react-router-dom';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../index.css';
import { ArticleListProps } from '../types/article';

export default function Carousel( {posts, width}: ArticleListProps ) {
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
          {posts.map((p, index) => {
            const link = p.categorySlug && p.slug ? `/${p.categorySlug}/${p.slug}` : `/${p.id}`;
            return (
              <SwiperSlide 
                key={index} 
                onClick={()=>navigate(link)} 
                className={`cursor-pointer rounded-lg relative flex items-end h-full overflow-hidden group ${
                  p.featuredImage ? "" : "bg-gradient-to-b from-nique-blue/10 to-white"
                }`}
              >
                {p.featuredImage?.url && (
                    <img 
                        src={p.featuredImage.url} 
                        alt={p.title}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                    />
                )}
                
                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: p.featuredImage ? 'linear-gradient(to bottom, rgba(0,0,0,0) 80%, rgba(255,255,255,1))' : undefined
                    }}
                />

                <h6 
                  className="text-[#1A1E47] text-sm absolute bottom-0 left-0 m-6 overflow-hidden z-10"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                }}>
                    { p.desc }
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
