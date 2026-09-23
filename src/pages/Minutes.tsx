import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Search, FileText, MapPin, ExternalLink } from 'lucide-react';
import { getMinutes, loadMinutesContentText, CLUB_MINUTES_URL } from '../lib/content';
import Seo from '../components/Seo';

const Minutes = () => {
  const minutes = React.useMemo(() => getMinutes(), []);
  const [searchQuery, setSearchQuery] = React.useState('');
  // content_text ships as its own chunk (see loadMinutesContentText); only fetch it once
  // the visitor actually starts searching.
  const [contentText, setContentText] = React.useState<Record<string, string> | null>(null);

  React.useEffect(() => {
    if (!searchQuery.trim() || contentText) return;
    let cancelled = false;
    loadMinutesContentText().then((text) => {
      if (!cancelled) setContentText(text);
    });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, contentText]);

  const filteredMinutes = React.useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase();
    if (!searchLower) return minutes;
    return minutes.filter((minute) => {
      const titleMatch = minute.title.toLowerCase().includes(searchLower);
      const dateMatch = format(parseISO(minute.meeting_date), 'MMMM d, yyyy')
        .toLowerCase()
        .includes(searchLower);
      const locationMatch = minute.location.toLowerCase().includes(searchLower);
      const contentMatch = contentText?.[minute.id]?.toLowerCase().includes(searchLower) ?? false;
      return titleMatch || dateMatch || locationMatch || contentMatch;
    });
  }, [minutes, searchQuery, contentText]);

  const snippet = (text: string | null, query: string) => {
    if (!text) return null;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return null;
    const start = Math.max(0, idx - 80);
    const end = Math.min(text.length, idx + query.length + 120);
    return `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ')}${end < text.length ? '…' : ''}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Seo
        title="Meeting Minutes"
        description="Signed-off minutes from every Barnsley FC Fan Advisory Board meeting, searchable by date, location and content."
        path="/minutes"
      />
      <h1 className="text-4xl font-bold mb-4">Meeting Minutes</h1>
      <p className="text-gray-600 mb-8">
        Minutes are published once they have been signed off by the Fan Advisory Board and the club.
        They are also available on the{' '}
        <a
          href={CLUB_MINUTES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-barnsley-red hover:text-[#B31329] underline"
        >
          official Barnsley FC website
        </a>
        .
      </p>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search minutes by date, location, or content..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-barnsley-red focus:border-barnsley-red"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search minutes"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {filteredMinutes.length} of {minutes.length} sets of minutes
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredMinutes.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredMinutes.map((minute) => (
              <li key={minute.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <FileText className="h-6 w-6 text-barnsley-red" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-1">
                        <Link to={`/meetings/${minute.id}`} className="hover:text-barnsley-red">
                          {minute.title}
                        </Link>
                      </h2>
                      <p className="text-gray-600">
                        <time dateTime={minute.meeting_date}>
                          {format(parseISO(minute.meeting_date), 'EEEE d MMMM yyyy')}
                        </time>
                      </p>
                      {minute.location && (
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {minute.location}
                        </p>
                      )}
                      {searchQuery.trim() &&
                        snippet(contentText?.[minute.id] ?? null, searchQuery.trim()) && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {snippet(contentText?.[minute.id] ?? null, searchQuery.trim())}
                          </p>
                        )}
                    </div>
                  </div>
                  <a
                    href={minute.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-barnsley-red text-white py-2 px-4 rounded-md hover:bg-[#B31329] transition-colors whitespace-nowrap"
                  >
                    Read PDF
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {minutes.length === 0 ? 'No meeting minutes available' : 'No minutes match your search'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Minutes;
