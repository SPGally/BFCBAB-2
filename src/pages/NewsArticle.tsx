import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import SocialShare from '../components/SocialShare';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  image_url: string | null;
  published_at: string;
  author_id: string | null;
  author?: {
    name: string;
    role: string;
  } | null;
}

export default function NewsArticle() {
  const { id } = useParams();
  const [article, setArticle] = React.useState<NewsArticle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*, author:board_members!author_id(*)')
        .eq('id', id)
        .eq('published', true)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Article not found');

      setArticle(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-barnsley-red" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Article not found'}
          </h1>
          <Link
            to="/"
            className="text-barnsley-red hover:text-[#B31329] inline-flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Strip HTML tags from content for meta description
  const plainTextContent = article.summary || article.content.replace(/<[^>]*>/g, '');
  const description = plainTextContent.length > 200 
    ? plainTextContent.substring(0, 197) + '...'
    : plainTextContent;

  const articleUrl = `${window.location.origin}/news/${id}`;

  return (
    <>
      <Helmet>
        {/* Standard meta tags */}
        <title>{article.title} - Barnsley FC Fan Advisory Board</title>
        <meta name="description" content={description} />

        {/* Open Graph meta tags */}
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={articleUrl} />
        {article.image_url && <meta property="og:image" content={article.image_url} />}
        <meta property="og:site_name" content="Barnsley FC Fan Advisory Board" />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content={article.image_url ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={description} />
        {article.image_url && <meta name="twitter:image" content={article.image_url} />}
        <meta name="twitter:site" content="@BarnsleyFC" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {article.image_url && (
            <div className="relative h-96">
              <img
                src={article.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
            
            <div className="flex items-center gap-4 text-gray-600 mb-8">
              <time dateTime={article.published_at}>
                {format(new Date(article.published_at), 'MMMM d, yyyy')}
              </time>
              {article.author && (
                <>
                  <span>•</span>
                  <span>
                    By {article.author.name}, {article.author.role}
                  </span>
                </>
              )}
            </div>

            <div 
              className="prose max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <SocialShare article={article} url={articleUrl} />
          </div>
        </article>
      </div>
    </>
  );
}