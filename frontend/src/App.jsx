import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AvatarPage from './pages/AvatarPage';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/avatar" element={<AvatarPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
