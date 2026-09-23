import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Home from './Home';
import AboutUs from './AboutUs';
import FAQ from './FAQ';
import FAQDetails from './FAQDetails';
import Meetings from './Meetings';
import MeetingDetails from './MeetingDetails';
import Minutes from './Minutes';
import News from './News';
import NewsArticle from './NewsArticle';
import Submit from './Submit';
import VisualHistory from './VisualHistory';
import { getFaqTopics, getMinutes, getNews, getUpcomingMeetings } from '../lib/content';

const MAX_DESCRIPTION_LENGTH = 160;

function metaDescription(): string {
  return document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
}

function canonicalUrl(): string {
  return document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
}

/** Renders a page at a given path and returns the resulting <title> and meta description.
 * react-helmet-async writes straight to `document` in a DOM environment (jsdom here), so we
 * read the effect it produced rather than the Helmet context (which is only populated during
 * server rendering). */
async function renderRoute(path: string, routePath: string, element: React.ReactElement) {
  // react-helmet-async only ever adds/updates these; it never removes a stale one from a
  // previous test's render (and `cleanup()` doesn't touch `document.head`/`document.title`).
  // Reset them here so a route that fails to set its own title/meta/canonical is caught,
  // rather than silently inheriting the previous test's values and passing anyway.
  document.title = '';
  document.querySelector('meta[name="description"]')?.remove();
  document.querySelector('link[rel="canonical"]')?.remove();

  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={element} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

  // react-helmet-async defers writing to `document` to the next animation frame.
  await new Promise((resolve) => requestAnimationFrame(resolve));

  return { title: document.title, description: metaDescription(), canonical: canonicalUrl() };
}

// Every route in the sitemap: the static pages plus one entry per dynamically generated
// detail page (news articles, FAQ entries, meeting/minute detail pages), mirroring
// `getStaticPaths` in src/App.tsx.
function allRoutes(): { path: string; routePath: string; element: React.ReactElement }[] {
  const routes: { path: string; routePath: string; element: React.ReactElement }[] = [
    { path: '/', routePath: '/', element: <Home /> },
    { path: '/about-us', routePath: '/about-us', element: <AboutUs /> },
    { path: '/minutes', routePath: '/minutes', element: <Minutes /> },
    { path: '/meetings', routePath: '/meetings', element: <Meetings /> },
    { path: '/news', routePath: '/news', element: <News /> },
    { path: '/faq', routePath: '/faq', element: <FAQ /> },
    { path: '/submit', routePath: '/submit', element: <Submit /> },
    { path: '/visual-history', routePath: '/visual-history', element: <VisualHistory /> },
  ];

  for (const article of getNews()) {
    routes.push({
      path: `/news/${article.slug}`,
      routePath: '/news/:id',
      element: <NewsArticle />,
    });
  }

  for (const topic of getFaqTopics()) {
    for (const question of topic.questions) {
      routes.push({
        path: `/faq/${question.id}`,
        routePath: '/faq/:id',
        element: <FAQDetails />,
      });
    }
  }

  const meetingIds = new Set([
    ...getMinutes().map((m) => m.id),
    ...getUpcomingMeetings(new Date(0)).map((m) => m.id),
  ]);
  for (const id of meetingIds) {
    routes.push({ path: `/meetings/${id}`, routePath: '/meetings/:id', element: <MeetingDetails /> });
  }

  return routes;
}

describe('page metadata (FAB-020)', () => {
  afterEach(() => {
    cleanup();
  });

  const routes = allRoutes();

  it('has at least one route of each kind to check', () => {
    expect(routes.length).toBeGreaterThan(8);
  });

  it.each(routes.map((r) => [r.path, r] as const))(
    'renders a title, a description under 160 characters and a canonical URL for %s',
    async (path, route) => {
      const { title, description, canonical } = await renderRoute(route.path, route.routePath, route.element);

      expect(title.trim().length).toBeGreaterThan(0);
      expect(description.trim().length).toBeGreaterThan(0);
      expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
      expect(canonical).toBe(`https://fab.barnsleyfc.co.uk${path}`);
    }
  );

  it('gives no two pages the same title', async () => {
    const titles: string[] = [];
    for (const route of routes) {
      cleanup();
      const { title } = await renderRoute(route.path, route.routePath, route.element);
      titles.push(title);
    }

    expect(new Set(titles).size).toBe(titles.length);
  });

  it('sets the home page title and description exactly', async () => {
    const { title, description } = await renderRoute('/', '/', <Home />);

    expect(title).toBe('Barnsley FC Fan Advisory Board');
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
  });
});
