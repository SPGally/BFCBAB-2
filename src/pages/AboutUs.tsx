import React from 'react';
import { supabase } from '../lib/supabase';
import { Mail, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      {/* Introduction Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-6">About the Fan Advisory Board</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="prose prose-lg max-w-none">
            <p>
              The Barnsley FC Fan Advisory Board (FAB) serves as a vital bridge between supporters and the club's leadership. 
              Established to ensure fan voices are heard at the highest level, we work collaboratively with the club to 
              enhance the supporter experience and maintain the strong connection between Barnsley FC and its community.
            </p>
            
            <p>
              Our role includes providing structured feedback on club initiatives, representing diverse fan perspectives, 
              and contributing to decisions that affect supporters. From matchday experience to ticket pricing, from 
              community engagement to long-term strategy, the FAB ensures fan interests are central to club discussions.
            </p>

            <p>
              We meet regularly with club executives and board members, maintaining open channels of communication to 
              address supporter concerns and suggestions. Our members represent various supporter groups and demographics, 
              ensuring comprehensive representation of our fan base.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 my-8">
              <h3 className="text-xl font-semibold mb-4">Have Your Say</h3>
              <p className="mb-4">
                We want to hear from you! If you have concerns, ideas, or suggestions about any aspect of supporting 
                Barnsley FC, we're here to listen and act on your behalf.
              </p>
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 bg-barnsley-red text-white px-6 py-3 rounded-md hover:bg-[#B31329] transition-colors"
              >
                Submit Your Ideas
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Board Members Section */}
      <h2 className="text-3xl font-bold mb-8">Meet Your Representatives</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {members.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {member.image_url && (
              <img
                src={member.image_url}
                alt={member.name}
                className="w-full h-80 md:h-96 lg:h-[450px] object-cover"
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