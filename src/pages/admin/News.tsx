import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Upload, Loader2, Trash2, Edit, Pin, Bold, Italic, Link as LinkIcon, Image as ImageIcon, List, ListOrdered, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import SocialShare from '../../components/SocialShare';

interface BoardMember {
  id: string;
  name: string;
  role: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  image_url: string | null;
  published: boolean;
  published_at: string | null;
  pinned: boolean;
  author_id: string | null;
  author?: BoardMember;
  created_at: string;
  updated_at: string;
}

export default function News() {
  const navigate = useNavigate();
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [boardMembers, setBoardMembers] = React.useState<BoardMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    title: '',
    content: '',
    summary: '',
    image: null as File | null,
    published: false,
    pinned: false,
    author_id: ''
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false
      })
    ],
    content: formData.content,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({
        ...prev,
        content: editor.getHTML()
      }));
    }
  });

  React.useEffect(() => {
    Promise.all([fetchNews(), fetchBoardMembers()]).finally(() => setLoading(false));
  }, []);

  const fetchBoardMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('board_members')
        .select('id, name, role')
        .order('order_position');

      if (error) throw error;
      setBoardMembers(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch board members');
    }
  };

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*, author:board_members!author_id(id, name, role)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch news articles');
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
          .from('news-images')
          .upload(fileName, formData.image);

        if (uploadError) throw uploadError;

        const { data: publicURL } = supabase.storage
          .from('news-images')
          .getPublicUrl(fileName);

        imageUrl = publicURL.publicUrl;
      }

      const newsData = {
        title: formData.title,
        content: formData.content,
        summary: formData.summary || formData.content.substring(0, 200).replace(/<[^>]*>/g, ''),
        ...(imageUrl && { image_url: imageUrl }),
        published: formData.published,
        pinned: formData.pinned,
        published_at: formData.published ? new Date().toISOString() : null,
        author_id: formData.author_id || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('news')
          .update(newsData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('News article updated successfully');
      } else {
        const { error } = await supabase
          .from('news')
          .insert([newsData]);

        if (error) throw error;
        toast.success('News article created successfully');
      }

      setFormData({ 
        title: '', 
        content: '', 
        summary: '', 
        image: null, 
        published: false,
        pinned: false,
        author_id: ''
      });
      editor?.commands.setContent('');
      setEditingId(null);
      fetchNews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save news article');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      summary: item.summary || '',
      image: null,
      published: item.published,
      pinned: item.pinned,
      author_id: item.author_id || ''
    });
    editor?.commands.setContent(item.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, imageUrl: string | null) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this news article?');
    if (!isConfirmed) return;

    try {
      if (imageUrl) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('news-images')
            .remove([fileName]);
        }
      }

      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('News article deleted successfully');
      fetchNews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete news article');
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
        {editingId ? 'Edit News Article' : 'Create News Article'}
      </h2>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
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

          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
              Summary
            </label>
            <textarea
              id="summary"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief summary of the article (optional)"
            />
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
              Content
            </label>
            <div className="prose max-w-none">
              <EditorContent editor={editor} className="min-h-[200px] border rounded-md p-4" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-barnsley-red focus:ring-barnsley-red"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Publish immediately</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-barnsley-red focus:ring-barnsley-red"
                checked={formData.pinned}
                onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Pin to top</span>
            </label>
          </div>

          <div className="flex justify-end gap-4">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ 
                    title: '', 
                    content: '', 
                    summary: '', 
                    image: null, 
                    published: false,
                    pinned: false,
                    author_id: ''
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
                  {editingId ? 'Update Article' : 'Create Article'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {editingId && formData.published && (
        <div className="mb-8">
          <SocialShare
            article={{
              title: formData.title,
              content: formData.content,
              summary: formData.summary,
              image_url: null // We don't want to include the image in admin shares
            }}
            url={`${window.location.origin}/news/${editingId}`}
          />
        </div>
      )}

      <h3 className="text-xl font-bold mb-4">News Articles</h3>
      <div className="bg-white rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200">
          {news.map((item) => (
            <li key={item.id} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Status: {item.published ? 'Published' : 'Draft'}</p>
                    {item.published_at && (
                      <p>Published: {format(new Date(item.published_at), 'MMMM d, yyyy')}</p>
                    )}
                    {item.author && (
                      <p>Author: {item.author.name} - {item.author.role}</p>
                    )}
                    {item.pinned && (
                      <p className="text-barnsley-red flex items-center gap-1">
                        <Pin className="h-4 w-4" /> Pinned
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.published && (
                    <button
                      onClick={() => navigate(`/news/${item.id}`)}
                      className="text-gray-600 hover:text-gray-800"
                      aria-label="View article"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800"
                    aria-label="Edit article"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.image_url)}
                    className="text-red-600 hover:text-red-800"
                    aria-label="Delete article"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2">{item.summary}</p>
            </li>
          ))}
          {news.length === 0 && (
            <li className="p-6 text-center text-gray-500">
              No news articles yet
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}