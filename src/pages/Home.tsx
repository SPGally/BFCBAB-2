import React from 'react';
import { getNews, getUpcomingMeetings } from '../lib/content';
import { format, parseISO } from 'date-fns';
import { Newspaper, Calendar, ChevronRight, Clock, MapPin, Users, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import ResponsiveImage from '../components/ResponsiveImage';

const Home = () => {
  const news = React.useMemo(() => getNews().slice(0, 7), []);
  const meetings = React.useMemo(() => getUpcomingMeetings().slice(0, 3), []);

  const heroArticle = news[0];
  const otherArticles = news.slice(1);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Seo
        title="Barnsley FC Fan Advisory Board"
        description="News, meetings, minutes and FAQs from the Barnsley FC Fan Advisory Board — the fans' voice on club decisions."
        path="/"
        appendSiteName={false}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* News Section */}
        <section className="lg:col-span-2" aria-labelledby="news-heading">
          <div className="flex justify-between items-center mb-6">
            <h2 id="news-heading" className="text-2xl font-bold">Latest News</h2>
            <Link
              to="/news"
              className="text-barnsley-red hover:text-[#B31329] inline-flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {news.length > 0 ? (
            <div className="space-y-8">
              {/* Hero Article */}
              {heroArticle && (
                <article className="bg-white rounded-lg shadow-md overflow-hidden">
                  <Link to={`/news/${heroArticle.slug}`} className="block">
                    {heroArticle.image ? (
                      <div className="relative aspect-video group">
                        <ResponsiveImage
                          src={heroArticle.image}
                          alt=""
                          sizes="(min-width: 1024px) 800px, 100vw"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          aria-hidden="true"
                          loading="eager"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const container = target.closest('.group') as HTMLElement;
                            target.style.display = 'none';
                            container.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                            container.innerHTML = '<div class="text-gray-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z"></path></svg></div>';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 flex items-center justify-center group">
                        <Newspaper className="h-16 w-16 text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                    )}
                  </Link>
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                      {heroArticle.pinned && (
                        <span className="bg-barnsley-red text-white text-sm px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                      {heroArticle.published_at && (
                        <time className="text-gray-600" dateTime={heroArticle.published_at}>
                          {format(parseISO(heroArticle.published_at), 'MMMM d, yyyy')}
                        </time>
                      )}
                    </div>
                    <Link to={`/news/${heroArticle.slug}`}>
                      <h3 className="text-3xl font-bold mb-4 hover:text-barnsley-red">
                        {heroArticle.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 mb-6 text-lg">{heroArticle.summary}</p>
                    {heroArticle.authorMember && (
                      <p className="text-gray-500">
                        By {heroArticle.authorMember.name}, {heroArticle.authorMember.role}
                      </p>
                    )}
                  </div>
                </article>
              )}

              {/* Other Articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherArticles.map((item) => (
                  <article key={item.slug} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="flex h-full">
                      <Link to={`/news/${item.slug}`} className="w-32 flex-shrink-0">
                        {item.image ? (
                          <div className="w-full h-full group">
                            <ResponsiveImage
                              src={item.image}
                              alt=""
                              sizes="128px"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              aria-hidden="true"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const container = target.closest('.group') as HTMLElement;
                                target.style.display = 'none';
                                container.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                                container.innerHTML = '<div class="text-gray-400"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z"></path></svg></div>';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center group">
                            <Newspaper className="h-8 w-8 text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                          </div>
                        )}
                      </Link>
                      <div className="p-4 flex-1">
                        <div className="flex items-center gap-2 mb-2 text-sm">
                          {item.pinned && (
                            <span className="bg-barnsley-red text-white px-2 py-0.5 rounded text-xs">
                              Featured
                            </span>
                          )}
                          {item.published_at && (
                            <time className="text-gray-600" dateTime={item.published_at}>
                              {format(parseISO(item.published_at), 'MMM d, yyyy')}
                            </time>
                          )}
                        </div>
                        <Link to={`/news/${item.slug}`}>
                          <h3 className="font-semibold hover:text-barnsley-red line-clamp-2">
                            {item.title}
                          </h3>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No news articles available at the moment.</p>
              <p className="text-gray-500">Check back soon for updates!</p>
            </div>
          )}
        </section>

        {/* Meetings Section */}
        <section className="lg:col-span-1" aria-labelledby="meetings-heading">
          <div className="flex justify-between items-center mb-6">
            <h2 id="meetings-heading" className="text-2xl font-bold">Upcoming Meetings</h2>
            <Link
              to="/meetings"
              className="text-barnsley-red hover:text-[#B31329] inline-flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {meetings.length > 0 ? (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div 
                  key={meeting.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-4 border-l-4 border-barnsley-red">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-3 bg-red-50 rounded-lg">
                        <Calendar className="h-6 w-6 text-barnsley-red" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {meeting.title}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                            <time dateTime={meeting.date}>
                              {format(parseISO(meeting.date), 'MMMM d, yyyy')} at{' '}
                              {format(parseISO(meeting.date), 'h:mm a')}
                            </time>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{meeting.location}</span>
                          </div>
                          {meeting.description && (
                            <div className="flex items-start text-sm text-gray-600">
                              <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                              <p className="line-clamp-2">{meeting.description}</p>
                            </div>
                          )}
                        </div>
                        <Link
                          to={`/meetings/${meeting.id}`}
                          className="inline-flex items-center gap-1 text-barnsley-red hover:text-[#B31329] mt-3 text-sm font-medium"
                        >
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-block p-3 bg-red-50 rounded-lg mb-4">
                <Users className="h-8 w-8 text-barnsley-red" />
              </div>
              <p className="text-gray-900 font-medium">No upcoming meetings scheduled</p>
              <p className="text-gray-500 mt-2">Check back soon for new meeting dates</p>
            </div>
          )}

          {/* Visual History Advertisement */}
          <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative">
              <img
                src="/images/bfc-fans-visual-history-1.jpg"
                alt="Barnsley FC: The People's Visual History"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Barnsley FC: The People's Visual History</h2>
              <p className="text-gray-600 mb-6">
                Help us create a unique archive of fan memories and memorabilia. Whether you have photos, tickets, programmes, or other cherished items that tell your story of supporting the Reds, we want to preserve these precious memories for future generations.
              </p>
              <Link
                to="/visual-history"
                className="inline-flex items-center gap-2 bg-barnsley-red text-white px-6 py-3 rounded-md hover:bg-[#B31329] transition-colors"
              >
                Join The Project
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Home;