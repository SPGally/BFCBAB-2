import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="bg-[#E31837] text-white" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0" aria-label="Go to home page">
              <img
                src="https://www.barnsleyfc.co.uk/images/common/barnsley-fc-logo.png"
                alt="Barnsley FC Logo"
                className="h-8"
              />
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4" role="menubar">
                <Link 
                  to="/" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
                  role="menuitem"
                >
                  Home
                </Link>
                <Link 
                  to="/about-us" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
                  role="menuitem"
                >
                  About Us
                </Link>
                <Link 
                  to="/news" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
                  role="menuitem"
                >
                  News
                </Link>
                <Link 
                  to="/meetings" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
                  role="menuitem"
                >
                  Meetings
                </Link>
                <Link 
                  to="/minutes" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
                  role="menuitem"
                >
                  Minutes
                </Link>
                <Link 
                  to="/faq" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
                  role="menuitem"
                >
                  FAQ
                </Link>
                <Link 
                  to="/submit" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
                  role="menuitem"
                >
                  Submit Idea
                </Link>
              </div>
            </div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div 
        className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}
        id="mobile-menu"
        role="menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            Home
          </Link>
          <Link
            to="/about-us"
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            About Us
          </Link>
          <Link
            to="/news"
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            News
          </Link>
          <Link
            to="/meetings"
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            Meetings
          </Link>
          <Link
            to="/minutes"
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            Minutes
          </Link>
          <Link
            to="/faq"
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            FAQ
          </Link>
          <Link
            to="/submit"
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#B31329] focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            Submit Idea
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;