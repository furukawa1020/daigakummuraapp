import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { diaryApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import './DiaryPage.css';

const DiaryPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    visibility: 'public',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await diaryApi.getPosts();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPost.content.trim()) {
      setError('投稿内容を入力してください');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await diaryApi.createPost(newPost);
      setNewPost({ content: '', visibility: 'public' });
      setShowCreateForm(false);
      await loadPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (postId, reactionType) => {
    try {
      await diaryApi.reactToPost(postId, reactionType);
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('この投稿を削除しますか？')) {
      return;
    }

    try {
      await diaryApi.deletePost(postId);
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  const getVisibilityLabel = (visibility) => {
    const labels = {
      public: '公開',
      village: '村限定',
      friends: '友達限定',
      private: '非公開',
    };
    return labels[visibility] || visibility;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const reactionIcons = {
    like: '👍',
    love: '❤️',
    laugh: '😄',
    wow: '😮',
    sad: '😢',
  };

  if (loading) {
    return (
      <div className="diary-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="diary-page">
      <div className="diary-header glass-card">
        <div className="header-content">
          <h1>日記ログ</h1>
          <p>日々の出来事や思いを共有しましょう</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? 'キャンセル' : '投稿する'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form-card surface-card">
          <form onSubmit={handleCreatePost} className="create-form">
            <div className="form-group">
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="input textarea"
                rows="4"
                placeholder="今日はどんなことがありましたか？"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="visibility">公開範囲</label>
                <select
                  id="visibility"
                  value={newPost.visibility}
                  onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
                  className="input select"
                >
                  <option value="public">公開</option>
                  <option value="village">村限定</option>
                  <option value="friends">友達限定</option>
                  <option value="private">非公開</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? '投稿中...' : '投稿'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="empty-state surface-card">
          <p>まだ投稿がありません</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-outline"
          >
            最初の投稿を作成する
          </button>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.id} className="post-card surface-card">
              <div className="post-header">
                <div className="author-info">
                  <div className="author-avatar">
                    {post.author.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="author-details">
                    <div className="author-name">{post.author.username}</div>
                    <div className="post-meta">
                      <span className="post-time">{formatDate(post.created_at)}</span>
                      <span className="visibility-badge">
                        {getVisibilityLabel(post.visibility)}
                      </span>
                    </div>
                  </div>
                </div>

                {user && post.user_id === user.id && (
                  <div className="post-actions">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="btn-icon"
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="post-content">
                <p>{post.content}</p>
              </div>

              <div className="post-footer">
                <div className="reactions">
                  {Object.entries(reactionIcons).map(([type, icon]) => {
                    const count = post.reactions?.find(r => r.type === type)?.count || 0;
                    const userReacted = post.user_reacted;
                    
                    return (
                      <button
                        key={type}
                        onClick={() => handleReact(post.id, type)}
                        className={`reaction-btn ${userReacted ? 'active' : ''}`}
                        title={type}
                      >
                        <span className="reaction-icon">{icon}</span>
                        {count > 0 && <span className="reaction-count">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiaryPage;
