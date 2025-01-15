import React from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface BoardMember {
  id: string;
  name: string;
  role: string;
}

interface FAQTopic {
  id: string;
  name: string;
}

const Submit = () => {
  const [members, setMembers] = React.useState<BoardMember[]>([]);
  const [topics, setTopics] = React.useState<FAQTopic[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    member_id: '',
    topic_id: ''
  });

  React.useEffect(() => {
    Promise.all([fetchMembers(), fetchTopics()]);
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('board_members')
      .select('id, name, role')
      .order('order_position');

    if (!error && data) {
      setMembers(data);
    }
  };

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('faq_topics')
      .select('id, name')
      .order('order_position');

    if (!error && data) {
      setTopics(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from('submissions')
      .insert([formData]);

    if (!error) {
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        subject: '', 
        message: '', 
        member_id: '',
        topic_id: ''
      });
      toast.success('Thank you for your submission! We will be in touch soon.');
    } else {
      toast.error('There was an error submitting your form. Please try again.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-6">Submit Your Ideas</h1>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <p className="text-gray-700 mb-4">
          We want to hear from you! Whether you have a big idea for improving the matchday experience,
          a small suggestion about the club's operations, or a pressing issue you'd like us to raise
          with Barnsley FC, we're here to listen. No idea is too small, and no concern is too big.
        </p>
        <p className="text-gray-700 mb-4">
          Please provide your contact details below so we can keep you updated on any progress or
          responses related to your submission. Together, we can make Barnsley FC the best it can be!
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
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
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
                value={formData.topic_id}
                onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
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
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
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
              rows={6}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            <h3 className="font-semibold mb-2">Privacy Notice:</h3>
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
              or to make a request, please contact <a href="mailto:fab@barnsleyfc.co.uk" className="text-barnsley-red hover:underline">fab@barnsleyfc.co.uk</a>
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-barnsley-red text-white py-3 px-4 rounded-md hover:bg-[#B31329] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Submit;