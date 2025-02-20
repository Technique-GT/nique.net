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
    <section className="pt-[7rem] pb-[2rem]">
      <div className="lg:mx-auto max-w-5xl mx-[1.5rem]">
        <Swiper
          modules={[EffectCoverflow, Pagination, Navigation]}
          effect={'coverflow'}
          loop={true}
          spaceBetween={30}
          slidesPerView={1}
          pagination={{
            clickable: true,
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
              <SwiperSlide key={index} onClick={()=>navigate('news/'+p.id)} className='cursor-pointer'>
                <img src={p.coverImage} alt="" className='rounded-lg'/>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
