import { useState, useEffect } from 'react';
import { avatarApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import './AvatarEditor.css';

// 絵文字パーツの定義
const AVATAR_PARTS = {
  face: ['😊', '😄', '🥰', '😎', '🤓', '😇', '🤗', '😌', '😏', '🙂'],
  hair: ['🦱', '👩', '👨', '🧑', '👱', '👩‍🦰', '👨‍🦰', '👩‍🦱', '👨‍🦱', '👩‍🦲'],
  accessory: ['👓', '🕶️', '👑', '🎓', '🎩', '🧢', '⛑️', '💍', '📿', '🌺'],
  clothing: ['👔', '👕', '👗', '🎽', '🥼', '🦺', '👘', '🥻', '🩱', '🩳'],
};

export default function AvatarEditor() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [avatarState, setAvatarState] = useState({
    face: user?.avatar_state?.face || '😊',
    hair: user?.avatar_state?.hair || '👩',
    accessory: user?.avatar_state?.accessory || '👓',
    clothing: user?.avatar_state?.clothing || '👕',
  });
  const [selectedCategory, setSelectedCategory] = useState('face');
  
  const categories = [
    { key: 'face', label: '顔', icon: '�' },
    { key: 'hair', label: '髪型', icon: '�' },
    { key: 'accessory', label: 'アクセサリー', icon: '�' },
    { key: 'clothing', label: '服', icon: '👕' },
  ];
  
  const handlePartSelect = (category, emoji) => {
    setAvatarState({
      ...avatarState,
      [category]: emoji,
    });
    setError('');
    setSuccess('');
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await avatarApi.saveAvatar(avatarState);
      setSuccess('アバターを保存しました！');
      
      // Update user context
      if (updateUser) {
        updateUser({ ...user, avatar_state: avatarState });
      }
    } catch (err) {
      setError(err.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };
  
  const currentCategoryParts = AVATAR_PARTS[selectedCategory] || [];
  
  return (
    <div className="avatar-editor">
      <div className="editor-header">
        <h2>アバターエディター</h2>
        <p>絵文字を組み合わせてアバターを作ろう!</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {/* アバタープレビュー */}
      <div className="avatar-preview">
        <h3>現在のアバター</h3>
        <div className="preview-display">
          <span className="avatar-emoji">
            {avatarState.face}{avatarState.hair}{avatarState.accessory}{avatarState.clothing}
          </span>
        </div>
      </div>
      
      {/* カテゴリ選択 */}
      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`category-tab ${selectedCategory === cat.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            <span className="tab-icon">{cat.icon}</span>
            <span className="tab-label">{cat.label}</span>
          </button>
        ))}
      </div>
      
      {/* 絵文字グリッド */}
      <div className="emoji-grid">
        {currentCategoryParts.map((emoji, index) => (
          <button
            key={index}
            className={`emoji-button ${avatarState[selectedCategory] === emoji ? 'selected' : ''}`}
            onClick={() => handlePartSelect(selectedCategory, emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {/* 保存ボタン */}
      <div className="editor-actions">
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : 'アバターを保存'}
        </button>
      </div>
    </div>
  );
}
