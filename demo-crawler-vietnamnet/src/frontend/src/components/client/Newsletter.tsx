
import React from 'react';

const Newsletter: React.FC = () => {
  return (
    <section className="mt-16 py-12 bg-gray-50 rounded-lg text-center">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign up for our newsletter</h2>
        <p className="text-gray-600 mb-6">Be the first to know about the latest news, updates and more.</p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="flex-grow px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow" 
          />
          <button 
            type="submit" 
            className="bg-red-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
