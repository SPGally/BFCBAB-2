import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SubmitButton from './components/SubmitButton';
import ErrorBoundary from './components/ErrorBoundary';

// Each page is its own chunk, fetched only when the visitor navigates there.
const Home = lazy(() => import('./pages/Home'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Minutes = lazy(() => import('./pages/Minutes'));
const Submit = lazy(() => import('./pages/Submit'));
const NewsArticle = lazy(() => import('./pages/NewsArticle'));
const News = lazy(() => import('./pages/News'));
const Meetings = lazy(() => import('./pages/Meetings'));
const MeetingDetails = lazy(() => import('./pages/MeetingDetails'));
const FAQ = lazy(() => import('./pages/FAQ'));
const FAQDetails = lazy(() => import('./pages/FAQDetails'));
const VisualHistory = lazy(() => import('./pages/VisualHistory'));

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <ErrorBoundary>
            <Suspense fallback={<div className="py-24" aria-hidden="true" />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/minutes" element={<Minutes />} />
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/meetings/:id" element={<MeetingDetails />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<NewsArticle />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/faq/:id" element={<FAQDetails />} />
                <Route path="/submit" element={<Submit />} />
                <Route path="/visual-history" element={<VisualHistory />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <SubmitButton />
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
