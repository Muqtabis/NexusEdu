import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GlassLayout from './layouts/GlassLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Signup from './pages/Signup'; 
import Login from './pages/Login';
import Profile from './pages/Profile';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AgentChat from './pages/agents/AgentChat';
import SchoolEvents from './pages/dashboard/SchoolEvents';
import TeacherBuilder from './pages/dashboard/TeacherBuilder'; // <-- Added LMS Builder
import CoursePlayer from './pages/CoursePlayer'; // <-- Added Course Player
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <GlassLayout>{children}</GlassLayout>
);

// 🚦 The Smart Traffic Cop: Sorts users when they hit the root URL "/"
const RootRedirect = () => {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');

  if (!userId) return <Navigate to="/login" replace />; // Not logged in? Go to Login.

  // Logged in? Go to your specific dashboard!
  if (role === 'admin') return <Navigate to="/dashboard/admin" replace />;
  if (role === 'teacher') return <Navigate to="/dashboard/teacher" replace />;
  return <Navigate to="/dashboard/student" replace />; // Default for students
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 🚦 Smart Redirect Route */}
        <Route path="/" element={<RootRedirect />} />

        {/* 🛡️ Protected Student Routes */}
        <Route path="/dashboard/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <LayoutWrapper><StudentDashboard /></LayoutWrapper>
          </ProtectedRoute>
        } />

        {/* 🛡️ Protected Teacher Routes */}
        <Route path="/dashboard/teacher" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <LayoutWrapper><TeacherDashboard /></LayoutWrapper>
          </ProtectedRoute>
        } />

        {/* 🛡️ NEW: LMS Teacher Course Builder Route */}
        <Route path="/teacher/build" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <LayoutWrapper><TeacherBuilder /></LayoutWrapper>
          </ProtectedRoute>
        } />

        {/* 🛡️ Protected Admin Routes */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <LayoutWrapper><AdminDashboard /></LayoutWrapper>
          </ProtectedRoute>
        } />

        {/* 🛡️ Shared Protected Routes (All roles can access) */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <LayoutWrapper><Profile /></LayoutWrapper>
          </ProtectedRoute>
        } />
        
        <Route path="/agents" element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <LayoutWrapper><AgentChat /></LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/schedule" element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <LayoutWrapper><SchoolEvents /></LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/player/:courseId" element={
  <ProtectedRoute allowedRoles={['student']}>
    <LayoutWrapper><CoursePlayer /></LayoutWrapper>
  </ProtectedRoute>
} />
      </Routes>
    </Router>
  );
}

export default App;