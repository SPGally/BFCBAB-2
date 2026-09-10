import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { getArticle } from '../lib/content';

export default function NewsArticle() {
  const { id = '' } = useParams();
  const article = getArticle(id);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
          <Link
            to="/news"
            className="text-barnsley-red hover:text-[#B31329] inline-flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            All news
          </Link>
        </div>
      </div>
    );
  }

  const plainTextContent = article.summary || article.content_html.replace(/<[^>]*>/g, '');
  const description =
    plainTextContent.length > 200 ? plainTextContent.substring(0, 197) + '...' : plainTextContent;
  const articleUrl = `${window.location.origin}/news/${article.slug}`;
  const imageUrl = article.image ? `${window.location.origin}${article.image}` : null;

  return (
    <>
      <Helmet>
        <title>{article.title} - Barnsley FC Fan Advisory Board</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={articleUrl} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        <meta property="og:site_name" content="Barnsley FC Fan Advisory Board" />
        <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={description} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to News
        </Link>

        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {article.image && (
            <div className="relative h-96">
              <img src={article.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

            <div className="flex items-center gap-4 text-gray-600 mb-8">
              <time dateTime={article.published_at}>
                {format(parseISO(article.published_at), 'MMMM d, yyyy')}
              </time>
              {article.authorMember && (
                <>
                  <span>•</span>
                  <span>
                    By {article.authorMember.name}, {article.authorMember.role}
                  </span>
                </>
              )}
            </div>

            <div
              className="prose max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />
          </div>
        </article>
      </div>
    </>
  );
}
