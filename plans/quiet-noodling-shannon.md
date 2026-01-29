# 実装計画: /queryルート削除とAIチャットメニュー追加

## 概要

- `/query` ルートとページの完全削除
- サイドバーメニーから「照会」を削除し、「AIチャット」を追加
- チャットコンテナのレイアウト修正（サイドバー対応）

---

## 変更ファイル一覧

| ファイル | アクション | 変更内容 |
|---------|----------|---------|
| `app/(with-sidebar)/query/page.tsx` | 削除 | ファイル全体（125行） |
| `components/layout/sidebar.tsx` | 変更 | インポート更新、menuConfig修正 |
| `components/ai-chat/chat-container.tsx` | 変更 | `h-screen` → `h-[calc(100dvh)]` |

---

## 詳細変更内容

### 1. sidebar.tsx の変更

**インポートの更新（5-18行目）**
```typescript
// 削除: Search
// 追加: Bot
import {
  // ... 他のインポート
  Bot,             // ← 追加
  // Search,       // ← 削除
  // ...
}
```

**menuConfig の変更（40-55行目）**
```typescript
const menuConfig: MenuConfig[] = [
  { type: "item", key: "dashboard", label: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  // { type: "item", key: "query", label: "照会", href: "/query", icon: Search },  // ← 削除
  { type: "item", key: "product-requirement", label: "プロダクト要件", href: "/product-requirement", icon: FileText },
  { type: "item", key: "chat", label: "AIチャット", href: "/chat", icon: Bot },  // ← 追加
  { type: "divider" },
  // ... 他のメニュー項目
]
```

### 2. chat-container.tsx の変更

**262行目の修正**
```typescript
// 変更前
<div className="flex flex-col h-screen bg-white">

// 変更後
<div className="flex flex-col h-[calc(100dvh)] bg-white">
```

**理由**: `h-screen` はサイドバーがあるレイアウトでは問題を引き起こす。`h-[calc(100dvh)]` はモバイルブラウザのアドレスバーを考慮した最新のベストプラクティス。

---

## 検証計画

### 1. サイドバーメニューの確認
- [ ] 「照会」メニューが表示されない
- [ ] 「AIチャット」メニューが表示される
- [ ] アイコン（Bot）が正しく表示される

### 2. チャットページのレイアウト確認
- [ ] サイドバー展開時：チャットが正しい幅で表示される
- [ ] サイドバー折りたたみ時：チャットが正しい幅で表示される
- [ ] モバイル時：サイドバーがオーバーレイで表示される
- [ ] メッセージ入力エリアが常に表示される

### 3. E2Eテスト（Playwright MCP）
- デスクトップ（1280px+）
- タブレット（768px - 1279px）
- モバイル（< 768px）

---

## 難易度評価

**難易度**: ★☆☆

**根拠**: 3 files、約20 lines、2 components

**リスク**: 中リスク（チャットのレイアウト修正はレスポンシブ動作の確認が必要）

---

## Critical Files

- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/layout/sidebar.tsx`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/ai-chat/chat-container.tsx`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/app/(with-sidebar)/query/page.tsx` (削除対象)
