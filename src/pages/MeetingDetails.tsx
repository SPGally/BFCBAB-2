import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar, ChevronLeft, MapPin, FileText, Clock, ExternalLink } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { getMinute, getUpcomingMeeting } from '../lib/content';

export default function MeetingDetails() {
  const { id = '' } = useParams();
  const minute = getMinute(id);
  const upcoming = minute ? undefined : getUpcomingMeeting(id);

  if (!minute && !upcoming) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Meeting not found</h1>
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

  const title = minute ? minute.title : upcoming!.title;
  const dateIso = minute ? minute.meeting_date : upcoming!.date;
  const location = minute ? minute.location : upcoming!.location;
  const showTime = !minute;

  // Trim the extracted PDF text to a readable preview.
  const preview = minute?.content_text
    ? minute.content_text.split('\n').filter((l) => l.trim()).slice(0, 40)
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>{title} - Barnsley FC Fan Advisory Board</title>
      </Helmet>
      <Link
        to="/meetings"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Meetings
      </Link>

      <article className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-100 h-32 flex items-center justify-center">
          {minute ? (
            <FileText className="h-12 w-12 text-gray-400" />
          ) : (
            <Calendar className="h-12 w-12 text-gray-400" />
          )}
        </div>

        <div className="p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{title}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="h-5 w-5 text-barnsley-red" />
                  <time dateTime={dateIso} className="font-medium">
                    {format(parseISO(dateIso), 'EEEE d MMMM yyyy')}
                  </time>
                </div>
                {showTime && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock className="h-5 w-5 text-barnsley-red" />
                    <time dateTime={dateIso} className="font-medium">
                      {format(parseISO(dateIso), 'h:mm a')}
                    </time>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="h-5 w-5 text-barnsley-red" />
                    <span className="font-medium">{location}</span>
                  </div>
                )}
              </div>

              {minute && (
                <div className="flex items-start gap-3 md:justify-end">
                  <FileText className="h-5 w-5 text-barnsley-red flex-shrink-0" />
                  <div>
                    <h2 className="font-medium text-gray-900">Meeting Minutes</h2>
                    <a
                      href={minute.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-barnsley-red hover:text-[#B31329] font-medium inline-flex items-center gap-1"
                    >
                      Read the PDF
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {upcoming?.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Overview</h2>
                <p className="text-gray-600">{upcoming.description}</p>
              </div>
            )}

            {upcoming?.agenda_html && (
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold mb-4">Agenda</h2>
                <div dangerouslySetInnerHTML={{ __html: upcoming.agenda_html }} />
              </div>
            )}

            {minute && preview.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Preview</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Text extracted automatically from the PDF. Read the PDF for the full, formatted minutes.
                </p>
                <div className="prose max-w-none text-gray-700 whitespace-pre-line text-sm bg-gray-50 rounded-lg p-4">
                  {preview.join('\n')}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
