import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questApi } from '../utils/api';
import './QuestForm.css';

const QuestCreatePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    visibility: 'public',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('タイトルと説明は必須です');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const quest = await questApi.createQuest(formData);
      navigate(`/quests/${quest.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quest-form-page">
      <div className="form-container glass-card">
        <div className="form-header">
          <h1>新しいクエストを作成</h1>
          <p>コミュニティの仲間と一緒に楽しむアクティビティを企画しましょう</p>
        </div>

        <form onSubmit={handleSubmit} className="quest-form">
          <div className="form-group">
            <label htmlFor="title">タイトル *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="例: 村の散策コース巡り"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">説明 *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input textarea"
              rows="6"
              placeholder="クエストの詳細、目的、楽しみ方などを記入してください"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">場所・集合地点</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input"
              placeholder="例: 村役場前"
            />
          </div>

          <div className="form-group">
            <label htmlFor="visibility">公開範囲</label>
            <select
              id="visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="input select"
            >
              <option value="public">公開 - 誰でも参加可能</option>
              <option value="village">村限定 - チェックイン中のメンバーのみ</option>
              <option value="private">非公開 - 招待されたメンバーのみ</option>
            </select>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/quests')}
              className="btn btn-outline"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '作成中...' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestCreatePage;
