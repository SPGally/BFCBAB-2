import React from 'react';
import { supabase } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Upload, Loader2, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string | null;
  rich_description: string | null;
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function Meetings() {
  const [meetings, setMeetings] = React.useState<Meeting[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    content: '',
    image: null as File | null
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false
      })
    ],
    content: formData.description,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({
        ...prev,
        description: editor.getHTML()
      }));
    }
  });

  React.useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = null;
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('meetings')
          .upload(fileName, formData.image);

        if (uploadError) throw uploadError;

        const { data: publicURL } = supabase.storage
          .from('meetings')
          .getPublicUrl(fileName);

        imageUrl = publicURL.publicUrl;
      }

      const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();

      const meetingData = {
        title: formData.title,
        date: dateTime,
        location: formData.location,
        description: editor?.getText() || null, // Plain text for backward compatibility
        rich_description: formData.description || null, // Rich text content
        content: formData.content || null,
        ...(imageUrl && { image_url: imageUrl })
      };

      if (editingId) {
        const { error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Meeting updated successfully');
      } else {
        const { error } = await supabase
          .from('meetings')
          .insert([meetingData]);

        if (error) throw error;
        toast.success('Meeting created successfully');
      }

      setFormData({
        title: '',
        date: '',
        time: '',
        location: '',
        description: '',
        content: '',
        image: null
      });
      editor?.commands.setContent('');
      setEditingId(null);
      fetchMeetings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save meeting');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (meeting: Meeting) => {
    const date = new Date(meeting.date);
    setEditingId(meeting.id);
    setFormData({
      title: meeting.title,
      date: format(date, 'yyyy-MM-dd'),
      time: format(date, 'HH:mm'),
      location: meeting.location,
      description: meeting.rich_description || meeting.description || '',
      content: meeting.content || '',
      image: null
    });
    editor?.commands.setContent(meeting.rich_description || meeting.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, imageUrl: string | null) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this meeting?');
    if (!isConfirmed) return;

    try {
      if (imageUrl) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('meetings')
            .remove([fileName]);
        }
      }

      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Meeting deleted successfully');
      fetchMeetings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete meeting');
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
      <h2 className="text-2xl font-bold mb-6">
        {editingId ? 'Edit Meeting' : 'Schedule Meeting'}
      </h2>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date *
              </label>
              <input
                type="date"
                id="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                Time *
              </label>
              <input
                type="time"
                id="time"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location *
            </label>
            <input
              type="text"
              id="location"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Featured Image
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFormData({ ...formData, image: e.target.files[0] });
                }
              }}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-barnsley-red file:text-white
                hover:file:bg-[#B31329]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="prose max-w-none">
              <EditorContent editor={editor} className="min-h-[200px] border rounded-md p-4" />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: '',
                    date: '',
                    time: '',
                    location: '',
                    description: '',
                    content: '',
                    image: null
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
                  {editingId ? 'Update Meeting' : 'Schedule Meeting'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <h3 className="text-xl font-bold mb-4">All Meetings</h3>
      <div className="bg-white rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200">
          {meetings.map((meeting) => (
            <li key={meeting.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{meeting.title}</h4>
                  <dl className="mt-2 space-y-1 text-sm text-gray-600">
                    <div>
                      <dt className="inline font-medium">Date: </dt>
                      <dd className="inline">
                        {format(parseISO(meeting.date), 'MMMM d, yyyy')}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">Time: </dt>
                      <dd className="inline">
                        {format(parseISO(meeting.date), 'h:mm a')}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">Location: </dt>
                      <dd className="inline">{meeting.location}</dd>
                    </div>
                    {meeting.rich_description && (
                      <div className="mt-2">
                        <dt className="font-medium">Description:</dt>
                        <dd className="mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: meeting.rich_description }} />
                      </div>
                    )}
                  </dl>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(meeting)}
                    className="text-blue-600 hover:text-blue-800"
                    aria-label="Edit meeting"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(meeting.id, meeting.image_url)}
                    className="text-red-600 hover:text-red-800"
                    aria-label="Delete meeting"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {meetings.length === 0 && (
            <li className="p-6 text-center text-gray-500">
              No meetings scheduled
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}