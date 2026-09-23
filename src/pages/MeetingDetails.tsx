import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar, ChevronLeft, MapPin, FileText, Clock, ExternalLink, CalendarPlus } from 'lucide-react';
import { getMinute, getUpcomingMeeting, loadMinutesContentText } from '../lib/content';
import { downloadIcsEvent } from '../lib/ics';
import Seo from '../components/Seo';

export default function MeetingDetails() {
  const { id = '' } = useParams();
  const minute = getMinute(id);
  const upcoming = minute ? undefined : getUpcomingMeeting(id);
  // content_text ships as its own chunk (see loadMinutesContentText); only fetch it for a
  // page that actually has a minute to preview.
  const [contentText, setContentText] = useState<string | null>(null);

  useEffect(() => {
    if (!minute) return;
    let cancelled = false;
    loadMinutesContentText().then((text) => {
      if (!cancelled) setContentText(text[minute.id] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [minute]);

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

  const handleAddToCalendar = () => {
    if (!upcoming) return;
    downloadIcsEvent({
      id: upcoming.id,
      title: upcoming.title,
      date: upcoming.date,
      location: upcoming.location,
      description: upcoming.description,
    });
  };

  // Trim the extracted PDF text to a readable preview.
  const preview = contentText
    ? contentText.split('\n').filter((l) => l.trim()).slice(0, 40)
    : [];

  const description = minute
    ? `Minutes from the ${format(parseISO(dateIso), 'd MMMM yyyy')} Barnsley FC Fan Advisory Board meeting at ${location}.`
    : `Upcoming Barnsley FC Fan Advisory Board meeting on ${format(parseISO(dateIso), 'd MMMM yyyy')} at ${location}.`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Seo title={title} description={description} path={`/meetings/${id}`} />
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

              {upcoming && (
                <div className="flex items-start gap-3 md:justify-end">
                  <CalendarPlus className="h-5 w-5 text-barnsley-red flex-shrink-0" />
                  <div>
                    <h2 className="font-medium text-gray-900">Calendar</h2>
                    <button
                      type="button"
                      onClick={handleAddToCalendar}
                      className="text-barnsley-red hover:text-[#B31329] font-medium inline-flex items-center gap-1"
                    >
                      Add to calendar
                      <CalendarPlus className="h-4 w-4" />
                    </button>
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
