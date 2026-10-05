import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface CarouselImage {
  url: string;
  caption: string;
  credit: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  const previousImage = () => {
    setCurrentIndex((index) =>
      index === 0 ? images.length - 1 : index - 1
    );
  };

  const nextImage = () => {
    setCurrentIndex((index) =>
      index === images.length - 1 ? 0 : index + 1
    );
  };

  return (
    <div className="w-full">
      {/* Image */}
      <div className="relative w-full">
        <img
          src={currentImage.url}
          alt={currentImage.caption}
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-contain"
        />

        {images.length > 1 && (
          <span className="absolute top-3 left-3 rounded-sm bg-black/60 px-2 py-1 text-sm text-white">
            {currentIndex + 1} of {images.length}
          </span>
        )}
      </div>
      {/* Caption, credit, and navigation */}
      <div className="mt-3 flex items-end justify-between gap-6">
        {/* Caption and photo credit */}
        <div className="flex-1">
          {currentImage.caption && (
            <p className="text-[#1A1E47] text-sm leading-relaxed">
              {currentImage.caption}
            </p>
          )}

          {currentImage.credit && (
            <p className="mt-1 text-xs text-gray-500">
              Photo: {currentImage.credit}
            </p>
          )}
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={previousImage}
              aria-label="Previous image"
              className="p-1 text-[#1A1E47] transition-opacity hover:opacity-60"
            >
              <ArrowLeft size={24} />
            </button>

            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
              className="p-1 text-[#1A1E47] transition-opacity hover:opacity-60"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        )}

              </div>
    </div>
  );
}