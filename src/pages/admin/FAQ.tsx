import React from 'react';
import { supabase } from '../../lib/supabase';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Upload, Loader2, Trash2, Edit, MoveUp, MoveDown, Settings, Search, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';

interface BoardMember {
  id: string;
  name: string;
  role: string;
}

interface FAQTopic {
  id: string;
  name: string;
  description: string | null;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  topic_id: string;
  author_id: string | null;
  order_position: number;
  minutes_refs: string[];
  raised_by: string[];
  created_at: string;
  author?: BoardMember;
  topic?: FAQTopic;
}

export default function FAQ() {
  const [topics, setTopics] = React.useState<FAQTopic[]>([]);
  const [faqs, setFaqs] = React.useState<FAQ[]>([]);
  const [boardMembers, setBoardMembers] = React.useState<BoardMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTopics, setSelectedTopics] = React.useState<Set<string>>(new Set());
  const [formData, setFormData] = React.useState({
    question: '',
    answer: '',
    topic_id: '',
    author_id: '',
    minutes_refs: [] as string[],
    raised_by: [] as string[]
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false
      })
    ],
    content: formData.answer,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({
        ...prev,
        answer: editor.getHTML()
      }));
    }
  });

  React.useEffect(() => {
    Promise.all([
      fetchTopics(),
      fetchFAQs(),
      fetchBoardMembers()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('faq_topics')
      .select('*')
      .order('order_position');

    if (error) {
      toast.error('Failed to fetch topics');
    } else {
      setTopics(data || []);
    }
  };

  const fetchFAQs = async () => {
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        *,
        author:board_members!author_id(*),
        topic:faq_topics!topic_id(*)
      `)
      .order('order_position');

    if (error) {
      toast.error('Failed to fetch FAQs');
    } else {
      setFaqs(data || []);
    }
  };

  const fetchBoardMembers = async () => {
    const { data, error } = await supabase
      .from('board_members')
      .select('id, name, role')
      .order('order_position');

    if (error) {
      toast.error('Failed to fetch board members');
    } else {
      setBoardMembers(data || []);
    }
  };

  const handleSubmitFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const faqData = {
        question: formData.question,
        answer: formData.answer,
        topic_id: formData.topic_id,
        author_id: formData.author_id || null,
        minutes_refs: formData.minutes_refs,
        raised_by: formData.raised_by.filter(name => name.trim() !== '')
      };

      if (editingId) {
        const { error } = await supabase
          .from('faqs')
          .update(faqData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('FAQ updated successfully');
      } else {
        // Get max order position
        const maxOrder = Math.max(...faqs.map(f => f.order_position), -1);
        const { error } = await supabase
          .from('faqs')
          .insert([{ ...faqData, order_position: maxOrder + 1 }]);

        if (error) throw error;
        toast.success('FAQ created successfully');
      }

      setFormData({
        question: '',
        answer: '',
        topic_id: '',
        author_id: '',
        minutes_refs: [],
        raised_by: []
      });
      editor?.commands.setContent('');
      setEditingId(null);
      fetchFAQs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      topic_id: faq.topic_id,
      author_id: faq.author_id || '',
      minutes_refs: faq.minutes_refs || [],
      raised_by: faq.raised_by || []
    });
    editor?.commands.setContent(faq.answer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFAQ = async (id: string) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this FAQ?');
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('FAQ deleted successfully');
      fetchFAQs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete FAQ');
    }
  };

  const handleMoveFAQ = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = faqs.findIndex(f => f.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === faqs.length - 1)
    ) {
      return;
    }

    const otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentFAQ = faqs[currentIndex];
    const otherFAQ = faqs[otherIndex];

    try {
      const updates = [
        {
          id: currentFAQ.id,
          order_position: otherFAQ.order_position
        },
        {
          id: otherFAQ.id,
          order_position: currentFAQ.order_position
        }
      ];

      const { error } = await supabase
        .from('faqs')
        .upsert(updates);

      if (error) throw error;
      fetchFAQs();
    } catch (error: any) {
      toast.error('Failed to reorder FAQs');
    }
  };

  const toggleTopicFilter = (topicId: string) => {
    setSelectedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const filteredFaqs = React.useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = searchQuery === '' || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTopic = selectedTopics.size === 0 || selectedTopics.has(faq.topic_id);
      
      return matchesSearch && matchesTopic;
    });
  }, [faqs, searchQuery, selectedTopics]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-barnsley-red" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {editingId ? 'Edit FAQ' : 'Create FAQ'}
        </h2>
        <RouterLink
          to="/admin/faq/topics"
          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage Topics
        </RouterLink>
      </div>
      
      <form onSubmit={handleSubmitFAQ} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
              Topic *
            </label>
            <select
              id="topic"
              required
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
            <label htmlFor="question" className="block text-sm font-medium text-gray-700">
              Question *
            </label>
            <input
              type="text"
              id="question"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
              Answer *
            </label>
            <div className="prose max-w-none">
              <EditorContent editor={editor} className="min-h-[200px] border rounded-md p-4" />
            </div>
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700">
              Author
            </label>
            <select
              id="author"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
              value={formData.author_id}
              onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
            >
              <option value="">Select an author</option>
              {boardMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Raised By
            </label>
            <div className="space-y-2">
              {formData.raised_by.map((name, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const newNames = [...formData.raised_by];
                      newNames[index] = e.target.value;
                      setFormData({ ...formData, raised_by: newNames });
                    }}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
                    placeholder="Enter name"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newNames = formData.raised_by.filter((_, i) => i !== index);
                      setFormData({ ...formData, raised_by: newNames });
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    raised_by: [...formData.raised_by, '']
                  });
                }}
                className="text-barnsley-red hover:text-[#B31329] text-sm font-medium"
              >
                + Add Name
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    question: '',
                    answer: '',
                    topic_id: '',
                    author_id: '',
                    minutes_refs: [],
                    raised_by: []
                  });
                  editor?.commands.setContent('');
                }}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-barnsley-red text-white py-2 px-4 rounded-md hover:bg-[#B31329] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {editingId ? 'Update FAQ' : 'Create FAQ'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">FAQs</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search FAQs..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-barnsley-red focus:border-barnsley-red w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {topics.map(topic => (
            <button
              key={topic.id}
              onClick={() => toggleTopicFilter(topic.id)}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTopics.has(topic.id)
                  ? 'bg-barnsley-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tag className="h-4 w-4" />
              {topic.name}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200">
            {filteredFaqs.map((faq, index) => (
              <li key={faq.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{faq.question}</h4>
                    <div className="text-sm text-gray-600 space-y-1 mt-2">
                      <p>Topic: {faq.topic?.name}</p>
                      {faq.author && (
                        <p>Author: {faq.author.name}, {faq.author.role}</p>
                      )}
                      {faq.raised_by && faq.raised_by.length > 0 && (
                        <p>Raised by: {faq.raised_by.join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMoveFAQ(faq.id, 'up')}
                      disabled={index === 0}
                      className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      aria-label="Move up"
                    >
                      <MoveUp className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleMoveFAQ(faq.id, 'down')}
                      disabled={index === filteredFaqs.length - 1}
                      className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      aria-label="Move down"
                    >
                      <MoveDown className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEditFAQ(faq)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label="Edit FAQ"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFAQ(faq.id)}
                      className="text-red-600 hover:text-red-800"
                      aria-label="Delete FAQ"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {filteredFaqs.length === 0 && (
              <li className="p-6 text-center text-gray-500">
                {faqs.length === 0 ? 'No FAQs yet' : 'No FAQs match your filters'}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}