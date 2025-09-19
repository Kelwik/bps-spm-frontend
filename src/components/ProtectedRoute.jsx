import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Memuat sesi...</div>; // Atau tampilkan spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
export default ProtectedRoute;
