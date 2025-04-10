import React, { useState, useEffect } from 'react';
import renderMediaContent from '../../components/RenderMedia';
import { ArrowUpDown }  from 'lucide-react'


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

const fetchMedia = async (): Promise<MediaItem[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Return some hard-coded examples
  return [
    {
      _id: '1',
      filename: 'image1.jpg',
      originalname: 'image1.jpg',
      mimetype: 'image/jpeg',
      size: 12345,
      path: '/uploads/image1.jpg',
      url: 'https://example.com/images/image1.jpg',
      title: 'Sunset at the Beach',
      caption: 'A beautiful sunset.',
      altText: 'Sunset at the beach',
      uploadedBy: 'user123',
      dimensions: { width: 800, height: 600 },
      createdAt: '2025-04-10T08:00:00.000Z',
      updatedAt: '2025-04-10T08:00:00.000Z',
    },
    {
      _id: '2',
      filename: 'image2.png',
      originalname: 'image2.png',
      mimetype: 'image/png',
      size: 24567,
      path: '/uploads/image2.png',
      url: 'https://example.com/images/image2.png',
      title: 'Mountains',
      caption: 'Snow-capped mountains.',
      altText: 'Mountain landscape',
      uploadedBy: 'user456',
      dimensions: { width: 1024, height: 768 },
      createdAt: '2025-04-09T08:00:00.000Z',
      updatedAt: '2025-04-09T08:00:00.000Z',
    },
    {
      _id: '3',
      filename: 'document1.pdf',
      originalname: 'document1.pdf',
      mimetype: 'application/pdf',
      size: 55678,
      path: '/uploads/document1.pdf',
      url: 'https://example.com/docs/document1.pdf',
      title: 'Quarterly Report',
      caption: 'Quarterly financials for 2023.',
      altText: '',
      uploadedBy: 'user789',
      dimensions: { width: 0, height: 0 },
      createdAt: '1924-02-01T08:00:00.000Z',
      updatedAt: '1924-02-01T08:00:00.000Z',
    },
    {
      _id: '4',
      filename: 'document2.pdf',
      originalname: 'document2.pdf',
      mimetype: 'application/pdf',
      size: 55678,
      path: '/uploads/document1.pdf',
      url: 'https://example.com/docs/document2.pdf',
      title: 'Quarterly Report',
      caption: 'Quarterly financials for 2024.',
      altText: '',
      uploadedBy: 'user789',
      dimensions: { width: 0, height: 0 },
      createdAt: '2025-03-05T08:00:00.000Z',
      updatedAt: '2025-03-05T08:00:00.000Z',
    },
    {
      _id: '5',
      filename: 'archive.zip',
      originalname: 'archive.zip',
      mimetype: 'application/zip',
      size: 55678,
      path: '/uploads/archive.zip',
      url: 'https://example.com/compressed/archive.zip',
      title: 'news-1',
      caption: 'news-1',
      altText: '',
      uploadedBy: 'user789',
      dimensions: { width: 0, height: 0 },
      createdAt: '2025-04-05T08:00:00.000Z',
      updatedAt: '2025-04-05T08:00:00.000Z',
    },
  ];
};




const Library: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<'All' | 'Images' | 'Documents' | 'Archives'>('All');
  const [date, setDate] = useState<'All Dates' | 'Today' | 'Yesterday' | 'Last Month' | 'Last Year'>('All Dates');
  const [ascending, setAscending] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const fetchedMedia = await fetchMedia();
      setMedia(fetchedMedia);
    };
    fetchData();
  }, []);

  const filteredMedia = media.filter((item) => {
      // File type filter
      if (filter === 'All') {
        return true;
      } else if (filter === 'Images') {
        return item.mimetype.startsWith('image/');
      } else if (filter === 'Documents') {
        return item.mimetype === 'application/pdf';
      } else if (filter === 'Archives') {
        return item.mimetype === 'application/zip' || item.mimetype === 'application/x-rar-compressed';
      }
      return true;
  }).filter((item) => {
      // Date filter
      if (date === 'All Dates') {
          return true;
      } else if (date === 'Today') {
          const now = new Date();
          const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          todayStart.setUTCHours(0, 0, 0, 0);
          const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
          todayEnd.setUTCHours(0, 0, 0, 0);
          
          const itemDate = new Date(item.createdAt);
          return itemDate >= todayStart && itemDate < todayEnd;
      } else if (date === 'Yesterday') {
          const now = new Date();
          const yesterdayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
          yesterdayStart.setUTCHours(0, 0, 0, 0);
          const yesterdayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        
          const itemDate = new Date(item.createdAt);
          return itemDate >= yesterdayStart && itemDate < yesterdayEnd;
      } else if (date === 'Last Month') {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const itemDate = new Date(item.createdAt);
        return itemDate >= lastMonth;
      } else if (date === 'Last Year') {
          const lastYear = new Date();
          lastYear.setFullYear(lastYear.getUTCFullYear() - 1);

          const itemDate = new Date(item.createdAt);
        return itemDate >= lastYear;
      }
      return true;
  });

  const handleSort = () => {
    setAscending(!ascending);
  }

  // const now = new Date();
  // const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate()));
  // console.log('Last Month:', lastMonth.toISOString());
  return (
    
    <div className="mx-10">
      <h4 className="my-10 text-3xl tracking-wider text-nique-blue">
        Library
      </h4>

      <div className='flex flex-row mb-4 items-center'>
        <div className="relative group">
          <ArrowUpDown 
        size={20}
        className={`text-nique-blue transition-all cursor-pointer ${ascending ? '' : 'rotate-180'}`} 
        onClick={handleSort}
          />
          <div className="absolute left-1/2 -translate-x-1/8 bottom-full mb-2 px-2 py-1 bg-nique-blue text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Sort by: {ascending ? 'Oldest first' : 'Newest first'}
          </div>
        </div>

        {/* MIMEType Filter dropdown */}
        <select
          id="filter-select"
          value={filter}
          onChange={(e) =>
        setFilter(e.target.value as 'All' | 'Images' | 'Documents' | 'Archives')
          }
          className='border border-gray-300 rounded-lg p-1 mx-2'
        >
          <option value="All">All Media</option>
          <option value="Images">Images</option>
          <option value="Documents">Documents</option>
          <option value="Archives">Archives</option>
        </select>

        {/* Date Filter Dropdown */}
        <select
          id="date-select"
          value={date}
          onChange={(e) =>
        setDate(e.target.value as 'All Dates' | 'Today' | 'Yesterday' | 'Last Month' | 'Last Year')
          }
          className='border border-gray-300 rounded-lg p-1'
        >
          <option value="All">All Dates</option>
          <option value="Today">Today</option>
          <option value="Yesterday">Yesterday</option>
          <option value="Last Month">Last Month</option>
          <option value="Last Year">Last Year</option>
        </select>
      </div>

      {/* Render the filtered media */}
      <div className="flex flex-wrap gap-4">
        {[...filteredMedia].sort((a, b) => ascending 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() 
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).map((item) => (
          <div
            key={item._id}
            className="border-2 border-gray-300 rounded-xl w-[200px] flex flex-col items-center justify-center"
          >
            {renderMediaContent(item)}
            <div className="p-2 w-full">
              <p className="font-bold truncate">{item.title}</p>
              {item.caption && (
                <p className="text-sm text-gray-600 truncate">{item.caption}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
