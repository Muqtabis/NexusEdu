import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: string[]; // Changed to an array for flexibility
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');

  // 1. If no userId, they aren't logged in - send to Login
  if (!userId) {
    return <Navigate to="/Login" replace />;
  }

  // 2. If their role isn't in the allowed list - send them to their specific home
  if (!allowedRoles.includes(role || '')) {
    if (role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (role === 'teacher') return <Navigate to="/dashboard/teacher" replace />;
    return <Navigate to="/dashboard/student" replace />;
  }

  // 3. Authorized! Render the page
  return children;
};

export default ProtectedRoute;