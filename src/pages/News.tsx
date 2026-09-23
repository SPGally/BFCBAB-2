import React from 'react';
import { format, parseISO } from 'date-fns';
import { Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getNews } from '../lib/content';
import Seo from '../components/Seo';

const ITEMS_PER_PAGE = 10;

export default function News() {
  const news = React.useMemo(() => getNews(), []);
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(news.length / ITEMS_PER_PAGE));
  const pageItems = news.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Seo
        title="News"
        description="News and updates from the Barnsley FC Fan Advisory Board."
        path="/news"
      />
      <h1 className="text-4xl font-bold mb-8">News</h1>

      <div className="space-y-8">
        {pageItems.map((article) => (
          <article key={article.slug} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {article.image ? (
                <div className="md:w-64 h-48 md:h-auto">
                  <Link to={`/news/${article.slug}`} aria-label={article.title}>
                    <img
                      src={article.image}
                      alt=""
                      className="w-full h-full object-cover"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              ) : (
                <div className="md:w-64 h-48 md:h-auto bg-gray-100 flex items-center justify-center">
                  <Newspaper className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div className="flex-1 p-6">
                <div className="flex items-center gap-2 mb-4">
                  {article.pinned && (
                    <span className="bg-barnsley-red text-white text-sm px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                  <time className="text-gray-600" dateTime={article.published_at}>
                    {format(parseISO(article.published_at), 'MMMM d, yyyy')}
                  </time>
                </div>
                <Link to={`/news/${article.slug}`}>
                  <h2 className="text-2xl font-semibold mb-3 hover:text-barnsley-red">
                    {article.title}
                  </h2>
                </Link>
                <p className="text-gray-600 mb-4">{article.summary}</p>
                {article.authorMember && (
                  <p className="text-sm text-gray-500">
                    By {article.authorMember.name}, {article.authorMember.role}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
        {news.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No news articles available at the moment.</p>
            <p className="text-gray-500">Check back soon for updates!</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  currentPage === i + 1
                    ? 'bg-barnsley-red text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
