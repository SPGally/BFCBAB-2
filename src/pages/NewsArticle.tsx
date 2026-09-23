import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import { getArticle } from '../lib/content';
import { buildBreadcrumbListJsonLd, buildNewsArticleJsonLd } from '../lib/jsonld';
import Seo from '../components/Seo';
import ResponsiveImage from '../components/ResponsiveImage';

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
    plainTextContent.length > 160 ? plainTextContent.substring(0, 157) + '...' : plainTextContent;
  const articleJsonLd = buildNewsArticleJsonLd(article, article.authorMember);
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'News', path: '/news' },
    { name: article.title, path: `/news/${article.slug}` },
  ]);

  return (
    <>
      <Seo
        title={article.title}
        description={description}
        path={`/news/${article.slug}`}
        image={article.image}
        type="article"
        markdownPath={`/news/${article.slug}.md`}
        jsonLd={[articleJsonLd, breadcrumbJsonLd]}
      />

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
            <div className="relative aspect-video">
              <ResponsiveImage
                src={article.image}
                alt=""
                sizes="(min-width: 1024px) 896px, 100vw"
                className="w-full h-full object-cover"
                loading="eager"
              />
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
