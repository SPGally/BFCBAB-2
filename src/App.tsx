import type { RouteRecord } from 'vite-react-ssg';
import Layout from './Layout';
import Home from './pages/Home';
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
      {
        path: 'about-us',
        lazy: () => import('./pages/AboutUs').then((m) => ({ Component: m.default })),
      },
      {
        path: 'minutes',
        lazy: () => import('./pages/Minutes').then((m) => ({ Component: m.default })),
      },
      {
        path: 'meetings',
        lazy: () => import('./pages/Meetings').then((m) => ({ Component: m.default })),
      },
      {
        path: 'meetings/:id',
        lazy: () => import('./pages/MeetingDetails').then((m) => ({ Component: m.default })),
        // vite-react-ssg expects getStaticPaths to return full paths from the root,
        // including the route's own static segments (see its README's `nest/:b` example).
        getStaticPaths: () => allMeetingIds().map((id) => `meetings/${id}`),
      },
      {
        path: 'news',
        lazy: () => import('./pages/News').then((m) => ({ Component: m.default })),
      },
      {
        path: 'news/:id',
        lazy: () => import('./pages/NewsArticle').then((m) => ({ Component: m.default })),
        getStaticPaths: () => getNews().map((a) => `news/${a.slug}`),
      },
      {
        path: 'faq',
        lazy: () => import('./pages/FAQ').then((m) => ({ Component: m.default })),
      },
      {
        path: 'faq/:id',
        lazy: () => import('./pages/FAQDetails').then((m) => ({ Component: m.default })),
        getStaticPaths: () =>
          getFaqTopics().flatMap((topic) => topic.questions.map((q) => `faq/${q.id}`)),
      },
      {
        path: 'submit',
        lazy: () => import('./pages/Submit').then((m) => ({ Component: m.default })),
      },
      {
        path: 'visual-history',
        lazy: () => import('./pages/VisualHistory').then((m) => ({ Component: m.default })),
      },
    ],
  },
];
