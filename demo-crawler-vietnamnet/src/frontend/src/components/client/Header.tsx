// src/components/client/Header.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {NAV_LINKS} from "@/src/common/constants.ts";

const Header: React.FC = () => {
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      // Điều hướng sang trang search dùng react-router-dom
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/');
  };

  const handleNavClick = (e: React.MouseEvent, keyword: string) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  return (
      <header className="bg-[#282828] text-white sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 relative">
            <div className="flex-shrink-0">
              <a
                  href="/"
                  onClick={handleLogoClick}
                  className="text-2xl font-bold block"
              >
                NewsHub
              </a>
            </div>

            <nav
                className={`hidden md:block ${
                    isSearchOpen
                        ? 'opacity-0 pointer-events-none'
                        : 'opacity-100'
                } transition-opacity duration-200`}
            >
            </nav>

            <div className="flex items-center space-x-4">
              <div
                  className={`absolute right-12 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                      isSearchOpen
                          ? 'w-64 opacity-100'
                          : 'w-0 opacity-0 overflow-hidden'
                  }`}
              >
                <form onSubmit={handleSearchSubmit}>
                  <input
                      type="text"
                      placeholder="Search news..."
                      className="w-full bg-gray-700 text-white rounded-full px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      autoFocus={isSearchOpen}
                  />
                </form>
              </div>

              <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200 z-10"
                  aria-label="Search"
              >
                {isSearchOpen ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                )}
              </button>

              <button className="md:hidden p-2 rounded-full hover:bg-gray-700 transition-colors duration-200">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
  );
};

export default Header;
