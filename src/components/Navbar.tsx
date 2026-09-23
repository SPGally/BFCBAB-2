import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header>
      {/* Top utility bar */}
      <div className="bg-barnsley-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-10 items-center text-white text-sm">
            <div className="flex space-x-4">
              <a href="https://www.barnsleyfc.co.uk" className="hover:text-gray-200">CLUB SITE</a>
              <a href="https://tickets.barnsleyfc.co.uk" className="hover:text-gray-200">TICKETS</a>
              <a href="https://shop.barnsleyfc.co.uk" className="hover:text-gray-200">STORE</a>
              <a href="https://www.barnsleyfc.co.uk/app" className="hover:text-gray-200">APP</a>
            </div>
            <div>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0" aria-label="Go to home page">
                <img
                  src="/images/BFC-FanAdvisoryBoard.png"
                  alt="Barnsley FC Fan Advisory Board"
                  className="h-16 md:h-20 w-auto"
                />
              </Link>
              <div className="hidden md:block ml-10">
                {/* Plain links, not an ARIA `menu` widget: there's no roving-tabindex/arrow-key
                    handling here, so `role="menubar"`/`"menuitem"` would promise keyboard
                    behaviour this markup doesn't provide. */}
                <div className="flex items-baseline space-x-4">
                  <Link
                    to="/"
                    className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-barnsley-red transition-colors uppercase"
                  >
                    Home
                  </Link>
                  <Link
                    to="/about-us"
                    className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-barnsley-red transition-colors uppercase"
                  >
                    About Us
                  </Link>
                  <Link
                    to="/news"
                    className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-barnsley-red transition-colors uppercase"
                  >
                    News
                  </Link>
                  <Link
                    to="/meetings"
                    className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-barnsley-red transition-colors uppercase"
                  >
                    Meetings
                  </Link>
                  <Link
                    to="/minutes"
                    className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-barnsley-red transition-colors uppercase"
                  >
                    Minutes
                  </Link>
                  <Link
                    to="/faq"
                    className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-barnsley-red transition-colors uppercase"
                  >
                    FAQ
                  </Link>
                  <Link
                    to="/visual-history"
                    className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-barnsley-red transition-colors uppercase"
                  >
                    People's Visual History
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-900 hover:text-barnsley-red focus:outline-none"
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
                aria-label={isOpen ? 'Close main menu' : 'Open main menu'}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div id="mobile-menu" className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-white border-t border-gray-200`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Mobile utility links */}
            <div className="border-b border-gray-200 pb-2 mb-2">
              <a href="https://www.barnsleyfc.co.uk" className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase">
                Club Site
              </a>
              <a href="https://tickets.barnsleyfc.co.uk" className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase">
                Tickets
              </a>
              <a href="https://shop.barnsleyfc.co.uk" className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase">
                Store
              </a>
              <a href="https://www.barnsleyfc.co.uk/app" className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase">
                App
              </a>
            </div>
            
            {/* Mobile main navigation */}
            <Link
              to="/"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/about-us"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            <Link
              to="/news"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase"
              onClick={() => setIsOpen(false)}
            >
              News
            </Link>
            <Link
              to="/meetings"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase"
              onClick={() => setIsOpen(false)}
            >
              Meetings
            </Link>
            <Link
              to="/minutes"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase"
              onClick={() => setIsOpen(false)}
            >
              Minutes
            </Link>
            <Link
              to="/faq"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </Link>
            <Link
              to="/visual-history"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-barnsley-red uppercase"
              onClick={() => setIsOpen(false)}
            >
              People's Visual History
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;