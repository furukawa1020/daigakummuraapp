import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AvatarPage from './pages/AvatarPage';
import QuestsPage from './pages/QuestsPage';
import QuestCreatePage from './pages/QuestCreatePage';
import QuestDetailPage from './pages/QuestDetailPage';
import MapPage from './pages/MapPage';
import DiaryPage from './pages/DiaryPage';
import ChatPage from './pages/ChatPage';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/avatar" element={<AvatarPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/quests/new" element={<QuestCreatePage />} />
          <Route path="/quests/:id" element={<QuestDetailPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
