import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, RequireAuth } from './lib/auth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Minutes from './pages/Minutes';
import Admin from './pages/admin';
import Login from './pages/admin/Login';
import Submit from './pages/Submit';
import NewsArticle from './pages/NewsArticle';
import News from './pages/News';
import Meetings from './pages/Meetings';
import MeetingDetails from './pages/MeetingDetails';
import FAQ from './pages/FAQ';
import FAQDetails from './pages/FAQDetails';
import SubmitButton from './components/SubmitButton';
import ErrorBoundary from './components/ErrorBoundary';
import VisualHistory from './pages/VisualHistory';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <main className="flex-grow">
            <ErrorBoundary>
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
                <Route path="/admin/login" element={<Login />} />
                <Route
                  path="/admin/*"
                  element={
                    <RequireAuth>
                      <Admin />
                    </RequireAuth>
                  }
                />
                <Route path="/visual-history" element={<VisualHistory />} />
              </Routes>
            </ErrorBoundary>
            <SubmitButton />
          </main>
          <Footer />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;