import React from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Newspaper, Calendar, ChevronRight, Clock, MapPin, Users, Info } from 'lucide-react';
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

interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string | null;
}

const Home = () => {
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [meetings, setMeetings] = React.useState<Meeting[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([fetchNews(), fetchMeetings()]).finally(() => setLoading(false));
  }, []);

  const fetchNews = async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('news')
      .select('*, author:board_members!author_id(name, role)')
      .eq('published', true)
      .or(`published_at.is.null,published_at.lte.${now}`)
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(7);

    if (!error && data) {
      setNews(data);
    }
  };

  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(3);

    if (!error) {
      setMeetings(data || []);
    }
  };

  const heroArticle = news[0];
  const otherArticles = news.slice(1);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-busy="true">
        <div className="animate-pulse" aria-label="Loading content">
          <div className="h-96 bg-gray-200 rounded-lg mb-12"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-barnsley-red text-white rounded-lg p-8 mb-12" role="banner">
        <h1 className="text-4xl font-bold mb-4">Barnsley FC Fan Advisory Board</h1>
        <p className="text-xl">Your voice in shaping the future of our club</p>
      </div>

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
                  <Link to={`/news/${heroArticle.id}`} className="block">
                    {heroArticle.image_url ? (
                      <div className="relative h-96 group">
                        <img
                          src={heroArticle.image_url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          aria-hidden="true"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                            target.parentElement!.innerHTML = '<div class="text-gray-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z"></path></svg></div>';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-96 bg-gray-100 flex items-center justify-center group">
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
                    <Link to={`/news/${heroArticle.id}`}>
                      <h3 className="text-3xl font-bold mb-4 hover:text-barnsley-red">
                        {heroArticle.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 mb-6 text-lg">{heroArticle.summary}</p>
                    {heroArticle.author && (
                      <p className="text-gray-500">
                        By {heroArticle.author.name}, {heroArticle.author.role}
                      </p>
                    )}
                  </div>
                </article>
              )}

              {/* Other Articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherArticles.map((item) => (
                  <article key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="flex h-full">
                      <Link to={`/news/${item.id}`} className="w-32 flex-shrink-0">
                        {item.image_url ? (
                          <div className="w-full h-full group">
                            <img
                              src={item.image_url}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              aria-hidden="true"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                                target.parentElement!.innerHTML = '<div class="text-gray-400"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z"></path></svg></div>';
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
                        <Link to={`/news/${item.id}`}>
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

        {/* Upcoming Meetings Section */}
        <section aria-labelledby="meetings-heading" className="space-y-6">
          <div className="flex justify-between items-center">
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
        </section>
      </div>
    </main>
  );
};

export default Home;