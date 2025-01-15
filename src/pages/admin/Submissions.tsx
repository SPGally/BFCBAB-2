import React from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Loader2, User, Mail, Phone, MessageSquare, Clock, Tag, Edit, Save, X, AlertCircle, Search, Filter } from 'lucide-react';
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

interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  assignee_id: string | null;
  assigned_to_club: boolean;
  topic_id: string | null;
  notes: Array<{
    id: string;
    text: string;
    created_at: string;
    created_by: string;
    type: 'manual' | 'status' | 'assignment';
  }>;
  created_at: string;
  assignee?: BoardMember;
  topic?: FAQTopic;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_for_info', label: 'Waiting for Info' },
  { value: 'contact_user', label: 'Contact User' },
  { value: 'sent_to_club', label: 'Sent to Club' },
  { value: 'complete', label: 'Complete' }
];

export default function Submissions() {
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [boardMembers, setBoardMembers] = React.useState<BoardMember[]>([]);
  const [topics, setTopics] = React.useState<FAQTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [newNote, setNewNote] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTopics, setSelectedTopics] = React.useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = React.useState<Set<string>>(new Set());
  const [editData, setEditData] = React.useState({
    status: '',
    assignee_id: '',
    assigned_to_club: false,
    topic_id: ''
  });

  React.useEffect(() => {
    Promise.all([
      fetchSubmissions(), 
      fetchBoardMembers(),
      fetchTopics()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignee:board_members!assignee_id(*),
        topic:faq_topics!topic_id(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch submissions');
      console.error('Error fetching submissions:', error);
    } else if (data) {
      setSubmissions(data);
    }
  };

  const fetchBoardMembers = async () => {
    const { data, error } = await supabase
      .from('board_members')
      .select('id, name, role')
      .order('order_position');

    if (error) {
      toast.error('Failed to fetch board members');
      console.error('Error fetching board members:', error);
    } else if (data) {
      setBoardMembers(data);
    }
  };

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('faq_topics')
      .select('id, name')
      .order('order_position');

    if (error) {
      toast.error('Failed to fetch topics');
      console.error('Error fetching topics:', error);
    } else if (data) {
      setTopics(data);
    }
  };

  const filteredSubmissions = React.useMemo(() => {
    return submissions.filter(submission => {
      const matchesSearch = searchQuery === '' || 
        submission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTopic = selectedTopics.size === 0 || 
        (submission.topic_id && selectedTopics.has(submission.topic_id));
      
      const matchesStatus = selectedStatuses.size === 0 || 
        selectedStatuses.has(submission.status);
      
      return matchesSearch && matchesTopic && matchesStatus;
    });
  }, [submissions, searchQuery, selectedTopics, selectedStatuses]);

  const getStatusChangeNote = (status: string) => {
    const statusLabel = statusOptions.find(s => s.value === status)?.label;
    return `Status changed to "${statusLabel}"`;
  };

  const getAssignmentChangeNote = (assigneeId: string | null, assignedToClub: boolean) => {
    const assignee = boardMembers.find(m => m.id === assigneeId);
    if (assignedToClub) {
      return 'Assigned to Barnsley FC';
    }
    return assignee ? `Assigned to ${assignee.name} (${assignee.role})` : 'Unassigned';
  };

  const handleEdit = (submission: Submission) => {
    setEditingId(submission.id);
    setEditData({
      status: submission.status,
      assignee_id: submission.assignee_id || '',
      assigned_to_club: submission.assigned_to_club,
      topic_id: submission.topic_id || ''
    });
  };

  const handleSave = async (id: string) => {
    try {
      const submission = submissions.find(s => s.id === id);
      if (!submission) return;

      const notes = [...(submission.notes || [])];

      // Add status change note if status changed
      if (submission.status !== editData.status) {
        notes.push({
          id: crypto.randomUUID(),
          text: getStatusChangeNote(editData.status),
          created_at: new Date().toISOString(),
          created_by: 'System',
          type: 'status'
        });
      }

      // Add assignment change note if assignment changed
      if (submission.assignee_id !== editData.assignee_id || 
          submission.assigned_to_club !== editData.assigned_to_club) {
        notes.push({
          id: crypto.randomUUID(),
          text: getAssignmentChangeNote(editData.assignee_id, editData.assigned_to_club),
          created_at: new Date().toISOString(),
          created_by: 'System',
          type: 'assignment'
        });
      }

      const { error } = await supabase
        .from('submissions')
        .update({
          status: editData.status,
          assignee_id: editData.assignee_id || null,
          assigned_to_club: editData.assigned_to_club,
          topic_id: editData.topic_id || null,
          notes
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Submission updated successfully');
      fetchSubmissions();
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to update submission');
      console.error('Error updating submission:', error);
    }
  };

  const handleAddNote = async (submissionId: string) => {
    if (!newNote.trim()) return;

    try {
      const note = {
        id: crypto.randomUUID(),
        text: newNote.trim(),
        created_at: new Date().toISOString(),
        created_by: 'Admin', // TODO: Use actual user name
        type: 'manual' as const
      };

      const submission = submissions.find(s => s.id === submissionId);
      const notes = [...(submission?.notes || []), note];

      const { error } = await supabase
        .from('submissions')
        .update({ notes })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success('Note added successfully');
      setNewNote('');
      fetchSubmissions();
    } catch (error) {
      toast.error('Failed to add note');
      console.error('Error adding note:', error);
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

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-barnsley-red" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Fan Submissions</h1>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search submissions..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-barnsley-red focus:border-barnsley-red"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Topic filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Topic</h3>
            <div className="flex flex-wrap gap-2">
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
          </div>

          {/* Status filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  onClick={() => toggleStatusFilter(status.value)}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatuses.has(status.value)
                      ? 'bg-barnsley-red text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-6">
        {filteredSubmissions.map((submission) => (
          <div key={submission.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Submission details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{submission.subject}</h2>
                  <time className="text-sm text-gray-500" dateTime={submission.created_at}>
                    {format(new Date(submission.created_at), 'PPp')}
                  </time>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{submission.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${submission.email}`} className="hover:text-barnsley-red">
                      {submission.email}
                    </a>
                  </div>

                  {submission.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${submission.phone}`} className="hover:text-barnsley-red">
                        {submission.phone}
                      </a>
                    </div>
                  )}

                  {submission.topic && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Tag className="h-4 w-4" />
                      <span>{submission.topic.name}</span>
                    </div>
                  )}

                  <div className="mt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Message</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{submission.message}</p>
                  </div>
                </div>
              </div>

              {/* Right column - Status, Assignment & Notes */}
              <div>
                <div className="mb-6">
                  {editingId === submission.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Topic
                        </label>
                        <select
                          value={editData.topic_id}
                          onChange={(e) => setEditData({ ...editData, topic_id: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
                        >
                          <option value="">Select a topic</option>
                          {topics.map(topic => (
                            <option key={topic.id} value={topic.id}>
                              {topic.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign to
                        </label>
                        <div className="space-y-2">
                          <select
                            value={editData.assignee_id}
                            onChange={(e) => setEditData({ 
                              ...editData, 
                              assignee_id: e.target.value,
                              assigned_to_club: false
                            })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
                            disabled={editData.assigned_to_club}
                          >
                            <option value="">Select board member</option>
                            {boardMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.name} - {member.role}
                              </option>
                            ))}
                          </select>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editData.assigned_to_club}
                              onChange={(e) => setEditData({
                                ...editData,
                                assigned_to_club: e.target.checked,
                                assignee_id: e.target.checked ? '' : editData.assignee_id
                              })}
                              className="rounded border-gray-300 text-barnsley-red focus:ring-barnsley-red"
                            />
                            <span className="text-sm text-gray-700">Assign to Barnsley FC</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSave(submission.id)}
                          className="px-3 py-2 bg-barnsley-red text-white rounded-md hover:bg-[#B31329]"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {statusOptions.find(s => s.value === submission.status)?.label}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEdit(submission)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>

                      {submission.assignee && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>
                            Assigned to {submission.assignee.name} ({submission.assignee.role})
                          </span>
                        </div>
                      )}

                      {submission.assigned_to_club && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>Assigned to Barnsley FC</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Audit Log</h3>
                  <div className="space-y-4">
                    <div className="border-l-2 border-gray-200 pl-4 space-y-4">
                      {submission.notes
                        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((note) => (
                          <div 
                            key={note.id} 
                            className={`relative bg-gray-50 rounded-lg p-3 ${
                              note.type === 'status' 
                                ? 'border-l-4 border-yellow-400'
                                : note.type === 'assignment'
                                  ? 'border-l-4 border-blue-400'
                                  : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {note.type === 'status' && (
                                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              )}
                              {note.type === 'assignment' && (
                                <User className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-gray-600 text-sm whitespace-pre-wrap">{note.text}</p>
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                  <span className={`font-medium ${
                                    note.type === 'system' ? 'text-gray-400' : 'text-gray-700'
                                  }`}>
                                    {note.created_by}
                                  </span>
                                  <span>•</span>
                                  <time dateTime={note.created_at}>
                                    {format(new Date(note.created_at), 'PPp')}
                                  </time>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note..."
                        className="flex-1 border-gray-300 rounded-md focus:border-barnsley-red focus:ring-barnsley-red"
                      />
                      <button
                        onClick={() => handleAddNote(submission.id)}
                        disabled={!newNote.trim()}
                        className="bg-barnsley-red text-white px-4 py-2 rounded-md hover:bg-[#B31329] transition-colors disabled:opacity-50"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredSubmissions.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {submissions.length === 0 
                ? 'No submissions yet' 
                : 'No submissions match your filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}