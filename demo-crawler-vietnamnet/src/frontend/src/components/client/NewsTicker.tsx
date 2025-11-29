
import React from 'react';
import {TICKER_NEWS} from "@/src/common/constants.ts";

const NewsTicker: React.FC = () => {
  return (
    <div className="bg-red-50 border-y border-red-200">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-2 flex items-center overflow-hidden">
        <span className="flex-shrink-0 text-red-600 font-bold text-sm mr-4">News Update:</span>
        <div className="flex-grow text-sm text-gray-700 whitespace-nowrap">
          {TICKER_NEWS.map((item, index) => (
            <React.Fragment key={index}>
              <span>{item}</span>
              {index < TICKER_NEWS.length - 1 && <span className="mx-4 text-gray-300">•</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
