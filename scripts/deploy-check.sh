#!/bin/bash

# デプロイ前チェックスクリプト

echo "🔍 デプロイ前チェックを開始..."

# カラーコード
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

# 1. 環境変数チェック
echo -e "\n📋 環境変数チェック..."

if grep -q "your-super-secret-jwt-key-change-this-in-production" backend/.env 2>/dev/null; then
  echo -e "${RED}❌ JWT_SECRET がデフォルト値のままです${NC}"
  errors=$((errors + 1))
else
  echo -e "${GREEN}✓ JWT_SECRET が設定されています${NC}"
fi

if grep -q "user:password@localhost" backend/.env 2>/dev/null; then
  echo -e "${YELLOW}⚠️  DATABASE_URL がローカルホストを指しています${NC}"
  warnings=$((warnings + 1))
fi

# 2. Node.js バージョンチェック
echo -e "\n📦 Node.js バージョンチェック..."
node_version=$(node -v)
echo "Node.js バージョン: $node_version"

# 3. 依存関係チェック
echo -e "\n📚 依存関係チェック..."

cd backend
if [ ! -d "node_modules" ]; then
  echo -e "${RED}❌ backend の依存関係がインストールされていません${NC}"
  errors=$((errors + 1))
else
  echo -e "${GREEN}✓ backend の依存関係はインストール済み${NC}"
fi
cd ..

cd frontend
if [ ! -d "node_modules" ]; then
  echo -e "${RED}❌ frontend の依存関係がインストールされていません${NC}"
  errors=$((errors + 1))
else
  echo -e "${GREEN}✓ frontend の依存関係はインストール済み${NC}"
fi
cd ..

# 4. ビルドテスト
echo -e "\n🔨 フロントエンドビルドテスト..."
cd frontend
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✓ フロントエンドのビルドが成功しました${NC}"
else
  echo -e "${RED}❌ フロントエンドのビルドに失敗しました${NC}"
  errors=$((errors + 1))
fi
cd ..

# 5. セキュリティチェック
echo -e "\n🔒 セキュリティチェック..."

if [ -f ".env" ]; then
  echo -e "${YELLOW}⚠️  ルートディレクトリに .env ファイルがあります${NC}"
  warnings=$((warnings + 1))
fi

if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo -e "${RED}❌ .gitignore に .env が含まれていません${NC}"
  errors=$((errors + 1))
else
  echo -e "${GREEN}✓ .env は .gitignore に含まれています${NC}"
fi

# 6. Git チェック
echo -e "\n📂 Git チェック..."

if [ -d ".git" ]; then
  if git diff --quiet; then
    echo -e "${GREEN}✓ コミットされていない変更はありません${NC}"
  else
    echo -e "${YELLOW}⚠️  コミットされていない変更があります${NC}"
    warnings=$((warnings + 1))
  fi
else
  echo -e "${YELLOW}⚠️  Git リポジトリが初期化されていません${NC}"
  warnings=$((warnings + 1))
fi

# 結果表示
echo -e "\n" 
echo "================================"
echo "📊 チェック結果"
echo "================================"
echo -e "${RED}エラー: $errors${NC}"
echo -e "${YELLOW}警告: $warnings${NC}"
echo ""

if [ $errors -eq 0 ]; then
  echo -e "${GREEN}✅ デプロイ準備が整いました！${NC}"
  exit 0
else
  echo -e "${RED}❌ エラーを修正してから再度実行してください${NC}"
  exit 1
fi
