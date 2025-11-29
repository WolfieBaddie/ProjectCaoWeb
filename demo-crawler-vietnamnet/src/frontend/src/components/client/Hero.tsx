
import React from 'react';
import {HERO_ARTICLE, SIDEBAR_ARTICLES} from "@/src/common/constants.ts";

const Hero: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Article */}
      <div className="lg:col-span-2 relative rounded-lg overflow-hidden h-[500px] flex items-end group">
        <img src={HERO_ARTICLE.imageUrl} alt={HERO_ARTICLE.headline} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="relative p-8 w-full md:w-3/5">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                <div className="flex items-center mb-2">
                    <img src={HERO_ARTICLE.sourceLogoUrl} alt={HERO_ARTICLE.source} className="w-6 h-6 mr-2 object-contain" />
                    <span className="font-semibold text-gray-800 text-sm">{HERO_ARTICLE.source}</span>
                    <span className="text-gray-500 text-sm mx-2">•</span>
                    <span className="text-gray-500 text-sm">{HERO_ARTICLE.timestamp}</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                    <a href={`#article/${HERO_ARTICLE.id}`} className="hover:text-red-600 transition-colors">
                        {HERO_ARTICLE.headline}
                    </a>
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                    {HERO_ARTICLE.summary} <a href={`#article/${HERO_ARTICLE.id}`} className="text-blue-600 font-semibold hover:underline">Read More</a>
                </p>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Aug 03, 2023</span>
                    <div className="flex space-x-2">
                        <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                        <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Sidebar News */}
      <div className="space-y-4">
        {SIDEBAR_ARTICLES.map(article => (
          <a key={article.id} href={`#article/${article.id}`} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors block">
            <img src={article.imageUrl} alt={article.headline} className="w-24 h-24 object-cover rounded-md flex-shrink-0"/>
            <div>
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <img src={article.sourceLogoUrl} alt={article.source} className="w-4 h-4 mr-1.5 object-contain" />
                <span className="font-medium text-gray-700">{article.source}</span>
                <span className="mx-1">•</span>
                <span>{article.timestamp}</span>
              </div>
              <h3 className="font-bold text-sm leading-snug text-gray-800 hover:text-blue-600">{article.headline}</h3>
              <div className="text-xs text-gray-400 mt-2">
                <span>{article.category}</span>
                <span className="mx-1">•</span>
                <span>{article.readTime}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Hero;
