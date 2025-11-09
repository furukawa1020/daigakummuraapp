import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function AuthPage() {
  const { isAuthenticated, login, register, loading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    nickname: '',
  });
  const [formError, setFormError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (isLogin) {
      const result = await login({
        emailOrUsername: formData.email || formData.username,
        password: formData.password,
      });
      if (!result.success) {
        setFormError(result.error || 'ログインに失敗しました');
      }
    } else {
      if (!formData.nickname.trim()) {
        setFormError('ニックネームを入力してください');
        return;
      }
      if (formData.password.length < 8) {
        setFormError('パスワードは8文字以上にしてください');
        return;
      }
      const result = await register({
        email: formData.email || null,
        username: formData.username || null,
        password: formData.password,
        nickname: formData.nickname,
      });
      if (!result.success) {
        setFormError(result.error || '登録に失敗しました');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <img src="/images/shiramine-logo.png" alt="しらみね大学村" />
        </div>
        
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            ログイン
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            新規登録
          </button>
        </div>

        {(error || formError) && (
          <div className="error-message">{error || formError}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="nickname">ニックネーム</label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">メールアドレス or ユーザー名</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '処理中...' : isLogin ? 'ログイン' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  );
}
