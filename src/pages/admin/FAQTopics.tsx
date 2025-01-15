import React from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Loader2, Trash2, Edit, MoveUp, MoveDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface FAQTopic {
  id: string;
  name: string;
  description: string | null;
  order_position: number;
}

export default function FAQTopics() {
  const navigate = useNavigate();
  const [topics, setTopics] = React.useState<FAQTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    description: ''
  });

  React.useEffect(() => {
    fetchTopics();
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
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Topic name is required');
      return;
    }

    setSaving(true);

    try {
      const topicData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('faq_topics')
          .update(topicData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Topic updated successfully');
      } else {
        // Get max order position
        const maxOrder = Math.max(...topics.map(t => t.order_position), -1);
        const { error } = await supabase
          .from('faq_topics')
          .insert([{ ...topicData, order_position: maxOrder + 1 }]);

        if (error) throw error;
        toast.success('Topic created successfully');
      }

      setFormData({ name: '', description: '' });
      setEditingId(null);
      fetchTopics();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (topic: FAQTopic) => {
    setEditingId(topic.id);
    setFormData({
      name: topic.name,
      description: topic.description || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this topic? This will also delete all FAQs in this topic.'
    );
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from('faq_topics')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Topic deleted successfully');
      fetchTopics();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete topic');
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = topics.findIndex(t => t.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === topics.length - 1)
    ) {
      return;
    }

    const otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentTopic = topics[currentIndex];
    const otherTopic = topics[otherIndex];

    try {
      const updates = [
        {
          id: currentTopic.id,
          order_position: otherTopic.order_position
        },
        {
          id: otherTopic.id,
          order_position: currentTopic.order_position
        }
      ];

      const { error } = await supabase
        .from('faq_topics')
        .upsert(updates);

      if (error) throw error;
      fetchTopics();
    } catch (error: any) {
      toast.error('Failed to reorder topics');
    }
  };

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
          {editingId ? 'Edit FAQ Topic' : 'Create FAQ Topic'}
        </h2>
        <button
          onClick={() => navigate('/admin/faq')}
          className="text-gray-600 hover:text-gray-900"
        >
          Back to FAQs
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Topic Name *
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-4">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', description: '' });
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
                  {editingId ? 'Update FAQ Topic' : 'Create FAQ Topic'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div>
        <h3 className="text-xl font-bold mb-4">Topics</h3>
        <div className="bg-white rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200">
            {topics.map((topic, index) => (
              <li key={topic.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{topic.name}</h4>
                    {topic.description && (
                      <p className="text-gray-600 mt-1">{topic.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMove(topic.id, 'up')}
                      disabled={index === 0}
                      className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      aria-label="Move up"
                    >
                      <MoveUp className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleMove(topic.id, 'down')}
                      disabled={index === topics.length - 1}
                      className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      aria-label="Move down"
                    >
                      <MoveDown className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(topic)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label="Edit topic"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(topic.id)}
                      className="text-red-600 hover:text-red-800"
                      aria-label="Delete topic"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {topics.length === 0 && (
              <li className="p-6 text-center text-gray-500">
                No topics yet
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}