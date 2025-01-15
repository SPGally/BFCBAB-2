import React from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Search, FileText, Loader2, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface Minute {
  id: string;
  title: string;
  meeting_date: string;
  file_path: string;
  content_text: string | null;
}

const Minutes = () => {
  const [minutes, setMinutes] = React.useState<Minute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    fetchMinutes();
  }, []);

  const fetchMinutes = async () => {
    const { data, error } = await supabase
      .from('minutes')
      .select('*')
      .order('meeting_date', { ascending: false });

    if (!error && data) {
      setMinutes(data);
    }
    setLoading(false);
  };

  const filteredMinutes = React.useMemo(() => {
    return minutes.filter(minute => {
      const searchLower = searchQuery.toLowerCase();
      const titleMatch = minute.title.toLowerCase().includes(searchLower);
      const dateMatch = format(new Date(minute.meeting_date), 'MMMM d, yyyy')
        .toLowerCase()
        .includes(searchLower);
      const contentMatch = minute.content_text?.toLowerCase().includes(searchLower);
      return titleMatch || dateMatch || contentMatch;
    });
  }, [minutes, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-barnsley-red" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Meeting Minutes</h1>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search minutes by title, date, or content..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-barnsley-red focus:border-barnsley-red"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredMinutes.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredMinutes.map((minute) => (
              <li key={minute.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <FileText className="h-6 w-6 text-barnsley-red" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{minute.title}</h2>
                      <p className="text-gray-600">
                        {format(new Date(minute.meeting_date), 'MMMM d, yyyy')}
                      </p>
                      {searchQuery && minute.content_text && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p className="line-clamp-2">
                            {minute.content_text}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <a
                    href={minute.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-barnsley-red text-white py-2 px-4 rounded-md hover:bg-[#B31329] transition-colors"
                  >
                    Download PDF
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {minutes.length === 0 
                ? 'No meeting minutes available' 
                : 'No minutes match your search'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Minutes;