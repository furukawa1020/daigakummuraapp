import { useState, useEffect } from 'react';
import { avatarApi } from '../utils/api';
import { 
  createDefaultAvatarState, 
  validateAvatarState, 
  formatUnlockRule, 
  getRarityColor,
  getRarityBadge 
} from '../utils/avatar';
import { useAuth } from '../contexts/AuthContext';
import './AvatarEditor.css';

export default function AvatarEditor() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [partsData, setPartsData] = useState({});
  const [activityPoints, setActivityPoints] = useState(null);
  const [avatarState, setAvatarState] = useState(createDefaultAvatarState());
  const [selectedCategory, setSelectedCategory] = useState('hair');
  
  const categories = [
    { key: 'hair', label: '髪型', icon: '💇' },
    { key: 'hair_color', label: '髪色', icon: '🎨' },
    { key: 'eyes', label: '目', icon: '👁️' },
    { key: 'mouth', label: '口', icon: '👄' },
    { key: 'skin_color', label: '肌色', icon: '🖌️' },
    { key: 'clothing', label: '服', icon: '👕' },
    { key: 'accessory', label: 'アクセサリー', icon: '👑' },
  ];
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await avatarApi.getParts();
      setPartsData(data.parts);
      setActivityPoints(data.activityPoints);
      
      // Initialize avatar state from user data or defaults
      if (user?.avatarState && Object.keys(user.avatarState).length > 0) {
        setAvatarState(user.avatarState);
      } else {
        // Set default parts (first unlocked part in each category)
        const initialState = createDefaultAvatarState();
        Object.keys(data.parts).forEach(category => {
          const unlockedParts = data.parts[category].filter(p => p.unlocked);
          if (unlockedParts.length > 0) {
            initialState[category] = unlockedParts[0].id;
          }
        });
        setAvatarState(initialState);
      }
    } catch (err) {
      setError(err.message || 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePartSelect = (category, partId) => {
    setAvatarState({
      ...avatarState,
      [category]: partId,
    });
    setError('');
    setSuccess('');
  };
  
  const handleUnlock = async (partId) => {
    try {
      setUnlocking(true);
      setError('');
      await avatarApi.unlockPart(partId);
      setSuccess('パーツをアンロックしました！');
      await loadData(); // Reload to update unlock status
    } catch (err) {
      setError(err.message || 'アンロックに失敗しました');
    } finally {
      setUnlocking(false);
    }
  };
  
  const handleAutoUnlock = async () => {
    try {
      setUnlocking(true);
      setError('');
      const result = await avatarApi.autoUnlock();
      if (result.unlockedParts.length > 0) {
        setSuccess(`${result.unlockedParts.length}個のパーツを自動アンロックしました！`);
        await loadData();
      } else {
        setSuccess('アンロック可能なパーツはありません');
      }
    } catch (err) {
      setError(err.message || '自動アンロックに失敗しました');
    } finally {
      setUnlocking(false);
    }
  };
  
  const handleSave = async () => {
    try {
      if (!validateAvatarState(avatarState)) {
        setError('すべてのパーツを選択してください');
        return;
      }
      
      setSaving(true);
      setError('');
      await avatarApi.saveAvatar(avatarState);
      setSuccess('アバターを保存しました！');
    } catch (err) {
      setError(err.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="avatar-editor">
        <div className="spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }
  
  const currentCategoryParts = partsData[selectedCategory] || [];
  
  return (
    <div className="avatar-editor">
      <div className="editor-header">
        <h2>アバターエディタ</h2>
        {activityPoints && (
          <div className="activity-points">
            <span className="points-label">活動ポイント:</span>
            <span className="points-value">{activityPoints.totalPoints}pt</span>
          </div>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="editor-content">
        <div className="preview-section">
          <h3>プレビュー</h3>
          <div className="avatar-preview">
            <div className="avatar-placeholder">
              {/* Placeholder for avatar rendering */}
              <p>🧑</p>
              <p className="preview-note">※実際のアバター表示はSVG実装後に追加</p>
            </div>
          </div>
          
          <div className="preview-actions">
            <button 
              className="btn btn-secondary" 
              onClick={handleAutoUnlock}
              disabled={unlocking}
            >
              {unlocking ? '処理中...' : '自動アンロック'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={saving || !validateAvatarState(avatarState)}
            >
              {saving ? '保存中...' : 'アバター保存'}
            </button>
          </div>
        </div>
        
        <div className="parts-section">
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
          
          <div className="parts-grid">
            {currentCategoryParts.map(part => (
              <div
                key={part.id}
                className={`part-card ${avatarState[selectedCategory] === part.id ? 'selected' : ''} ${!part.unlocked && !part.canUnlock ? 'locked' : ''}`}
              >
                <div className="part-preview">
                  {selectedCategory.includes('color') ? (
                    <div 
                      className="color-swatch"
                      style={{ backgroundColor: part.assetUrl }}
                    />
                  ) : (
                    <div className="part-icon">
                      {part.unlocked ? '✓' : '🔒'}
                    </div>
                  )}
                </div>
                
                <div className="part-info">
                  <div className="part-name">
                    <span className="rarity-badge">{getRarityBadge(part.rarity)}</span>
                    {part.name}
                  </div>
                  
                  {!part.unlocked && (
                    <div className="unlock-info">
                      <small>{formatUnlockRule(part.unlockRule)}</small>
                    </div>
                  )}
                </div>
                
                <div className="part-actions">
                  {part.unlocked ? (
                    <button
                      className="btn-select"
                      onClick={() => handlePartSelect(selectedCategory, part.id)}
                    >
                      選択
                    </button>
                  ) : part.canUnlock ? (
                    <button
                      className="btn-unlock"
                      onClick={() => handleUnlock(part.id)}
                      disabled={unlocking}
                    >
                      アンロック
                    </button>
                  ) : (
                    <button className="btn-locked" disabled>
                      未達成
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
