import React from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  image_url: string | null;
  published_at: string | null;
  pinned: boolean;
  author?: {
    name: string;
    role: string;
  } | null;
}

const ITEMS_PER_PAGE = 10;

export default function News() {
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchNews();
  }, [currentPage]);

  const fetchNews = async () => {
    try {
      const now = new Date().toISOString();

      // Get total count of published articles that are either not scheduled or scheduled for now or earlier
      const { count } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('published', true)
        .or(`published_at.is.null,published_at.lte.${now}`);

      setTotalCount(count || 0);

      // Fetch paginated news
      const { data, error } = await supabase
        .from('news')
        .select('*, author:board_members!author_id(name, role)')
        .eq('published', true)
        .or(`published_at.is.null,published_at.lte.${now}`)
        .order('pinned', { ascending: false })
        .order('published_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      setNews(data || []);
      setError(null);
    } catch (error: any) {
      setError('Failed to load news articles');
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">News</h1>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {news.map((article) => (
              <article key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {article.image_url ? (
                    <div className="md:w-64 h-48 md:h-auto">
                      <Link to={`/news/${article.id}`}>
                        <img
                          src={article.image_url}
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
                      {article.published_at && (
                        <time className="text-gray-600" dateTime={article.published_at}>
                          {format(new Date(article.published_at), 'MMMM d, yyyy')}
                        </time>
                      )}
                    </div>
                    <Link to={`/news/${article.id}`}>
                      <h2 className="text-2xl font-semibold mb-3 hover:text-barnsley-red">
                        {article.title}
                      </h2>
                    </Link>
                    <p className="text-gray-600 mb-4">{article.summary}</p>
                    {article.author && (
                      <p className="text-sm text-gray-500">
                        By {article.author.name}, {article.author.role}
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}