import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: React.ReactNode; // <-- This is the magic line that fixes the 6 errors!
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('role');

  // If they are not logged in at all, kick them back to the login page
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  // If this route requires a specific role (like 'admin') and they don't have it, send them to home
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // If everything is good, render the page inside the sandwich
  return <>{children}</>;
};

export default ProtectedRoute;