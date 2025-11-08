import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AvatarPage from './pages/AvatarPage';
import QuestsPage from './pages/QuestsPage';
import QuestCreatePage from './pages/QuestCreatePage';
import QuestDetailPage from './pages/QuestDetailPage';
import MapPage from './pages/MapPage';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/avatar" element={<AvatarPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/quests/new" element={<QuestCreatePage />} />
          <Route path="/quests/:id" element={<QuestDetailPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
