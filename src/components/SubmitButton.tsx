import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';

const SubmitButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/submit')}
      className="fixed bottom-6 right-6 bg-barnsley-red text-white rounded-full p-4 shadow-lg hover:bg-[#B31329] transition-colors flex items-center gap-2 z-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
      aria-label="Submit your ideas"
    >
      <MessageSquarePlus className="h-6 w-6" aria-hidden="true" />
      <span className="hidden md:inline">Submit Your Ideas</span>
    </button>
  );
};

export default SubmitButton;