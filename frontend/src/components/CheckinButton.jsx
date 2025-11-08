import { useState, useEffect } from 'react';
import { checkinApi } from '../utils/api';
import { getCurrentPosition, isWithinVillageRange, VILLAGE_CONFIG } from '../utils/location';
import './CheckinButton.css';

export default function CheckinButton() {
  const [status, setStatus] = useState('loading'); // loading, checkedout, checkedin
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCheckin, setActiveCheckin] = useState(null);
  const [location, setLocation] = useState(null);
  
  // Initial load: check current status
  useEffect(() => {
    checkStatus();
  }, []);
  
  const checkStatus = async () => {
    try {
      setStatus('loading');
      const data = await checkinApi.getActiveLatest();
      
      if (data.checkin && data.checkin.isActive) {
        setStatus('checkedin');
        setActiveCheckin(data.checkin);
      } else {
        setStatus('checkedout');
        setActiveCheckin(null);
      }
    } catch (err) {
      console.error('Failed to check status:', err);
      // Fail safe: assume checked out
      setStatus('checkedout');
      setActiveCheckin(null);
    }
  };
  
  const handleCheckin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get current location
      const position = await getCurrentPosition();
      setLocation(position);
      
      // Client-side validation
      if (!isWithinVillageRange(position.lat, position.lng)) {
        throw new Error(`村の中心から${VILLAGE_CONFIG.radiusKm}km以内にいる必要があります`);
      }
      
      // Send checkin request
      const data = await checkinApi.checkin(position.lat, position.lng);
      
      // Update status
      setStatus('checkedin');
      setActiveCheckin(data.checkin);
    } catch (err) {
      setError(err.message || 'チェックインに失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Send checkout request
      await checkinApi.checkout();
      
      // Update status
      setStatus('checkedout');
      setActiveCheckin(null);
    } catch (err) {
      setError(err.message || 'チェックアウトに失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="checkin-card">
        <div className="spinner"></div>
        <p>状態を確認中...</p>
      </div>
    );
  }
  
  return (
    <div className="checkin-card">
      <h2 className="checkin-title">チェックイン/チェックアウト</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="checkin-status">
        {status === 'checkedin' ? (
          <>
            <div className="status-indicator active">✓ チェックイン中</div>
            {activeCheckin && (
              <p className="status-time">
                開始: {new Date(activeCheckin.checkinTime).toLocaleString('ja-JP')}
              </p>
            )}
          </>
        ) : (
          <div className="status-indicator inactive">未チェックイン</div>
        )}
      </div>
      
      <div className="checkin-actions">
        {status === 'checkedout' ? (
          <button
            className="btn btn-primary btn-large"
            onClick={handleCheckin}
            disabled={loading}
          >
            {loading ? 'チェックイン中...' : 'チェックイン'}
          </button>
        ) : (
          <button
            className="btn btn-danger btn-large"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'チェックアウト中...' : 'チェックアウト'}
          </button>
        )}
      </div>
      
      <div className="checkin-info">
        <p>📍 村の中心から{VILLAGE_CONFIG.radiusKm}km以内で有効</p>
        <p>⏱️ 7日以上経過すると自動的に非アクティブになります</p>
      </div>
    </div>
  );
}
