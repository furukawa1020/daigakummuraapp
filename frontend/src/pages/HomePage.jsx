import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CheckinButton from '../components/CheckinButton';
import StatsDisplay from '../components/StatsDisplay';
import './HomePage.css';

export default function HomePage() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="home-page">
      <header className="home-header">
        <h1>しらみね大学村</h1>
        <p>ようこそ、{user?.nickname}さん</p>
      </header>
      
      <main className="home-main">
        <section className="quick-links">
          <Link to="/avatar" className="quick-link-card">
            <span className="link-icon">🧑</span>
            <span className="link-text">アバター編集</span>
          </Link>
        </section>
        
        <section className="checkin-section">
          <CheckinButton />
        </section>
        
        <section className="stats-section">
          <StatsDisplay />
        </section>
      </main>
    </div>
  );
}
