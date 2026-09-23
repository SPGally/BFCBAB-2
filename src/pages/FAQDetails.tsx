import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { getFaq, getMember, getMinute } from '../lib/content';
import { ChevronLeft, User, Calendar, Tag } from 'lucide-react';
import Seo from '../components/Seo';

export default function FAQDetails() {
  const { id = '' } = useParams();
  const found = getFaq(id);
  const faq = found
    ? {
        ...found.faq,
        answer: found.faq.answer_html,
        topic: { name: found.topic.name },
        author: (() => {
          const m = found.faq.author ? getMember(found.faq.author) : undefined;
          return m ? { name: m.name, role: m.role } : null;
        })(),
      }
    : null;
  const minutes = faq
    ? faq.minutes_refs.map((ref) => getMinute(ref)).filter((m): m is NonNullable<typeof m> => Boolean(m))
    : [];

  if (!faq) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            FAQ not found
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

  const plainAnswer = faq.answer.replace(/<[^>]*>/g, '').trim();
  const description =
    plainAnswer.length > 200 ? `${plainAnswer.substring(0, 197)}...` : plainAnswer;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Seo title={faq.question} description={description} path={`/faq/${id}`} />
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
                          {format(parseISO(minute.meeting_date), 'MMMM d, yyyy')}
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