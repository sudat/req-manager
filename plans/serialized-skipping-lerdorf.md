# 業務領域IDの表示修正プラン

## 難易度
★☆☆
根拠: 1 file, 1 line change, 0 components
リスク: パラメータ変更のみ、ロジック変更なし

## 問題の概要
`/business/GL` から起動すると `/chat?screen=BD&bdId=BIZ-003` に遷移し、
「業務領域 BIZ-003 から起動されました」と表示される。
期待：`GL` と表示されてほしい。

## 原因分析

### データ構造
DBの `business_domains` テーブル:
- `id`: `BIZ-003` （内部ID、プライマリキー）
- `area`: `GL` （業務領域コード、ユーザーが見る識別子）

### 問題箇所
`app/(with-sidebar)/business/[id]/page.tsx:172` の「AIで追加」ボタンのみ、
他のリンクと異なり `businessId`（内部ID）を使用している。

```typescript
// 現在（問題）
<Link href={businessId ? `/chat?screen=BD&bdId=${businessId}` : "/chat"}>

// 他のリンク（正しい）- 178行目、184行目など
<Link href={`/chat?screen=BD&bdId=${routeArea}&mode=fix`}>
```

`routeArea` は既に定義されている（46行目）:
```typescript
const routeArea = resolvedArea ?? businessKey;  // "GL" などの業務領域コード
```

## 修正内容

### 対象ファイル
- `app/(with-sidebar)/business/[id]/page.tsx`

### 修正箇所（172行目）

**Before:**
```typescript
<Link href={businessId ? `/chat?screen=BD&bdId=${businessId}` : "/chat"}>
```

**After:**
```typescript
<Link href={routeArea ? `/chat?screen=BD&bdId=${routeArea}` : "/chat"}>
```

## 検証方法
1. `http://localhost:3000/business/GL` にアクセス
2. 「AIで追加」ボタンをクリック
3. 遷移先URLが `/chat?screen=BD&bdId=GL` になっていることを確認
4. 画面に「業務領域 GL から起動されました」と表示されることを確認
