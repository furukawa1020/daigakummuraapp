# しらみね大学村アプリ

白峰エリア内の活動を「見える化」し、地域タスク参加・交流・振り返りを促進するPWAアプリケーション。

## 技術スタック

- **フロントエンド**: React + Vite (Netlify)
  - PWA (Progressive Web App)
  - MapLibre (地図表示)
  - Socket.IO Client (リアルタイム通信)

- **バックエンド**: Node.js + Express (Railway)
  - PostgreSQL (データベース)
  - Socket.IO (WebSocket)
  - JWT認証 (httpOnly Cookie)

## 機能概要

1. **チェックイン/チェックアウト** - 白峰エリア内での活動記録（半径5.0km）
2. **ドット風アバター** - カスタマイズ可能なアバター & アンロックシステム
3. **クエストシステム** - 地域タスク（雪かき、薪割りなど）の作成・参加
4. **統合カレンダー** - 予定・滞在・クエストの一元管理
5. **マップ & 位置共有** - プライバシー保護付き位置表示
6. **チャット・通話** - リアルタイムコミュニケーション
7. **日記ログ** - X風の投稿機能
8. **ランキング** - 活動貢献の可視化
9. **ダークモード** - ライト/ダーク切り替え

## 座標情報

- **村の中心**: `36.17773082095139, 136.62608115875494`
- **有効範囲**: 半径 5.0 km

## 環境変数

### バックエンド (.env)
```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=https://your-netlify-app.netlify.app
PORT=3000
WS_ENABLED=true
NODE_ENV=development
```

### フロントエンド (.env)
```
VITE_API_BASE_URL=https://your-railway-app.railway.app
VITE_WS_URL=wss://your-railway-app.railway.app
VITE_MAP_TILES_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

## セットアップ

### バックエンド
```bash
cd backend
npm install
npm run migrate  # データベースマイグレーション
npm run dev      # 開発サーバー起動
```

### フロントエンド
```bash
cd frontend
npm install
npm run dev      # 開発サーバー起動
```

## デプロイ

- **フロントエンド**: Netlify (自動デプロイ)
- **バックエンド**: Railway (自動デプロイ + PostgreSQL)

## 想定規模

- 最大利用者: 50人
- 同時接続: 10人前後

## ライセンス

MIT
