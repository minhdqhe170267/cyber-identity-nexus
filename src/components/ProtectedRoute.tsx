import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
