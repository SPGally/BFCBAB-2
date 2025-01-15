import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string | null;
  minutes_id: string | null;
  minutes?: {
    title: string;
    file_path: string;
  } | null;
}

export default function Meetings() {
  const [upcomingMeetings, setUpcomingMeetings] = React.useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = React.useState<Meeting[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const now = new Date().toISOString();
      
      // Fetch upcoming meetings
      const { data: upcoming, error: upcomingError } = await supabase
        .from('meetings')
        .select(`
          id,
          title,
          date,
          location,
          description,
          minutes_id,
          minutes:minutes!fk_meeting_minutes (
            title,
            file_path
          )
        `)
        .gte('date', now)
        .order('date', { ascending: true });

      if (upcomingError) throw upcomingError;

      // Fetch past meetings
      const { data: past, error: pastError } = await supabase
        .from('meetings')
        .select(`
          id,
          title,
          date,
          location,
          description,
          minutes_id,
          minutes:minutes!fk_meeting_minutes (
            title,
            file_path
          )
        `)
        .lt('date', now)
        .order('date', { ascending: false });

      if (pastError) throw pastError;

      setUpcomingMeetings(upcoming || []);
      setPastMeetings(past || []);
      setError(null);
    } catch (error: any) {
      console.error('Error in fetchMeetings:', error);
      setError('Failed to load meetings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-barnsley-red" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Meetings</h1>

      {/* Upcoming Meetings */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Upcoming Meetings</h2>
        <div className="space-y-6">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{meeting.title}</h3>
                    <div className="space-y-2 text-gray-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <time dateTime={meeting.date}>
                          {format(parseISO(meeting.date), 'MMMM d, yyyy')} at{' '}
                          {format(parseISO(meeting.date), 'h:mm a')}
                        </time>
                      </p>
                      <p>Location: {meeting.location}</p>
                      {meeting.description && (
                        <p className="text-sm mt-2">{meeting.description}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/meetings/${meeting.id}`}
                    className="flex items-center gap-1 text-barnsley-red hover:text-[#B31329]"
                  >
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No upcoming meetings scheduled</p>
              <p className="text-gray-500 mt-2">Check back soon for new meeting dates</p>
            </div>
          )}
        </div>
      </section>

      {/* Past Meetings */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Past Meetings</h2>
        <div className="space-y-6">
          {pastMeetings.length > 0 ? (
            pastMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{meeting.title}</h3>
                    <div className="space-y-2 text-gray-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <time dateTime={meeting.date}>
                          {format(parseISO(meeting.date), 'MMMM d, yyyy')} at{' '}
                          {format(parseISO(meeting.date), 'h:mm a')}
                        </time>
                      </p>
                      <p>Location: {meeting.location}</p>
                      {meeting.minutes && (
                        <p>
                          <a
                            href={meeting.minutes.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-barnsley-red hover:text-[#B31329]"
                          >
                            View Minutes
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/meetings/${meeting.id}`}
                    className="flex items-center gap-1 text-barnsley-red hover:text-[#B31329]"
                  >
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No past meetings found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}