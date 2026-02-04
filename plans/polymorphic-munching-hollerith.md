# チャット画面のスクロールバー問題修正計画（v2）

## 問題の概要

**当初の問題（解決済み）:** メッセージがまだない状態でスクロールバーが表示されていた
**新たな問題（今回修正）:** メッセージを追加してもスクロールバーが表示されず、スクロールできない

## 根本原因（debug-runtime で特定）

`chat-container.tsx:476` に追加した `overflow-hidden` が、子要素の `overflow-y-auto` を上書きしている。

```tsx
// 現在の構造
<div className="relative flex-1 overflow-hidden">  // ← 親が全オーバーフローを抑制
  <div className="relative flex-1 overflow-y-auto">  // ← 子の縦スクロールが無効化
```

**CSSの仕様:**
- 親の `overflow: hidden` は、子要素がはみ出した場合もクリップする
- 子の `overflow-y: auto` は有効だが、親が先にコンテンツを隠してしまうため、スクロールバーが表示されない

## 修正方針

親要素を `overflow-hidden` から `overflow-x-hidden` に変更し、**横方向のオーバーフローのみ抑制**する。

## 変更ファイル

### 1. `components/ai-chat/chat-container.tsx`

**行476を変更:**

```diff
- <div className="relative flex-1 overflow-hidden">
+ <div className="relative flex-1 overflow-x-hidden">
```

**変更の理由:**
- `overflow-hidden` → `overflow-x-hidden` に変更
- 横方向のオーバーフローのみ抑制（初期表示の不要なスクロールバー対策）
- 縦方向のスクロールは子要素（ChatMessagesの `overflow-y-auto`）に委譲

### 2. `components/ai-chat/chat-messages.tsx`

**変更なし**

空状態（行113）とメッセージあり（行137）の両方が正しく動作します。

## 検証方法

### 1. 空状態でのスクロールバー確認
```
1. ブラウザで http://localhost:3000/chat を開く
2. ハードリフレッシュ（Ctrl+Shift+R または Cmd+Shift+R）
3. メッセージがない状態で、右側にスクロールバーが表示され**ない**ことを確認
```

### 2. メッセージ追加後のスクロール確認
```
1. メッセージを送信する
2. メッセージが画面の高さを超えるまで追加する
3. 右側にスクロールバーが表示されることを確認
4. スクロールが正しく動くことを確認
5. 最新のメッセージが見える位置に自動スクロールされることを確認
```

### 3. E2Eテスト（Playwright MCP）
```bash
# 開発サーバー起動
bun run dev

# Playwright MCP で以下を確認
# - 空状態でスクロールバーなし
# - メッセージ送信後にスクロールバー表示
# - スクロール動作の確認
```

## 難易度評価
```
難易度: ★☆☆ / ★★★
根拠: 1 file (chat-container.tsx), 1 location, 1 word change
リスク: 低（CSSクラスの一部変更のみ、既存機能への影響は最小限）
```

## 備考

### CSS Overflow の挙動
- `overflow: hidden`: 全方向のオーバーフローを抑制
- `overflow-x: hidden`: 横方向のみ抑制、縦方向は子要素に委譲
- `overflow-y: auto`: 縦方向のスクロールを許可（コンテンツがオーバーフローした場合のみスクロールバー表示）

### 親子関係の設計パターン
```
推奨構造:
┌─ 親: overflow-x-hidden（横スクロール抑制）
│  └─ 子: overflow-y-auto（縦スクロール許可）
│     └─ コンテンツ（縦に伸びる）
```

### 修正の要点
- **最小の変更**: `overflow-hidden` → `overflow-x-hidden` の1ワード変更のみ
- **影響分離**: 横方向と縦方向のオーバーフロー制御を分離
- **既存維持**: ChatMessages の `overflow-y-auto` はそのまま維持
