# しらみね大学村アプリ

LucidUIデザインを採用した大学村コミュニティアプリケーション。白峰エリア内の活動を「見える化」し、地域タスク参加・交流・振り返りを促進します。

## 技術スタック

- **フロントエンド**: React 18.2 + Vite 5.0
  - React Router 6.20
  - MapLibre GL 3.6 (地図表示)
  - Socket.IO Client 4.7 (リアルタイム通信)
  - LucidUI (グラスモーフィズムデザイン)

- **バックエンド**: Node.js + Express
  - PostgreSQL (データベース)
  - Socket.IO 4.7 (WebSocket)
  - JWT認証 (httpOnly Cookie)
  - bcrypt (パスワードハッシュ)

## ✅ 実装済み機能

### 1. 認証システム
- ユーザー登録・ログイン
- JWTベース認証
- Cookie管理

### 2. アバターシステム
- カスタマイズ可能なアバター
- パーツ選択（髪、目、口、服装、アクセサリー）
- リアルタイムプレビュー

### 3. チェックインシステム
- 位置情報ベースのチェックイン/チェックアウト
- 村内範囲確認（半径5.0km）
- チェックイン履歴

### 4. クエストシステム
- クエスト作成・参加・完了・削除
- 公開範囲設定（公開/村限定/非公開）
- 参加者管理
- クエスト専用チャットチャンネル自動作成

### 5. マップ機能
- MapLibre GL統合
- リアルタイム位置表示
- 4種類のプライバシーモード（オフ/エリアのみ/量子化/リアルタイム）
- 村の範囲表示（5km円）

### 6. 日記ログ
- 投稿CRUD操作
- 5種類のリアクション（いいね、ハート、笑い、驚き、悲しい）
- 公開範囲設定（公開/村限定/友達限定/非公開）
- ユーザープロフィール表示

### 7. チャット・通話システム
- Socket.IOリアルタイム通信
- チャンネル管理（全体/クエスト別/DM）
- タイピングインジケーター
- WebRTCシグナリング準備完了
- 未読カウント
- メッセージ削除

### 8. カレンダー統合
- 個人イベント管理（CRUD）
- クエスト期限表示
- チェックイン履歴表示
- 月間カレンダービュー
- イベント作成モーダル

### 🎨 LucidUIデザイン
- グラスモーフィズム効果
- グラデーションボタン
- スムーズアニメーション
- 絵文字なしスタイリッシュUI
- レスポンシブデザイン

## 座標情報

- **村の中心**: `36.17773082095139, 136.62608115875494`
- **有効範囲**: 半径 5.0 km

## セットアップ

### 前提条件
- Node.js 18以上
- PostgreSQL 14以上
- npm または yarn

### 1. リポジトリをクローン
```bash
git clone https://github.com/furukawa1020/daigakummuraapp.git
cd daigakummuraapp
```

### 2. バックエンドのセットアップ
```bash
cd backend
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してデータベース接続情報を設定

# データベースマイグレーション実行
npm run migrate

# 開発サーバー起動
npm run dev
```

### 3. フロントエンドのセットアップ
```bash
cd frontend
npm install

# 開発サーバー起動
npm run dev
```

### 4. アクセス
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:3000

## 環境変数

### バックエンド (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/shiramine_village
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
VILLAGE_CENTER_LAT=36.17773082095139
VILLAGE_CENTER_LNG=136.62608115875494
VILLAGE_RADIUS_KM=5.0
```

### フロントエンド (.env)
```bash
VITE_API_URL=http://localhost:3000
```

## データベーススキーマ

### マイグレーション
- `001_initial_schema.sql`: 基本テーブル（users, checkins, avatar_parts, quests, diary_posts）
- `002_seed_avatar_parts.sql`: アバターパーツの初期データ
- `003_chat_system.sql`: チャット機能（channels, members, messages）
- `004_calendar_system.sql`: カレンダー機能（events）

## API エンドポイント

### 認証
- `POST /auth/register` - ユーザー登録
- `POST /auth/login` - ログイン
- `POST /auth/logout` - ログアウト
- `GET /auth/me` - 現在のユーザー情報

### チェックイン
- `POST /checkins` - チェックイン
- `PUT /checkins/:id/checkout` - チェックアウト
- `GET /checkins/active` - アクティブなチェックイン
- `GET /checkins/history` - チェックイン履歴

### アバター
- `GET /avatar/parts` - アバターパーツ一覧
- `PUT /avatar` - アバター更新

### クエスト
- `POST /quests` - クエスト作成
- `GET /quests` - クエスト一覧
- `GET /quests/:id` - クエスト詳細
- `POST /quests/:id/join` - クエスト参加
- `POST /quests/:id/complete` - クエスト完了
- `DELETE /quests/:id` - クエスト削除

### 日記
- `POST /diary` - 投稿作成
- `GET /diary` - 投稿一覧
- `GET /diary/:id` - 投稿詳細
- `PUT /diary/:id` - 投稿更新
- `DELETE /diary/:id` - 投稿削除
- `POST /diary/:id/react` - リアクション

### チャット
- `GET /chat/channels` - チャンネル一覧
- `GET /chat/channels/:id/messages` - メッセージ取得
- `POST /chat/channels/:id/messages` - メッセージ送信
- `POST /chat/channels/dm` - DM作成

### カレンダー
- `GET /calendar/events` - イベント一覧
- `POST /calendar/events` - イベント作成
- `PUT /calendar/events/:id` - イベント更新
- `DELETE /calendar/events/:id` - イベント削除

## WebSocket イベント

### チャット
- `join:channels` - ユーザーのチャンネルに参加
- `join:channel` - 特定チャンネルに参加
- `message:send` - メッセージ送信
- `message:new` - 新規メッセージ受信
- `typing:start` - 入力開始
- `typing:stop` - 入力停止

### 通話（WebRTC）
- `call:offer` - 通話オファー
- `call:answer` - 通話応答
- `call:ice-candidate` - ICE候補交換
- `call:end` - 通話終了

## 開発コマンド

### バックエンド
```bash
npm run dev          # 開発サーバー起動（ホットリロード）
npm run start        # 本番サーバー起動
npm run migrate      # マイグレーション実行
npm run migrate:create <name>  # 新規マイグレーション作成
```

### フロントエンド
```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run preview      # ビルドプレビュー
```

## ライセンス
MIT

## 作成者
Shiramine Village Dev Team
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
