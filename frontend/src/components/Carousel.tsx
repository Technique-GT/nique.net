import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
// import 'swiper/swiper-bundle.css';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface CarouselProps {
    slides: Array<React.ReactNode>;
}

const Carousel: React.FC<CarouselProps> = ({ slides }) => {
    return (
        <Swiper
            modules={[Navigation, Pagination, A11y]}
            spaceBetween={50}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            a11y={{
                prevSlideMessage: 'Previous slide',
                nextSlideMessage: 'Next slide',
            }}
        >
            {slides.map((slideContent, index) => (
                <SwiperSlide key={index}>
                    {slideContent}
                </SwiperSlide>
            ))}
        </Swiper>
    );
};

export default Carousel;