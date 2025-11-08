import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import './QuestDetailPage.css';

const QuestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reflection, setReflection] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadQuest();
  }, [id]);

  const loadQuest = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await questApi.getQuest(id);
      setQuest(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      setActionLoading(true);
      await questApi.joinQuest(id);
      await loadQuest();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    
    if (!reflection.trim()) {
      setError('振り返りを入力してください');
      return;
    }

    try {
      setActionLoading(true);
      await questApi.completeQuest(id, reflection);
      setShowCompleteForm(false);
      setReflection('');
      await loadQuest();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('このクエストへの参加をキャンセルしますか?')) {
      return;
    }

    try {
      setActionLoading(true);
      await questApi.cancelQuest(id);
      await loadQuest();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('このクエストを削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      setActionLoading(true);
      await questApi.deleteQuest(id);
      navigate('/quests');
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="quest-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && !quest) {
    return (
      <div className="quest-detail-page">
        <div className="error-container surface-card">
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/quests')} className="btn btn-outline">
            クエスト一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  if (!quest) {
    return null;
  }

  const isCreator = user && quest.creator.id === user.id;
  const myParticipation = quest.participants?.find(p => p.userId === user?.id);
  const isParticipating = !!myParticipation;
  const isCompleted = myParticipation?.status === 'completed';
  const isCancelled = myParticipation?.status === 'cancelled';

  return (
    <div className="quest-detail-page">
      <div className="quest-detail-container">
        <div className="quest-detail-card glass-card">
          {/* Header */}
          <div className="quest-detail-header">
            <div className="quest-badges">
              <span className={`badge ${quest.status === 'active' ? 'badge-active' : 'badge-secondary'}`}>
                {quest.status === 'active' ? '募集中' : '終了'}
              </span>
              <span className="visibility-badge">
                {quest.visibility === 'public' ? '公開' : quest.visibility === 'village' ? '村限定' : '非公開'}
              </span>
            </div>

            {isCreator && (
              <div className="creator-actions">
                <button
                  onClick={handleDelete}
                  className="btn btn-danger btn-small"
                  disabled={actionLoading}
                >
                  削除
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <h1 className="quest-title">{quest.title}</h1>
          
          <div className="quest-meta">
            <span className="meta-item">
              作成者: <strong>{quest.creator.username}</strong>
            </span>
            <span className="meta-item">
              {new Date(quest.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="quest-description">
            <p>{quest.description}</p>
          </div>

          {quest.location && (
            <div className="quest-location-info">
              <span className="location-icon">📍</span>
              <span>{quest.location}</span>
            </div>
          )}

          {/* Stats */}
          <div className="quest-stats-row">
            <div className="stat-card">
              <div className="stat-value">{quest.participants?.length || 0}</div>
              <div className="stat-label">参加者</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {quest.participants?.filter(p => p.status === 'completed').length || 0}
              </div>
              <div className="stat-label">完了</div>
            </div>
          </div>

          {/* Actions */}
          {!isCreator && quest.status === 'active' && (
            <div className="quest-actions">
              {!isParticipating ? (
                <button
                  onClick={handleJoin}
                  className="btn btn-primary btn-large"
                  disabled={actionLoading}
                >
                  参加する
                </button>
              ) : isCompleted ? (
                <div className="completion-badge">
                  ✓ 完了済み
                </div>
              ) : isCancelled ? (
                <div className="cancelled-badge">
                  キャンセル済み
                </div>
              ) : (
                <div className="participant-actions">
                  {!showCompleteForm ? (
                    <>
                      <button
                        onClick={() => setShowCompleteForm(true)}
                        className="btn btn-success btn-large"
                        disabled={actionLoading}
                      >
                        完了報告
                      </button>
                      <button
                        onClick={handleCancel}
                        className="btn btn-outline"
                        disabled={actionLoading}
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <form onSubmit={handleComplete} className="completion-form">
                      <div className="form-group">
                        <label htmlFor="reflection">振り返り *</label>
                        <textarea
                          id="reflection"
                          value={reflection}
                          onChange={(e) => setReflection(e.target.value)}
                          className="input textarea"
                          rows="4"
                          placeholder="クエストを通じて感じたこと、学んだことなどを共有しましょう"
                          required
                        />
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCompleteForm(false);
                            setReflection('');
                          }}
                          className="btn btn-outline"
                          disabled={actionLoading}
                        >
                          戻る
                        </button>
                        <button
                          type="submit"
                          className="btn btn-success"
                          disabled={actionLoading}
                        >
                          {actionLoading ? '送信中...' : '完了報告を送信'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Participants */}
        {quest.participants && quest.participants.length > 0 && (
          <div className="participants-card surface-card">
            <h2 className="section-title">参加者</h2>
            <div className="participants-list">
              {quest.participants.map((participant) => (
                <div key={participant.id} className="participant-item">
                  <div className="participant-info">
                    <span className="participant-name">{participant.username}</span>
                    <span className={`participant-status status-${participant.status}`}>
                      {participant.status === 'completed' ? '✓ 完了' :
                       participant.status === 'joined' ? '参加中' : 'キャンセル'}
                    </span>
                  </div>
                  {participant.reflection && (
                    <div className="participant-reflection">
                      <p>{participant.reflection}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestDetailPage;
