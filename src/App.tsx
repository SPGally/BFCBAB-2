import type { RouteRecord } from 'vite-react-ssg';
import Layout from './Layout';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Minutes from './pages/Minutes';
import Submit from './pages/Submit';
import NewsArticle from './pages/NewsArticle';
import News from './pages/News';
import Meetings from './pages/Meetings';
import MeetingDetails from './pages/MeetingDetails';
import FAQ from './pages/FAQ';
import FAQDetails from './pages/FAQDetails';
import VisualHistory from './pages/VisualHistory';
import { getFaqTopics, getMinutes, getNews, getUpcomingMeetings } from './lib/content';

// Every meeting id that /meetings/:id can resolve, past (minutes) and upcoming, regardless
// of date, so a static page is generated for every one of them.
function allMeetingIds(): string[] {
  const minuteIds = getMinutes().map((m) => m.id);
  const upcomingIds = getUpcomingMeetings(new Date(0)).map((m) => m.id);
  return [...new Set([...minuteIds, ...upcomingIds])];
}

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about-us', element: <AboutUs /> },
      { path: 'minutes', element: <Minutes /> },
      { path: 'meetings', element: <Meetings /> },
      {
        path: 'meetings/:id',
        element: <MeetingDetails />,
        // vite-react-ssg expects getStaticPaths to return full paths from the root,
        // including the route's own static segments (see its README's `nest/:b` example).
        getStaticPaths: () => allMeetingIds().map((id) => `meetings/${id}`),
      },
      { path: 'news', element: <News /> },
      {
        path: 'news/:id',
        element: <NewsArticle />,
        getStaticPaths: () => getNews().map((a) => `news/${a.slug}`),
      },
      { path: 'faq', element: <FAQ /> },
      {
        path: 'faq/:id',
        element: <FAQDetails />,
        getStaticPaths: () =>
          getFaqTopics().flatMap((topic) => topic.questions.map((q) => `faq/${q.id}`)),
      },
      { path: 'submit', element: <Submit /> },
      { path: 'visual-history', element: <VisualHistory /> },
    ],
  },
];
