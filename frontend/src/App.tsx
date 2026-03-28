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

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <GlassLayout>{children}</GlassLayout>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/Login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

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

        {/* Redirect empty path to login or dashboard based on status */}
        <Route path="/" element={<Navigate to="/Login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;