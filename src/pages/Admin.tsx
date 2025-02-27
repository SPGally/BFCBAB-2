import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import News from './admin/News';
import Minutes from './admin/Minutes';
import Members from './admin/Members';
import Meetings from './admin/Meetings';
import FAQ from './admin/FAQ';
import { Calendar, Newspaper, Users, FileText, MessageSquare, HelpCircle } from 'lucide-react';

const Admin = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard 1</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/admin/news"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
              <Newspaper className="h-6 w-6 text-barnsley-red" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Manage News</h2>
              <p className="text-gray-600">Add, edit, or remove news articles</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/meetings"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
              <Calendar className="h-6 w-6 text-barnsley-red" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Manage Meetings</h2>
              <p className="text-gray-600">Schedule and organize meetings</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/members"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
              <Users className="h-6 w-6 text-barnsley-red" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Board Members</h2>
              <p className="text-gray-600">Manage board member profiles</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/minutes"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
              <FileText className="h-6 w-6 text-barnsley-red" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Meeting Minutes</h2>
              <p className="text-gray-600">Upload and manage meeting minutes</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/faq"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
              <HelpCircle className="h-6 w-6 text-barnsley-red" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">FAQ</h2>
              <p className="text-gray-600">Manage frequently asked questions</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/submissions"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
              <MessageSquare className="h-6 w-6 text-barnsley-red" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Submissions</h2>
              <p className="text-gray-600">View and manage fan submissions</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8">
        <Routes>
          <Route path="news" element={<News />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="minutes" element={<Minutes />} />
          <Route path="members" element={<Members />} />
          <Route path="faq" element={<FAQ />} />
        </Routes>
      </div>
    </div>
  );
};

export default Admin;