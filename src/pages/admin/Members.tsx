import React from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Upload, Loader2, Trash2, Edit, MoveUp, MoveDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface BoardMember {
  id: string;
  name: string;
  role: string;
  email: string | null;
  bio: string | null;
  image_url: string | null;
  order_position: number;
  created_at: string;
  updated_at: string;
}

export default function Members() {
  const [members, setMembers] = React.useState<BoardMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [sortField, setSortField] = React.useState<'created_at' | 'updated_at' | 'order_position'>('order_position');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = React.useState({
    name: '',
    role: '',
    email: '',
    bio: '',
    image: null as File | null,
  });

  React.useEffect(() => {
    fetchMembers();
  }, [sortField, sortOrder]);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('board_members')
      .select('*')
      .order(sortField, { ascending: sortOrder === 'asc' });

    if (error) {
      toast.error('Failed to fetch board members');
    } else if (data) {
      setMembers(data);
    }
    setLoading(false);
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
          .from('board-members')
          .upload(fileName, formData.image);

        if (uploadError) throw uploadError;

        const { data: publicURL } = supabase.storage
          .from('board-members')
          .getPublicUrl(fileName);

        imageUrl = publicURL.publicUrl;
      }

      const memberData = {
        name: formData.name,
        role: formData.role,
        email: formData.email || null,
        bio: formData.bio || null,
        ...(imageUrl && { image_url: imageUrl })
      };

      if (editingId) {
        const { error } = await supabase
          .from('board_members')
          .update(memberData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Board member updated successfully');
      } else {
        // Get max order position
        const maxOrder = Math.max(...members.map(m => m.order_position), -1);
        const { error } = await supabase
          .from('board_members')
          .insert([{ ...memberData, order_position: maxOrder + 1 }]);

        if (error) throw error;
        toast.success('Board member added successfully');
      }

      setFormData({ name: '', role: '', email: '', bio: '', image: null });
      setEditingId(null);
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save board member');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member: BoardMember) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      role: member.role,
      email: member.email || '',
      bio: member.bio || '',
      image: null
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, imageUrl: string | null) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this board member?');
    if (!isConfirmed) return;

    try {
      if (imageUrl) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('board-members')
            .remove([fileName]);
        }
      }

      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Board member deleted successfully');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete board member');
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = members.findIndex(m => m.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === members.length - 1)
    ) {
      return;
    }

    const otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentMember = members[currentIndex];
    const otherMember = members[otherIndex];

    try {
      const updates = [
        {
          id: currentMember.id,
          order_position: otherMember.order_position
        },
        {
          id: otherMember.id,
          order_position: currentMember.order_position
        }
      ];

      const { error } = await supabase
        .from('board_members')
        .upsert(updates);

      if (error) throw error;

      fetchMembers();
    } catch (error: any) {
      toast.error('Failed to reorder board members');
    }
  };

  const toggleSort = (field: 'created_at' | 'updated_at' | 'order_position') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'order_position' ? 'asc' : 'desc');
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
        {editingId ? 'Edit Board Member' : 'Add Board Member'}
      </h2>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="space-y-4">
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
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role *
            </label>
            <input
              type="text"
              id="role"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Profile Image {editingId && '(optional)'}
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

          <div className="flex justify-end gap-4">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', role: '', email: '', bio: '', image: null });
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
                  {editingId ? 'Update Member' : 'Add Member'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Board Members</h3>
        <div className="flex gap-4">
          <button
            onClick={() => toggleSort('order_position')}
            className={`text-sm ${sortField === 'order_position' ? 'text-barnsley-red' : 'text-gray-600'}`}
          >
            Sort by Position {sortField === 'order_position' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('created_at')}
            className={`text-sm ${sortField === 'created_at' ? 'text-barnsley-red' : 'text-gray-600'}`}
          >
            Sort by Created {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('updated_at')}
            className={`text-sm ${sortField === 'updated_at' ? 'text-barnsley-red' : 'text-gray-600'}`}
          >
            Sort by Updated {sortField === 'updated_at' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200">
          {members.map((member, index) => (
            <li key={member.id} className="p-6">
              <div className="flex items-start gap-4">
                {member.image_url && (
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{member.name}</h4>
                      <p className="text-barnsley-red">{member.role}</p>
                      {member.email && (
                        <p className="text-gray-600">{member.email}</p>
                      )}
                      {member.bio && (
                        <p className="text-gray-600 mt-2">{member.bio}</p>
                      )}
                      <div className="text-sm text-gray-500 space-y-1 mt-2">
                        <p>Created: {format(new Date(member.created_at), 'MMMM d, yyyy')}</p>
                        <p>Updated: {format(new Date(member.updated_at), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMove(member.id, 'up')}
                        disabled={index === 0}
                        className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        aria-label="Move up"
                      >
                        <MoveUp className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleMove(member.id, 'down')}
                        disabled={index === members.length - 1}
                        className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        aria-label="Move down"
                      >
                        <MoveDown className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label="Edit member"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.image_url)}
                        className="text-red-600 hover:text-red-800"
                        aria-label="Delete member"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {members.length === 0 && (
            <li className="p-6 text-center text-gray-500">
              No board members yet
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}