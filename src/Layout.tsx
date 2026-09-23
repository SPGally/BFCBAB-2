import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SubmitButton from './components/SubmitButton';
import ErrorBoundary from './components/ErrorBoundary';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-barnsley-red focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-grow">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
        <SubmitButton />
      </main>
      <Footer />
    </div>
  );
}
