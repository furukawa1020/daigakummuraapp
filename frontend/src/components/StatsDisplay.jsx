import { useState, useEffect } from 'react';
import { statsApi } from '../utils/api';
import './StatsDisplay.css';

export default function StatsDisplay() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await statsApi.getPublicStats();
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="stats-card">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="stats-card">
        <p>統計情報を読み込めませんでした</p>
      </div>
    );
  }
  
  return (
    <div className="stats-card">
      <h2 className="stats-title">村の統計</h2>
      
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.activeUsers}</div>
          <div className="stat-label">アクティブユーザー</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">📍</div>
          <div className="stat-value">{stats.totalCheckins}</div>
          <div className="stat-label">総チェックイン数</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.totalVisitDays}</div>
          <div className="stat-label">総訪問日数</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">🏘️</div>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">登録ユーザー数</div>
        </div>
      </div>
    </div>
  );
}
