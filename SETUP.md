# セットアップ手順

このドキュメントは、しらみね大学村アプリケーションをローカル環境で実行するための手順を説明します。

## 前提条件

以下のソフトウェアがインストールされている必要があります:

- **Node.js** (v18以上推奨)
- **PostgreSQL** (v14以上推奨)
- **Git**

## 1. リポジトリのクローン

```bash
git clone <repository-url>
cd daigakummuraapp
```

## 2. バックエンドのセットアップ

### 2.1 依存関係のインストール

```bash
cd backend
npm install
```

### 2.2 環境変数の設定

`.env.example`をコピーして`.env`を作成:

```bash
cp .env.example .env
```

`.env`ファイルを編集して、以下の設定を行います:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/shiramine_village
JWT_SECRET=あなたのランダムな秘密鍵に変更してください
CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
WS_ENABLED=true
VILLAGE_CENTER_LAT=36.17773082095139
VILLAGE_CENTER_LNG=136.62608115875494
VILLAGE_RADIUS_KM=5.0
```

### 2.3 データベースの作成

PostgreSQLに接続して、データベースを作成します:

```bash
# PostgreSQLに接続
psql -U postgres

# データベース作成
CREATE DATABASE shiramine_village;

# 終了
\q
```

### 2.4 マイグレーションの実行

データベースにテーブルを作成します:

```bash
npm run migrate
```

成功すると、以下のようなメッセージが表示されます:
```
✓ Migration 001_initial_schema.sql completed
All migrations completed successfully!
```

### 2.5 バックエンドサーバーの起動

```bash
npm run dev
```

サーバーが起動すると、以下のメッセージが表示されます:
```
🚀 Server running on port 3000
📍 Village center: 36.17773082095139, 136.62608115875494
📏 Village radius: 5.0 km
🌍 Environment: development
🔐 CORS origin: http://localhost:5173
```

## 3. フロントエンドのセットアップ

**新しいターミナルウィンドウを開きます。**

### 3.1 依存関係のインストール

```bash
cd frontend
npm install
```

### 3.2 環境変数の設定

`.env.example`をコピーして`.env`を作成:

```bash
cp .env.example .env
```

`.env`ファイルは通常、そのまま使用できます:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_MAP_TILES_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_VILLAGE_CENTER_LAT=36.17773082095139
VITE_VILLAGE_CENTER_LNG=136.62608115875494
VITE_VILLAGE_RADIUS_KM=5.0
```

### 3.3 フロントエンドサーバーの起動

```bash
npm run dev
```

Viteが起動すると、以下のようなメッセージが表示されます:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## 4. アプリケーションへのアクセス

ブラウザで以下のURLを開きます:

```
http://localhost:5173
```

## 5. 動作確認

### 5.1 ユーザー登録

1. 「新規登録」タブをクリック
2. 必要な情報を入力（メールアドレスまたはユーザー名、ニックネーム、パスワード）
3. 「登録」ボタンをクリック

### 5.2 チェックイン機能のテスト

**注意**: チェックイン機能は、実際に白峰エリア（中心座標から5km以内）にいる必要があります。

開発時にテストする場合は、以下の方法があります:

#### 方法1: ブラウザのロケーションスプーフィング

1. Chrome DevToolsを開く (F12)
2. 「...」メニュ→ More tools → Sensors
3. Location を "Custom location" に設定
4. 白峰の座標を入力:
   - Latitude: `36.17773082095139`
   - Longitude: `136.62608115875494`

#### 方法2: 開発時に距離チェックを一時的に無効化

`backend/src/routes/checkins.js` の `isWithinVillageRange` チェックをコメントアウト（本番環境では必ず有効化すること）

## 6. トラブルシューティング

### データベース接続エラー

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解決方法**:
- PostgreSQLが起動しているか確認: `pg_ctl status` (Windowsの場合はサービスを確認)
- `.env`のDATABASE_URLが正しいか確認

### CORS エラー

```
Access to fetch at 'http://localhost:3000/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**解決方法**:
- バックエンドの`.env`で`CORS_ORIGIN=http://localhost:5173`が設定されているか確認
- バックエンドサーバーを再起動

### マイグレーションエラー

```
error: relation "..." already exists
```

**解決方法**:
- データベースをリセット:
  ```bash
  psql -U postgres -d shiramine_village -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  npm run migrate
  ```

## 7. 次のステップ

基本機能が動作したら、以下の機能の実装に進みます:

1. **アバターシステム** - ドット風アバターのカスタマイズ
2. **クエストシステム** - 地域タスクの作成と参加
3. **マップ機能** - MapLibreを使用した地図表示
4. **チャット機能** - Socket.IOを使用したリアルタイムチャット
5. **日記ログ** - X風の投稿機能
6. **カレンダー統合** - 予定管理

詳細は各機能のドキュメントを参照してください。
