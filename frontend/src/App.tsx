import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GlassLayout from './layouts/GlassLayout';

// 1. IMPORT THE NEW PAGES HERE
import Signup from './pages/Signup'; 
import LoginMock from './pages/LoginMock';

import StudentDashboard from './pages/dashboard/StudentDashboard';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AgentChat from './pages/agents/AgentChat';

// IMPORT THE NEW EVENTS PAGE 📅
import SchoolEvents from './pages/dashboard/SchoolEvents';

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <GlassLayout>{children}</GlassLayout>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (No Layout) */}
        <Route path="/" element={<LoginMock />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes (With GlassLayout) */}
        <Route path="/dashboard/student" element={<LayoutWrapper><StudentDashboard /></LayoutWrapper>} />
        <Route path="/dashboard/teacher" element={<LayoutWrapper><TeacherDashboard /></LayoutWrapper>} />
        <Route path="/dashboard/admin" element={<LayoutWrapper><AdminDashboard /></LayoutWrapper>} />
        
        <Route path="/agents" element={<LayoutWrapper><AgentChat /></LayoutWrapper>} />
        
        {/* 👇 WE REPLACED THE PLACEHOLDER WITH OUR NEW EVENTS PAGE */}
        <Route path="/schedule" element={<LayoutWrapper><SchoolEvents /></LayoutWrapper>} />
        
        <Route path="/profile" element={<LayoutWrapper><div className="p-10 text-center text-slate-500">Profile Page</div></LayoutWrapper>} />
      </Routes>
    </Router>
  );
}

export default App;