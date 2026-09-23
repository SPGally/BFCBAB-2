import { Link } from 'react-router-dom';
import { Rss } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1A1A1A] text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img
              src="/images/BFC-FanAdvisoryBoard.png"
              alt="Barnsley FC Fan Advisory Board"
              className="h-12 mb-4 bg-white rounded p-1.5"
            />
            <p className="text-sm text-gray-300">
              Official Fan Advisory Board of Barnsley Football Club
            </p>
            <a 
              href="/rss.xml"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white mt-4"
              title="RSS Feed"
            >
              <Rss className="h-4 w-4" />
              <span>RSS Feed</span>
            </a>
          </div>

          <nav aria-label="Primary footer navigation">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h2>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/about-us" 
                  className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/news" 
                  className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-sm"
                >
                  News
                </Link>
              </li>
              <li>
                <Link 
                  to="/meetings" 
                  className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-sm"
                >
                  Meetings
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Secondary footer navigation">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Resources</h2>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/minutes" 
                  className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-sm"
                >
                  Minutes
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-sm"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  to="/submit" 
                  className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-sm"
                >
                  Submit Ideas
                </Link>
              </li>
              <li>
                <a 
                  href="https://images.gc.barnsleyfcservices.co.uk/b9bd2a10-9ddd-11ef-b75c-91d655062e20.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-sm"
                  aria-label="Terms of Reference (opens in new tab)"
                >
                  Terms of Reference
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Contact</h2>
            <address className="text-gray-300 not-italic space-y-2">
              <p>Oakwell Stadium</p>
              <p>Grove Street</p>
              <p>Barnsley</p>
              <p>S71 1ET</p>
              <a
                href="mailto:fab@barnsleyfc.co.uk"
                className="block mt-4 text-gray-300 hover:text-white transition-colors underline"
              >
                fab@barnsleyfc.co.uk
              </a>
            </address>
            <div className="mt-6">
              <p className="text-sm text-gray-400">
                {/* text-barnsley-red on this dark background fails WCAG contrast (3.7:1, needs
                    4.5:1), so this uses the same gray as the other footer links, with an
                    underline so it doesn't rely on color alone to read as a link. */}
                For urgent matters, please use our{' '}
                <Link to="/submit" className="text-gray-300 hover:text-white transition-colors underline">
                  submission form
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p className="text-center md:text-left text-sm text-gray-300">
              © {new Date().getFullYear()} Barnsley FC Fan Advisory Board. All rights reserved.
            </p>
            <p className="text-center md:text-right text-sm text-gray-400">
              Working together for a better Barnsley FC
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;