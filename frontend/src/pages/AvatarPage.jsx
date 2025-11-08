import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AvatarEditor from '../components/AvatarEditor';

export default function AvatarPage() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="avatar-page">
      <AvatarEditor />
    </div>
  );
}
