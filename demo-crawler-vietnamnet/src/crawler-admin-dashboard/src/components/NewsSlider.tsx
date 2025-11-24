import React from 'react';
import NewsCard, { NewsItem } from './NewsCard.tsx';

interface NewsSliderProps {
    category: string;
    newsItems: NewsItem[];
}

const NewsSlider: React.FC<NewsSliderProps> = ({ category, newsItems }) => {
    return (
        <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-700 capitalize">
                {category}
            </h2>
            <div className="flex space-x-6 overflow-x-auto pb-4 -mx-1 px-1">
                {newsItems.map(item => (
                    <NewsCard key={item.id} {...item} />
                ))}
                {/* Add a placeholder for better scroll feel on the right edge */}
                <div className="flex-shrink-0 w-1"></div>
            </div>
        </section>
    );
}

export default NewsSlider;