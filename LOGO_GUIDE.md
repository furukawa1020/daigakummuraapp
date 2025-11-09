# しらみね大学村 - ロゴ使用ガイド

## ロゴファイル

- **ファイルパス**: `/frontend/public/images/shiramine-logo.png`
- **使用箇所**: 
  - 認証ページ (AuthPage.jsx)
  - ホームページ (HomePage.jsx)
  - ファビコン・アプリアイコン (index.html)
  - PWA マニフェスト (manifest.json)

## ロゴの特徴

「しらみね大学村」のロゴは、シンプルで認識しやすいデザインです。
- テキスト: 「しらみね」と「大学村」
- アイコン: 山/家のシルエット（白峰地域を象徴）
- カラー: モノクロ（背景に応じて適応可能）

## 実装箇所

### 1. 認証ページ (AuthPage.jsx)
```jsx
<div className="auth-logo">
  <img src="/images/shiramine-logo.png" alt="しらみね大学村" />
</div>
```
- サイズ: 最大280px
- エフェクト: drop-shadow

### 2. ホームページ (HomePage.jsx)
```jsx
<div className="home-logo">
  <img src="/images/shiramine-logo.png" alt="しらみね大学村" />
</div>
```
- サイズ: 最大320px
- エフェクト: drop-shadow

### 3. HTMLヘッダー (index.html)
```html
<link rel="icon" type="image/png" href="/images/shiramine-logo.png" />
<link rel="apple-touch-icon" href="/images/shiramine-logo.png" />
```
- ファビコンとして使用
- iOSホーム画面アイコン

### 4. PWA マニフェスト (manifest.json)
```json
"icons": [
  {
    "src": "/images/shiramine-logo.png",
    "sizes": "192x192",
    "type": "image/png"
  }
]
```

## スタイリング

### Auth.css
```css
.auth-logo img {
  max-width: 280px;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
}
```

### HomePage.css
```css
.home-logo img {
  max-width: 320px;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}
```

## レスポンシブ対応

ロゴは画面サイズに応じて自動的にスケーリングされます:
- デスクトップ: フルサイズ (280-320px)
- タブレット: 中サイズ (60-80%)
- モバイル: 小サイズ (50-70%)

## アクセシビリティ

すべてのロゴ画像には適切な `alt` テキストが設定されています:
```jsx
alt="しらみね大学村"
```

## 将来の拡張

必要に応じて以下を追加可能:
- ダークモード用のロゴバリエーション
- SVG版のロゴ（スケーラビリティ向上）
- アニメーション付きロゴ（読み込み時など）
