import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, parseISO, isBefore } from 'date-fns';
import { Calendar, ChevronLeft, MapPin, FileText, Clock } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string | null;
  rich_description: string | null;
  content: string | null;
  image_url: string | null;
  minutes_id: string | null;
  minutes?: {
    title: string;
    file_path: string;
  } | null;
}

export default function MeetingDetails() {
  const { id } = useParams();
  const [meeting, setMeeting] = React.useState<Meeting | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          minutes:minutes!fk_meeting_minutes (
            title,
            file_path
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Meeting not found');

      setMeeting(data);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Meeting not found'}
          </h1>
          <Link
            to="/meetings"
            className="text-barnsley-red hover:text-[#B31329] inline-flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Meetings
          </Link>
        </div>
      </div>
    );
  }

  const isPast = isBefore(parseISO(meeting.date), new Date());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/meetings"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Meetings
      </Link>

      <article className="bg-white rounded-lg shadow-md overflow-hidden">
        {meeting.image_url ? (
          <div className="relative h-64 lg:h-96">
            <img
              src={meeting.image_url}
              alt={meeting.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="bg-gray-100 h-32 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        <div className="p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{meeting.title}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="h-5 w-5 text-barnsley-red" />
                  <time dateTime={meeting.date} className="font-medium">
                    {format(parseISO(meeting.date), 'MMMM d, yyyy')}
                  </time>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="h-5 w-5 text-barnsley-red" />
                  <time dateTime={meeting.date} className="font-medium">
                    {format(parseISO(meeting.date), 'h:mm a')}
                  </time>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="h-5 w-5 text-barnsley-red" />
                  <span className="font-medium">{meeting.location}</span>
                </div>
              </div>

              {isPast && meeting.minutes && (
                <div className="flex items-start gap-3 md:justify-end">
                  <FileText className="h-5 w-5 text-barnsley-red flex-shrink-0" />
                  <div>
                    <h2 className="font-medium text-gray-900">Meeting Minutes</h2>
                    <a
                      href={meeting.minutes.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-barnsley-red hover:text-[#B31329] font-medium"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              )}
            </div>

            {(meeting.rich_description || meeting.description) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Overview</h2>
                {meeting.rich_description ? (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: meeting.rich_description }}
                  />
                ) : (
                  <p className="text-gray-600">{meeting.description}</p>
                )}
              </div>
            )}

            {meeting.content && (
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold mb-4">Agenda</h2>
                <div dangerouslySetInnerHTML={{ __html: meeting.content }} />
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}