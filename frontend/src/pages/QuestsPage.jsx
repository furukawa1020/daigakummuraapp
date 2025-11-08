import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questApi } from '../utils/api';
import './QuestsPage.css';

const QuestsPage = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, my, participating

  useEffect(() => {
    loadQuests();
  }, [filter]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      if (filter === 'my') {
        // 自分が作成したクエストのみ表示する場合は、バックエンドに追加機能が必要
        // 今回はクライアントサイドでフィルタリング
      }
      
      const data = await questApi.getQuests(params);
      
      let filtered = data;
      if (filter === 'participating') {
        filtered = data.filter(q => q.is_participating);
      }
      
      setQuests(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (quest) => {
    if (quest.my_status === 'completed') {
      return <span className="badge badge-success">完了</span>;
    }
    if (quest.my_status === 'joined') {
      return <span className="badge badge-primary">参加中</span>;
    }
    if (quest.status === 'completed') {
      return <span className="badge badge-secondary">終了</span>;
    }
    return <span className="badge badge-active">募集中</span>;
  };

  const getVisibilityLabel = (visibility) => {
    const labels = {
      public: '公開',
      village: '村限定',
      private: '非公開',
    };
    return labels[visibility] || visibility;
  };

  if (loading) {
    return (
      <div className="quests-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="quests-page">
      <div className="quests-header glass-card">
        <div className="header-content">
          <h1>クエスト</h1>
          <p>コミュニティの仲間と一緒に楽しむアクティビティ</p>
        </div>
        <Link to="/quests/new" className="btn btn-primary">
          新規作成
        </Link>
      </div>

      <div className="quests-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          すべて
        </button>
        <button
          className={`filter-btn ${filter === 'participating' ? 'active' : ''}`}
          onClick={() => setFilter('participating')}
        >
          参加中
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {quests.length === 0 ? (
        <div className="empty-state surface-card">
          <p>クエストがありません</p>
          <Link to="/quests/new" className="btn btn-outline">
            最初のクエストを作成する
          </Link>
        </div>
      ) : (
        <div className="quests-grid">
          {quests.map((quest) => (
            <Link
              key={quest.id}
              to={`/quests/${quest.id}`}
              className="quest-card surface-card"
            >
              <div className="quest-header">
                <div className="quest-status">
                  {getStatusBadge(quest)}
                  <span className="visibility-badge">
                    {getVisibilityLabel(quest.visibility)}
                  </span>
                </div>
              </div>

              <h3 className="quest-title">{quest.title}</h3>
              <p className="quest-description">{quest.description}</p>

              {quest.location && (
                <div className="quest-location">
                  <span className="location-icon">📍</span>
                  {quest.location}
                </div>
              )}

              <div className="quest-meta">
                <div className="quest-creator">
                  作成者: {quest.creator.username}
                </div>
                <div className="quest-stats">
                  <span className="stat-item">
                    👥 {quest.participant_count}
                  </span>
                  <span className="stat-item">
                    ✓ {quest.completed_count}
                  </span>
                </div>
              </div>

              <div className="quest-date">
                {new Date(quest.created_at).toLocaleDateString('ja-JP')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestsPage;
