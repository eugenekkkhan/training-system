import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from './Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
