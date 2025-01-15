import React from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, Search, Tag, User, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

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
  author: {
    name: string;
    role: string;
  } | null;
  minutes_refs: string[];
  raised_by: string[];
  created_at: string;
}

export default function FAQ() {
  const [topics, setTopics] = React.useState<FAQTopic[]>([]);
  const [faqs, setFaqs] = React.useState<FAQ[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedTopics, setExpandedTopics] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTopics, setSelectedTopics] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([fetchTopics(), fetchFAQs()]).finally(() => setLoading(false));
  }, []);

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('faq_topics')
      .select('*')
      .order('order_position');

    if (error) {
      setError('Failed to load FAQ topics');
      console.error('Error fetching topics:', error);
    } else {
      setTopics(data || []);
    }
  };

  const fetchFAQs = async () => {
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        *,
        author:board_members!author_id(name, role)
      `)
      .order('order_position');

    if (error) {
      setError('Failed to load FAQs');
      console.error('Error fetching FAQs:', error);
    } else {
      setFaqs(data || []);
    }
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
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

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTopic = selectedTopics.size === 0 || selectedTopics.has(faq.topic_id);
    
    return matchesSearch && matchesTopic;
  });

  const faqsByTopic = topics.reduce((acc, topic) => {
    acc[topic.id] = filteredFaqs.filter(faq => faq.topic_id === topic.id);
    return acc;
  }, {} as Record<string, FAQ[]>);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search FAQs..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-barnsley-red focus:border-barnsley-red"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Topic filters */}
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

      {/* FAQ sections by topic */}
      <div className="space-y-6">
        {topics.map(topic => {
          const topicFaqs = faqsByTopic[topic.id] || [];
          if (topicFaqs.length === 0) return null;

          return (
            <div key={topic.id}>
              <button
                onClick={() => toggleTopic(topic.id)}
                className="w-full flex items-center justify-between bg-barnsley-red text-white p-6 rounded-t-lg hover:bg-[#B31329] transition-colors"
              >
                <div>
                  <h2 className="text-2xl font-bold">{topic.name}</h2>
                  {topic.description && (
                    <p className="text-white/90 mt-2">{topic.description}</p>
                  )}
                </div>
                {expandedTopics.has(topic.id) ? (
                  <ChevronUp className="h-6 w-6" />
                ) : (
                  <ChevronDown className="h-6 w-6" />
                )}
              </button>

              {expandedTopics.has(topic.id) && (
                <div className="bg-white rounded-b-lg shadow-md divide-y divide-gray-100">
                  {topicFaqs.map(faq => (
                    <div key={faq.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <Link to={`/faq/${faq.id}`} className="block group">
                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-barnsley-red transition-colors">
                          {faq.question}
                        </h3>
                      </Link>
                      <div className="mt-3 prose prose-sm max-w-none text-gray-600 line-clamp-3 relative">
                        <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent" />
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {faq.author && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>
                                {faq.author.name}, {faq.author.role}
                              </span>
                            </div>
                          )}
                        </div>
                        <Link
                          to={`/faq/${faq.id}`}
                          className="inline-flex items-center gap-2 text-barnsley-red hover:text-[#B31329] font-medium text-sm group"
                        >
                          Read full answer
                          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No FAQs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}