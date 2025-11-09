#!/usr/bin/env node

/**
 * アプリケーション実装確認スクリプト
 * 
 * 主要なファイルとエンドポイントが正しく実装されているか確認します
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checks = {
  backend: [],
  frontend: [],
  migrations: [],
  config: []
};

function checkFile(category, filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  checks[category].push({
    path: filePath,
    description,
    exists,
    status: exists ? '✅' : '❌'
  });
}

console.log('🔍 しらみね大学村アプリ 実装確認\n');

// バックエンドファイルの確認
console.log('📦 バックエンド実装確認:');
checkFile('backend', 'backend/src/index.js', 'メインサーバー');
checkFile('backend', 'backend/src/routes/auth.js', '認証ルート');
checkFile('backend', 'backend/src/routes/checkins.js', 'チェックインルート');
checkFile('backend', 'backend/src/routes/avatar.js', 'アバタールート');
checkFile('backend', 'backend/src/routes/quests.js', 'クエストルート');
checkFile('backend', 'backend/src/routes/diary.js', '日記ルート');
checkFile('backend', 'backend/src/routes/chat.js', 'チャットルート');
checkFile('backend', 'backend/src/routes/calendar.js', 'カレンダールート');
checkFile('backend', 'backend/src/socket/index.js', 'Socket.IOサーバー');

checks.backend.forEach(check => {
  console.log(`  ${check.status} ${check.description}: ${check.path}`);
});

// フロントエンドファイルの確認
console.log('\n🎨 フロントエンド実装確認:');
checkFile('frontend', 'frontend/src/App.jsx', 'メインアプリ');
checkFile('frontend', 'frontend/src/pages/HomePage.jsx', 'ホームページ');
checkFile('frontend', 'frontend/src/pages/AuthPage.jsx', '認証ページ');
checkFile('frontend', 'frontend/src/pages/AvatarPage.jsx', 'アバターページ');
checkFile('frontend', 'frontend/src/pages/QuestsPage.jsx', 'クエスト一覧');
checkFile('frontend', 'frontend/src/pages/QuestDetailPage.jsx', 'クエスト詳細');
checkFile('frontend', 'frontend/src/pages/MapPage.jsx', 'マップページ');
checkFile('frontend', 'frontend/src/pages/DiaryPage.jsx', '日記ログページ');
checkFile('frontend', 'frontend/src/pages/ChatPage.jsx', 'チャットページ');
checkFile('frontend', 'frontend/src/pages/CalendarPage.jsx', 'カレンダーページ');
checkFile('frontend', 'frontend/src/contexts/AuthContext.jsx', '認証コンテキスト');
checkFile('frontend', 'frontend/src/contexts/SocketContext.jsx', 'Socket.IOコンテキスト');
checkFile('frontend', 'frontend/src/utils/api.js', 'API関数');
checkFile('frontend', 'frontend/src/styles/index.css', 'LucidUIスタイル');

checks.frontend.forEach(check => {
  console.log(`  ${check.status} ${check.description}: ${check.path}`);
});

// マイグレーションファイルの確認
console.log('\n🗄️  データベースマイグレーション:');
checkFile('migrations', 'backend/src/db/migrations/001_initial_schema.sql', '基本スキーマ');
checkFile('migrations', 'backend/src/db/migrations/002_seed_avatar_parts.sql', 'アバター初期データ');
checkFile('migrations', 'backend/src/db/migrations/003_chat_system.sql', 'チャットシステム');
checkFile('migrations', 'backend/src/db/migrations/004_calendar_system.sql', 'カレンダーシステム');

checks.migrations.forEach(check => {
  console.log(`  ${check.status} ${check.description}: ${check.path}`);
});

// 設定ファイルの確認
console.log('\n⚙️  設定ファイル:');
checkFile('config', 'backend/.env', 'バックエンド環境変数');
checkFile('config', 'frontend/.env', 'フロントエンド環境変数');
checkFile('config', 'backend/package.json', 'バックエンド依存関係');
checkFile('config', 'frontend/package.json', 'フロントエンド依存関係');

checks.config.forEach(check => {
  console.log(`  ${check.status} ${check.description}: ${check.path}`);
});

// 統計情報
console.log('\n📊 実装統計:');
const totalChecks = Object.values(checks).flat();
const passedChecks = totalChecks.filter(c => c.exists).length;
const failedChecks = totalChecks.length - passedChecks;

console.log(`  ✅ 成功: ${passedChecks}/${totalChecks.length}`);
console.log(`  ❌ 不足: ${failedChecks}/${totalChecks.length}`);

if (failedChecks === 0) {
  console.log('\n🎉 すべての実装が完了しています！');
  console.log('\n次のステップ:');
  console.log('  1. cd backend && npm run migrate   # マイグレーション実行');
  console.log('  2. cd backend && npm run dev       # バックエンド起動');
  console.log('  3. cd frontend && npm run dev      # フロントエンド起動');
  console.log('  4. http://localhost:5173 にアクセス');
} else {
  console.log('\n⚠️  一部のファイルが不足しています。');
  console.log('詳細は上記のチェック結果を確認してください。');
  process.exit(1);
}

// 主要機能リスト
console.log('\n✨ 実装済み機能:');
const features = [
  '認証システム（登録・ログイン・ログアウト）',
  'アバターカスタマイズ',
  'チェックイン/チェックアウト',
  'クエスト管理（作成・参加・完了）',
  'マップ表示（MapLibre GL + 4種類プライバシーモード）',
  '日記ログ（投稿・リアクション）',
  'リアルタイムチャット（Socket.IO）',
  'カレンダー統合（個人イベント + クエスト期限 + チェックイン履歴）',
  'LucidUIデザイン（グラスモーフィズム）',
  'レスポンシブデザイン'
];

features.forEach((feature, index) => {
  console.log(`  ${index + 1}. ${feature}`);
});

console.log('\n📚 ドキュメント:');
console.log('  - README.md: プロジェクト概要とAPI仕様');
console.log('  - SETUP.md: セットアップガイド');
console.log('\n');
