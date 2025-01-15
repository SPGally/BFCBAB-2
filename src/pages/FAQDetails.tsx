import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ChevronLeft, User, Calendar, Tag } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  topic_id: string;
  author: {
    name: string;
    role: string;
  } | null;
  topic: {
    name: string;
  };
  minutes_refs: string[];
  raised_by: string[];
  created_at: string;
}

interface Minute {
  id: string;
  title: string;
  file_path: string;
  meeting_date: string;
}

export default function FAQDetails() {
  const { id } = useParams();
  const [faq, setFaq] = React.useState<FAQ | null>(null);
  const [minutes, setMinutes] = React.useState<Minute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchFAQ();
  }, [id]);

  React.useEffect(() => {
    if (faq?.minutes_refs?.length > 0) {
      fetchMinutes(faq.minutes_refs);
    }
  }, [faq]);

  const fetchFAQ = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select(`
          *,
          author:board_members!author_id(name, role),
          topic:faq_topics!topic_id(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('FAQ not found');

      setFaq(data);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMinutes = async (minuteIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('minutes')
        .select('id, title, file_path, meeting_date')
        .in('id', minuteIds);

      if (error) throw error;
      setMinutes(data || []);
    } catch (error: any) {
      console.error('Error fetching minutes:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !faq) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'FAQ not found'}
          </h1>
          <Link
            to="/faq"
            className="text-barnsley-red hover:text-[#B31329] inline-flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to FAQs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/faq"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to FAQs
      </Link>

      <article className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="h-5 w-5 text-barnsley-red" />
            <span className="text-gray-600">{faq.topic.name}</span>
          </div>

          <h1 className="text-3xl font-bold mb-6">{faq.question}</h1>

          <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: faq.answer }} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-lg p-6">
            <div className="space-y-4">
              {faq.author && (
                <div className="flex items-center gap-3 text-gray-600">
                  <User className="h-5 w-5 text-barnsley-red" />
                  <div>
                    <div className="font-medium">Answered by</div>
                    <div>{faq.author.name}, {faq.author.role}</div>
                  </div>
                </div>
              )}
              {faq.raised_by && faq.raised_by.length > 0 && (
                <div className="text-gray-600">
                  <div className="font-medium mb-2">Raised by</div>
                  <ul className="list-disc list-inside space-y-1">
                    {faq.raised_by.map((name, index) => (
                      <li key={index}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {minutes.length > 0 && (
              <div>
                <h2 className="font-medium text-gray-900 mb-3">Referenced in Minutes</h2>
                <ul className="space-y-3">
                  {minutes.map(minute => (
                    <li key={minute.id} className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-barnsley-red flex-shrink-0" />
                      <div>
                        <time className="text-sm text-gray-600">
                          {format(new Date(minute.meeting_date), 'MMMM d, yyyy')}
                        </time>
                        <a
                          href={minute.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-barnsley-red hover:text-[#B31329]"
                        >
                          {minute.title}
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}