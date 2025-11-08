import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function AuthPage() {
  const { isAuthenticated, login, register, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    email: '',
    username: '',
    password: '',
    nickname: '',
  });
  const [localError, setLocalError] = useState('');
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    
    try {
      let result;
      if (isLogin) {
        result = await login({
          emailOrUsername: formData.emailOrUsername,
          password: formData.password,
        });
      } else {
        result = await register({
          email: formData.email || undefined,
          username: formData.username || undefined,
          password: formData.password,
          nickname: formData.nickname,
        });
      }
      
      if (!result.success) {
        setLocalError(result.error || 'An error occurred');
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">しらみね大学村</h1>
        <p className="auth-subtitle">白峰エリアの活動を見える化</p>
        
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setLocalError('');
            }}
          >
            ログイン
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setLocalError('');
            }}
          >
            新規登録
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {isLogin ? (
            <>
              <div className="form-group">
                <label htmlFor="emailOrUsername">メールアドレス または ユーザー名</label>
                <input
                  type="text"
                  id="emailOrUsername"
                  name="emailOrUsername"
                  className="input"
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">パスワード</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="email">メールアドレス（任意）</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="username">ユーザー名（任意）</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="input"
                  value={formData.username}
                  onChange={handleChange}
                  pattern="[a-zA-Z0-9_]{3,50}"
                  title="3-50文字の英数字とアンダースコア"
                  autoComplete="username"
                />
                <small>※メールアドレスかユーザー名のどちらかは必須です</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="nickname">ニックネーム</label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  className="input"
                  value={formData.nickname}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">パスワード</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <small>※8文字以上</small>
              </div>
            </>
          )}
          
          {(localError || error) && (
            <div className="error-message">{localError || error}</div>
          )}
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '処理中...' : isLogin ? 'ログイン' : '登録'}
          </button>
        </form>
      </div>
    </div>
  );
}
