import React from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { getMembers, getFaqTopics } from '../lib/content';
import Seo from '../components/Seo';

// The form is handled by Netlify Forms: the hidden copy of it in index.html lets Netlify
// detect the fields at build time, and this component posts the same fields back to "/"
// as form-encoded data. Notifications are configured in the Netlify UI (Forms > Settings).
const FORM_NAME = 'fab-submission';
const FAB_EMAIL = 'fab@barnsleyfc.co.uk';
// reCAPTCHA v2 checkbox. Netlify verifies the token server-side (custom keys: SITE_RECAPTCHA_KEY
// and SITE_RECAPTCHA_SECRET in the Netlify environment), which is what stops bots that post
// straight to the form endpoint. The site key is public. If it is not configured the widget is
// simply not rendered and the form works as before.
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; 'expired-callback': () => void }) => number;
      reset: (id?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

function useRecaptcha(enabled: boolean) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const widgetId = React.useRef<number | null>(null);
  const [token, setToken] = React.useState('');

  React.useEffect(() => {
    if (!enabled || !RECAPTCHA_SITE_KEY) return;
    const render = () => {
      if (boxRef.current && window.grecaptcha && widgetId.current === null) {
        widgetId.current = window.grecaptcha.render(boxRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (t: string) => setToken(t),
          'expired-callback': () => setToken(''),
        });
      }
    };
    if (window.grecaptcha) {
      render();
      return;
    }
    window.onRecaptchaLoad = render;
    if (!document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [enabled]);

  const reset = () => {
    if (window.grecaptcha && widgetId.current !== null) window.grecaptcha.reset(widgetId.current);
    setToken('');
  };
  return { boxRef, token, reset };
}

const encode = (data: Record<string, string>) =>
  Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  member: '',
  topic: '',
};

const Submit = () => {
  const members = React.useMemo(() => getMembers().filter((m) => !m.vacant), []);
  const topics = React.useMemo(() => getFaqTopics(), []);
  const [formData, setFormData] = React.useState(emptyForm);
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'sent' | 'failed'>('idle');
  const captchaEnabled = Boolean(RECAPTCHA_SITE_KEY);
  const captcha = useRecaptcha(captchaEnabled && status !== 'sent');

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? '';
  const topicName = (id: string) => topics.find((t) => t.id === id)?.name ?? '';

  const mailtoHref = () => {
    const to = members.find((m) => m.id === formData.member)?.email || FAB_EMAIL;
    const lines: string[] = [`Name: ${formData.name}`, `Email: ${formData.email}`];
    if (formData.phone) lines.push(`Mobile: ${formData.phone}`);
    if (formData.topic) lines.push(`Topic: ${topicName(formData.topic)}`);
    if (formData.member) lines.push(`For: ${memberName(formData.member)}`);
    lines.push('', formData.message);
    const body = lines.join('\n');
    return `mailto:${to}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaEnabled && !captcha.token) {
      setStatus('failed');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode({
          'form-name': FORM_NAME,
          'bot-field': '',
          ...(captchaEnabled ? { 'g-recaptcha-response': captcha.token } : {}),
          ...formData,
          member: memberName(formData.member),
          topic: topicName(formData.topic),
        }),
      });
      if (!res.ok) throw new Error(`Form post failed with ${res.status}`);
      setStatus('sent');
    } catch (err) {
      console.error(err);
      captcha.reset();
      setStatus('failed');
    }
  };

  const field =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Seo
        title="Submit Your Ideas"
        description="Send your ideas, suggestions and issues to the Barnsley FC Fan Advisory Board."
        path="/submit"
      />
      <h1 className="text-4xl font-bold mb-6">Submit Your Ideas</h1>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <p className="text-gray-700 mb-4">
          We want to hear from you! Whether you have a big idea for improving the matchday experience,
          a small suggestion about the club's operations, or a pressing issue you'd like us to raise
          with Barnsley FC, we're here to listen. No idea is too small, and no concern is too big.
        </p>
        <p className="text-gray-700">
          Please provide your contact details below so we can keep you updated on any progress or
          responses related to your submission. Together, we can make Barnsley FC the best it can be!
        </p>
      </div>

      {status === 'sent' ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Thank you!</h2>
          <p className="text-gray-600">
            Your submission has been received. A member of the Fan Advisory Board will be in touch.
          </p>
          <button
            type="button"
            onClick={() => {
              setFormData(emptyForm);
              setStatus('idle');
            }}
            className="mt-6 text-barnsley-red hover:text-[#B31329] font-medium"
          >
            Send another
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form
            name={FORM_NAME}
            method="POST"
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <input type="hidden" name="form-name" value={FORM_NAME} />
            <p className="hidden" aria-hidden="true">
              <label>
                Leave this field empty: <input name="bot-field" tabIndex={-1} autoComplete="off" />
              </label>
            </p>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                maxLength={100}
                className={field}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className={field}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={field}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                  Topic
                </label>
                <select
                  id="topic"
                  name="topic"
                  className={field}
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                >
                  <option value="">Select a topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="member" className="block text-sm font-medium text-gray-700">
                  Board Member
                </label>
                <select
                  id="member"
                  name="member"
                  className={field}
                  value={formData.member}
                  onChange={(e) => setFormData({ ...formData, member: e.target.value })}
                >
                  <option value="">Select a board member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.role} - {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                maxLength={150}
                className={field}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                maxLength={4000}
                className={field}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
              <h2 className="font-semibold mb-2">Privacy Notice:</h2>
              <p className="mb-4">
                The information you provide in this form will be used solely for the purposes of the Fan Advisory Board.
                By submitting this form, you consent to the collection, storage, and use of your data in accordance with
                the General Data Protection Regulation (GDPR).
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Your contact details will only be used to communicate with you about Fan Advisory Board matters and
                  will not be shared with third parties without your explicit consent.</li>
                <li>We will securely store your data for the duration of your involvement with the Fan Advisory Board
                  or until you request its removal.</li>
              </ul>
              <p>
                You have the right to access, amend, or delete your personal data at any time. For more information
                or to make a request, please contact <a href={`mailto:${FAB_EMAIL}`} className="text-barnsley-red underline">{FAB_EMAIL}</a>
              </p>
            </div>

            {captchaEnabled && (
              <div>
                <div ref={captcha.boxRef} />
                {status === 'failed' && !captcha.token && (
                  <p className="mt-2 text-sm text-red-700">Please tick the box above to confirm you are not a robot.</p>
                )}
              </div>
            )}

            {status === 'failed' && (!captchaEnabled || captcha.token) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                <p className="mb-2">Sorry, the form could not be sent. You can email us directly instead:</p>
                <a href={mailtoHref()} className="inline-flex items-center gap-2 font-medium text-barnsley-red hover:underline">
                  <Mail className="h-4 w-4" />
                  Open in your email app
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-barnsley-red text-white py-3 px-4 rounded-md hover:bg-[#B31329] transition-colors disabled:opacity-50"
            >
              {status === 'submitting' ? 'Sending...' : 'Submit'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Submit;
