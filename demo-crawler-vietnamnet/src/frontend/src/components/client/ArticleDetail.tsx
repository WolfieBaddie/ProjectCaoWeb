
import React, { useEffect } from 'react';
import {ALL_ARTICLES} from "@/src/common/constants.ts";
import { Article } from '../types';

interface ArticleDetailProps {
  id: string;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ id }) => {
  const article = ALL_ARTICLES.find(a => a.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!article) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Article not found</h2>
        <a href="#" className="text-red-600 hover:underline mt-4 inline-block">Return Home</a>
      </div>
    );
  }

  // Generate placeholder content if missing
  const content = article.content || `
    <p class="mb-4 text-lg leading-relaxed text-gray-700">
      ${article.summary || "In a significant development that has captured the attention of observers worldwide, recent events have unfolded with remarkable speed and consequence. As the situation continues to evolve, experts are weighing in on the potential long-term implications for the region and beyond."}
    </p>
    <p class="mb-4 text-lg leading-relaxed text-gray-700">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">The Wider Impact</h3>
    <p class="mb-4 text-lg leading-relaxed text-gray-700">
      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
    </p>
    <blockquote class="border-l-4 border-red-600 pl-4 italic my-8 text-xl text-gray-800">
      "This is a defining moment that will likely shape policy and public opinion for years to come. The resilience shown by the community is nothing short of inspiring."
    </blockquote>
    <p class="mb-4 text-lg leading-relaxed text-gray-700">
      Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?
    </p>
  `;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <a href="#" className="hover:text-red-600">Home</a>
        <span className="mx-2">/</span>
        <span className="text-red-600 font-semibold">{article.category}</span>
      </nav>

      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
        {article.headline}
      </h1>

      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
        <div className="flex items-center">
          {article.author ? (
            <img src={article.author.avatarUrl} alt={article.author.name} className="w-12 h-12 rounded-full mr-4" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center text-gray-500 font-bold">
              {article.source.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-gray-900">
                {article.author ? article.author.name : article.source}
            </div>
            <div className="text-sm text-gray-500 flex items-center">
               <span>{article.timestamp}</span>
               <span className="mx-2">•</span>
               <span>{article.readTime}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
            <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </button>
            <button className="p-2 text-gray-500 hover:text-blue-800 transition-colors">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </button>
        </div>
      </div>

      <div className="mb-8">
        {article.imageUrl && (
            <img src={article.imageUrl} alt={article.headline} className="w-full h-[400px] object-cover rounded-lg shadow-lg mb-2" />
        )}
        <p className="text-sm text-gray-500 text-right italic">Image source: {article.source}</p>
      </div>

      <div 
        className="article-content"
        dangerouslySetInnerHTML={{ __html: content }} 
      />

      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Related News</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ALL_ARTICLES.filter(a => a.category === article.category && a.id !== article.id).slice(0, 2).map(related => (
                 <a key={related.id} href={`#article/${related.id}`} className="flex items-start group">
                    <img src={related.imageUrl} className="w-24 h-24 object-cover rounded-md flex-shrink-0 mr-4" alt={related.headline} />
                    <div>
                        <h4 className="font-bold text-gray-800 group-hover:text-red-600 transition-colors leading-tight">{related.headline}</h4>
                        <span className="text-xs text-gray-500 mt-1 block">{related.timestamp}</span>
                    </div>
                 </a>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
