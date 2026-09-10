import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar, ChevronRight, FileText, MapPin } from 'lucide-react';
import { getUpcomingMeetings, getPastMeetings } from '../lib/content';

export default function Meetings() {
  const upcomingMeetings = React.useMemo(() => getUpcomingMeetings(), []);
  const pastMeetings = React.useMemo(() => getPastMeetings(), []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Meetings</h1>

      {/* Upcoming Meetings */}
      <section className="mb-12" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="text-2xl font-bold mb-6">Upcoming Meetings</h2>
        <div className="space-y-6">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{meeting.title}</h3>
                    <div className="space-y-2 text-gray-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <time dateTime={meeting.date}>
                          {format(parseISO(meeting.date), 'EEEE d MMMM yyyy')} at{' '}
                          {format(parseISO(meeting.date), 'h:mm a')}
                        </time>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {meeting.location}
                      </p>
                      {meeting.description && <p className="text-sm mt-2">{meeting.description}</p>}
                    </div>
                  </div>
                  <Link
                    to={`/meetings/${meeting.id}`}
                    className="flex items-center gap-1 text-barnsley-red hover:text-[#B31329] whitespace-nowrap"
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
      <section aria-labelledby="past-heading">
        <div className="flex items-baseline justify-between mb-6">
          <h2 id="past-heading" className="text-2xl font-bold">Past Meetings</h2>
          <Link to="/minutes" className="text-barnsley-red hover:text-[#B31329] inline-flex items-center gap-1">
            Search all minutes
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-4">
          {pastMeetings.length > 0 ? (
            pastMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      <Link to={`/meetings/${meeting.id}`} className="hover:text-barnsley-red">
                        {meeting.title}
                      </Link>
                    </h3>
                    <div className="space-y-1 text-gray-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <time dateTime={meeting.meeting_date}>
                          {format(parseISO(meeting.meeting_date), 'EEEE d MMMM yyyy')}
                        </time>
                      </p>
                      {meeting.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          {meeting.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <a
                      href={meeting.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-barnsley-red hover:text-[#B31329]"
                    >
                      <FileText className="h-4 w-4" />
                      Minutes (PDF)
                    </a>
                    <Link
                      to={`/meetings/${meeting.id}`}
                      className="flex items-center gap-1 text-barnsley-red hover:text-[#B31329] whitespace-nowrap"
                    >
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
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
