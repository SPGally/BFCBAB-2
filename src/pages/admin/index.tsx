import React from 'react';
import { Routes, Route } from 'react-router-dom';
import News from './News';
import Minutes from './Minutes';
import Members from './Members';
import Meetings from './Meetings';
import FAQ from './FAQ';
import FAQTopics from './FAQTopics';
import Submissions from './Submissions';
import Settings from './Settings';
import AdminDashboard from './AdminDashboard';

const Admin = () => {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="news" element={<News />} />
      <Route path="meetings" element={<Meetings />} />
      <Route path="minutes" element={<Minutes />} />
      <Route path="members" element={<Members />} />
      <Route path="faq" element={<FAQ />} />
      <Route path="faq/topics" element={<FAQTopics />} />
      <Route path="submissions" element={<Submissions />} />
      <Route path="settings" element={<Settings />} />
    </Routes>
  );
};

export default Admin;