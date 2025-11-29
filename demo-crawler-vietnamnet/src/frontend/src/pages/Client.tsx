// src/client/Client.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import Header from '../components/client/Header';
import NewsTicker from '../components/client/NewsTicker';
import Hero from '../components/client/Hero';
import LatestNews from '../components/client/LatestNews';
import Spotlight from '../components/client/Spotlight';
import Newsletter from '../components/client/Newsletter';
import Footer from '../components/client/Footer';
import BusinessNews from '../components/client/BusinessNews';
import CurrentEventNews from '../components/client/CurrentEventNews.tsx';
import PoliticNews from '../components/client/PoliticNews.tsx';
import ArticleDetail from '../components/client/ArticleDetail';
import SearchResults from '../components/client/SearchResults';

import {
  searchPublicArticles,
  ClientArticleListItem,
} from '@/src/api/client/clientArticleApi';

interface ClientArticle {
  id: number;
  headline: string;
  summary: string;
  imageUrl: string;
  timestamp: string;
  category: string;
  readTime: string;
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function estimateReadTime(text: string | null | undefined): string {
  if (!text) return '1 min read';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function mapDtoToClientArticle(dto: ClientArticleListItem): ClientArticle {
  return {
    id: dto.id,
    headline: dto.title,
    summary: dto.description,
    imageUrl: dto.imageUrl || '/default-article.jpg',
    timestamp: formatTimestamp(dto.createdAt),
    category: dto.categoryName,
    readTime: estimateReadTime(dto.description),
  };
}

const Client: React.FC = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  let view: 'home' | 'article' | 'search' = 'home';
  let articleId = '';
  let searchQuery = '';

  if (location.pathname.startsWith('/article/')) {
    view = 'article';
    articleId = id || '';
  } else if (location.pathname.startsWith('/search')) {
    view = 'search';
    const queryParams = new URLSearchParams(location.search);
    searchQuery = queryParams.get('q') || '';
  }

// ====== STATE & API cho danh sách bài ở Home (phân trang) ======
  const [page, setPage] = useState(0); // 0-based
  const pageSize = 9;
  const [articles, setArticles] = useState<ClientArticle[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Home: dùng searchPublicArticles, backend đã ép status = PUBLISHED
    searchPublicArticles({
      page,
      size: pageSize,
      // nếu sau này muốn có keyword / category thì set thêm ở đây
    })
        .then(pageData => {
          if (cancelled) return;

          const content: ClientArticleListItem[] = pageData?.content || [];
          setArticles(content.map(mapDtoToClientArticle));
          setTotalPages(pageData?.totalPages ?? 1);
          setTotalElements(pageData?.totalElements ?? content.length);
        })
        .catch(err => {
          console.error('Client home searchPublicArticles error', err);
          if (!cancelled) setError('Không tải được danh sách bài viết.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    return () => {
      cancelled = true;
    };
  }, [page]);


  const handlePrevPage = () => {
    setPage(p => Math.max(0, p - 1));
  };

  const handleNextPage = () => {
    setPage(p => (p + 1 < totalPages ? p + 1 : p));
  };

  return (
      <div className="bg-gray-100 font-sans min-h-screen">
        <div className="max-w-screen-xl mx-auto bg-white min-h-screen shadow-2xl">
          <Header />
          <NewsTicker />

          {view === 'home' && (
              <main className="p-4 md:p-8">
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-3">
                    <LatestNews />
                  </div>
                </div>
                <BusinessNews />
                <CurrentEventNews />
                <PoliticNews />

                {/* ====== Section mới: Danh sách bài có phân trang (dùng API admin) ====== */}
                <section className="mt-12">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Tất cả bài viết
                    </h2>
                    <span className="text-sm text-gray-500">
                  Tổng: {totalElements} bài
                </span>
                  </div>

                  {loading && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {Array.from({ length: pageSize }).map((_, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-100 rounded-lg h-64 animate-pulse"
                            />
                        ))}
                      </div>
                  )}

                  {!loading && error && (
                      <div className="bg-red-50 text-red-700 rounded-lg p-4">
                        {error}
                      </div>
                  )}

                  {!loading && !error && articles.length > 0 && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {articles.map(article => (
                              <Link
                                  key={article.id}
                                  to={`/article/${article.id}`}
                                  className="group block"
                              >
                                <div className="overflow-hidden rounded-lg mb-4">
                                  <img
                                      src={article.imageUrl}
                                      alt={article.headline}
                                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <div className="flex items-center text-xs text-gray-500 mb-2">
                                  <img
                                      src={article.sourceLogoUrl}
                                      alt={article.source}
                                      className="w-4 h-4 mr-2 object-contain"
                                  />
                                  <span className="font-medium text-gray-700">
                            {article.source}
                          </span>
                                  <span className="mx-1.5">•</span>
                                  <span>{article.timestamp}</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                                  {article.headline}
                                </h3>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                                  {article.summary ||
                                      'Click để xem chi tiết bài viết.'}
                                </p>
                                <div className="text-xs">
                          <span className="font-semibold text-red-600">
                            {article.category}
                          </span>
                                  <span className="text-gray-400 mx-1.5">•</span>
                                  <span className="text-gray-500">
                            {article.readTime}
                          </span>
                                </div>
                              </Link>
                          ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center space-x-4 mt-8">
                              <button
                                  onClick={handlePrevPage}
                                  disabled={page === 0}
                                  className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Trang trước
                              </button>
                              <span className="text-sm text-gray-600">
                        Trang <span className="font-semibold">{page + 1}</span>{' '}
                                / {totalPages || 1}
                      </span>
                              <button
                                  onClick={handleNextPage}
                                  disabled={page + 1 >= totalPages}
                                  className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Trang sau
                              </button>
                            </div>
                        )}
                      </>
                  )}
                </section>

                <Newsletter />
              </main>
          )}

          {view === 'article' && (
              <main>
                <ArticleDetail id={articleId} />
                <div className="p-4 md:p-8">
                  <Newsletter />
                </div>
              </main>
          )}

          {view === 'search' && (
              <main>
                <SearchResults query={searchQuery} />
                <div className="p-4 md:p-8">
                  <Newsletter />
                </div>
              </main>
          )}

          <Footer />
        </div>
      </div>
  );
};

export default Client;
