
import React from 'react';
import {SPOTLIGHT_ARTICLES} from "@/src/common/constants.ts";
import type { Article } from '../types';

const SpotlightCard: React.FC<{ article: Omit<Article, 'summary'> }> = ({ article }) => (
    <a href={`#article/${article.id}`} className="flex items-center space-x-4 group py-3 border-b last:border-b-0 block">
        <div className="w-28 h-20 flex-shrink-0 overflow-hidden rounded-md">
            <img src={article.imageUrl} alt={article.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div>
            <h3 className="font-bold text-sm leading-snug text-gray-800 group-hover:text-blue-600 transition-colors">{article.headline}</h3>
             <div className="text-xs text-gray-400 mt-2">
                <span className="font-semibold text-red-600">{article.category}</span>
                <span className="mx-1">•</span>
                <span>{article.readTime}</span>
              </div>
        </div>
    </a>
);


const Spotlight: React.FC = () => {
  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Spotlight</h2>
        <a href="#" className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center">
          See all
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
      <div>
        {SPOTLIGHT_ARTICLES.map(article => (
            <SpotlightCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};

export default Spotlight;
