import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SubmitButton from './components/SubmitButton';
import ErrorBoundary from './components/ErrorBoundary';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
        <SubmitButton />
      </main>
      <Footer />
    </div>
  );
}
