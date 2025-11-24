import React from 'react';

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  source: string;
  category: string;
  fetchedAt: Date;
}

// Helper to calculate time ago
const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

const NewsCard: React.FC<NewsItem> = ({ title, description, imageUrl, source, fetchedAt }) => {
  return (
    <div className="card card-hover p-0 flex-shrink-0 w-80 overflow-hidden">
      <div className="h-40 overflow-hidden">
        <img className="w-full h-full object-cover" src={imageUrl} alt={title} />
      </div>
      <div className="p-4">
        <h3 className="text-md font-semibold text-gray-800 truncate">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 h-10 overflow-hidden text-ellipsis">{description}</p>
        <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
          <span className="font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{source}</span>
          <span>{timeSince(fetchedAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;