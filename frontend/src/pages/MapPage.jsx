import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { checkinApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import './MapPage.css';

const VILLAGE_CENTER = {
  lat: 36.17773082095139,
  lng: 136.62608115875494,
};

const VILLAGE_RADIUS_KM = 5;

const MapPage = () => {
  const { user } = useAuth();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [privacyMode, setPrivacyMode] = useState('off'); // off, area-only, quantized, real-time
  const markers = useRef({});

  useEffect(() => {
    initializeMap();
    loadActiveUsers();
    getUserLocation();

    const interval = setInterval(loadActiveUsers, 30000); // 30秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (map.current && activeUsers.length > 0) {
      updateMarkers();
    }
  }, [activeUsers, privacyMode]);

  const initializeMap = () => {
    if (map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
          },
          layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }]
        },
        center: [VILLAGE_CENTER.lng, VILLAGE_CENTER.lat],
        zoom: 13,
      });

      map.current.on('load', () => {
        // 村の範囲を表示（5km円）
        map.current.addSource('village-area', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [VILLAGE_CENTER.lng, VILLAGE_CENTER.lat],
            },
          },
        });

        map.current.addLayer({
          id: 'village-circle',
          type: 'circle',
          source: 'village-area',
          paint: {
            'circle-radius': {
              stops: [
                [0, 0],
                [20, metersToPixelsAtMaxZoom(VILLAGE_RADIUS_KM * 1000, VILLAGE_CENTER.lat)],
              ],
              base: 2,
            },
            'circle-color': '#3b82f6',
            'circle-opacity': 0.1,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#3b82f6',
            'circle-stroke-opacity': 0.5,
          },
        });

        // 中心マーカー
        new maplibregl.Marker({ color: '#3b82f6' })
          .setLngLat([VILLAGE_CENTER.lng, VILLAGE_CENTER.lat])
          .setPopup(
            new maplibregl.Popup().setHTML('<strong>しらみね大学村</strong><br>中心地点')
          )
          .addTo(map.current);

        setLoading(false);
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    } catch (err) {
      setError('マップの初期化に失敗しました');
      setLoading(false);
    }
  };

  const metersToPixelsAtMaxZoom = (meters, latitude) => {
    return meters / 0.075 / Math.cos((latitude * Math.PI) / 180);
  };

  const loadActiveUsers = async () => {
    try {
      const data = await checkinApi.getActiveUsers();
      setActiveUsers(data);
    } catch (err) {
      console.error('Failed to load active users:', err);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.error('Failed to get user location:', err);
      }
    );
  };

  const updateMarkers = () => {
    if (!map.current) return;

    // 既存マーカーをクリア
    Object.values(markers.current).forEach((marker) => marker.remove());
    markers.current = {};

    // プライバシーモードに応じてユーザー位置を表示
    activeUsers.forEach((user) => {
      if (!user.last_checkin_lat || !user.last_checkin_lng) return;

      let displayLat = user.last_checkin_lat;
      let displayLng = user.last_checkin_lng;

      // プライバシーモード適用
      if (user.id !== user?.id) {
        // 自分以外のユーザー
        if (privacyMode === 'off') {
          return; // 表示しない
        } else if (privacyMode === 'area-only') {
          // 村の中心のみ表示
          displayLat = VILLAGE_CENTER.lat;
          displayLng = VILLAGE_CENTER.lng;
        } else if (privacyMode === 'quantized') {
          // 50-200mグリッドに量子化
          const gridSize = 0.001; // 約100m
          displayLat = Math.round(displayLat / gridSize) * gridSize;
          displayLng = Math.round(displayLng / gridSize) * gridSize;
        }
        // real-time: そのまま表示
      }

      const el = document.createElement('div');
      el.className = 'user-marker';
      el.innerHTML = `
        <div class="marker-dot"></div>
        <div class="marker-pulse"></div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([displayLng, displayLat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div class="user-popup">
              <strong>${user.username}</strong>
              <p>チェックイン中</p>
            </div>
          `)
        )
        .addTo(map.current);

      markers.current[user.id] = marker;
    });

    // 自分の位置を表示
    if (userLocation && user) {
      const el = document.createElement('div');
      el.className = 'user-marker my-location';
      el.innerHTML = `
        <div class="marker-dot"></div>
        <div class="marker-pulse"></div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div class="user-popup">
              <strong>あなた</strong>
              <p>現在位置</p>
            </div>
          `)
        )
        .addTo(map.current);

      markers.current['my-location'] = marker;
    }
  };

  const handlePrivacyChange = (mode) => {
    setPrivacyMode(mode);
  };

  if (loading) {
    return (
      <div className="map-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="map-header glass-card">
        <div className="header-content">
          <h1>マップ</h1>
          <p>村のアクティブメンバー: {activeUsers.length}人</p>
        </div>
      </div>

      <div className="map-controls glass-card">
        <div className="control-group">
          <label>プライバシー設定</label>
          <div className="privacy-buttons">
            <button
              className={`privacy-btn ${privacyMode === 'off' ? 'active' : ''}`}
              onClick={() => handlePrivacyChange('off')}
            >
              非表示
            </button>
            <button
              className={`privacy-btn ${privacyMode === 'area-only' ? 'active' : ''}`}
              onClick={() => handlePrivacyChange('area-only')}
            >
              エリアのみ
            </button>
            <button
              className={`privacy-btn ${privacyMode === 'quantized' ? 'active' : ''}`}
              onClick={() => handlePrivacyChange('quantized')}
            >
              おおよそ
            </button>
            <button
              className={`privacy-btn ${privacyMode === 'real-time' ? 'active' : ''}`}
              onClick={() => handlePrivacyChange('real-time')}
            >
              リアルタイム
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default MapPage;
