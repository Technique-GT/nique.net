import { useNavigate } from 'react-router-dom';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../index.css';
import { ArticleListProps } from '../types/article';

export default function Carousel( {posts}: ArticleListProps ) {
  const navigate=useNavigate();
  
  return (
      <div className="lg:mx-auto max-w-5xl mx-[1.5rem]">
        <Swiper
          modules={[EffectCoverflow, Pagination, Navigation]}
          navigation={true}
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
          className="coverflow"
        >
          {posts.map((p, index) => {
            return (
              <SwiperSlide 
                key={index} 
                onClick={()=>navigate('news/'+p.id)} 
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(26, 30, 71, 0.15), rgba(26, 30, 71, 1) 75%), url(${p.coverImage})`,
                }}
                className='cursor-pointer rounded-lg'
              >
                <img src={p.coverImage} alt="" className='rounded-lg'/>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
  );
}
