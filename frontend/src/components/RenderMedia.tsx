import { File } from 'lucide-react';

interface MediaItem {
    _id: string;
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
    url: string;
    title?: string;
    caption?: string;
    altText?: string;
    uploadedBy: string;
    dimensions?: {
      width?: number;
      height?: number;
    };
    createdAt: string;
    updatedAt?: string;
}

const renderMediaContent = (item: MediaItem) => {
  if (item.mimetype.startsWith('image/')) {
    return (
      <img
        src={item.url}
        alt={item.altText || item.title || 'Untitled Image'}
        loading="lazy"
        decoding="async"
        className="w-full rounded-xl"
      />
    );
  } else if (item.mimetype === 'application/pdf') {
    return (
      <div className="w-full h-full flex flex-col">
        <iframe
          src={`${item.url}#page=1&view=FitH`}
          title={item.title || 'PDF Document'}
          className="w-full h-full border-0"
          style={{ pointerEvents: 'none' }}
        ></iframe>
      </div>
    );
  } else if (item.mimetype.startsWith('video/')) {
    return (
      <video src={item.url} controls className="w-full rounded-xl" />
    );
  } else if (item.mimetype.startsWith('audio/')) {
    return (
      <audio src={item.url} controls className="w-full rounded-xl" />
    );
  } else {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <File className="size-16 text-gray-500" />
      </div>
    );
  }
};

export default renderMediaContent;