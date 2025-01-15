import React from 'react';
import { supabase } from '../lib/supabase';
import { Mail } from 'lucide-react';

interface BoardMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  order_position: number;
}

const AboutUs = () => {
  const [members, setMembers] = React.useState<BoardMember[]>([]);

  React.useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('board_members')
      .select('*')
      .order('order_position', { ascending: true });

    if (!error && data) {
      setMembers(data);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Fan Advisory Board Members</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {members.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {member.image_url && (
              <img
                src={member.image_url}
                alt={member.name}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{member.name}</h2>
              <p className="text-barnsley-red font-medium mb-2">{member.role}</p>
              {member.email && (
                <a 
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center text-gray-600 hover:text-barnsley-red mb-4"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {member.email}
                </a>
              )}
              {member.bio && (
                <p className="text-gray-600 mt-4">{member.bio}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutUs;