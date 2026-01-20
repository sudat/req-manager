# システム機能詳細画面の機能分類表示を日本語化する

## 問題
- **詳細画面**: 機能分類が "screen" と英語で表示される
- **一覧画面**: 「画面」と日本語で表示される

## 原因
`components/system-domains/basic-info-section.tsx` で `srf.category` を直接表示している。

## 既存のマッピング
一覧画面 (`app/system-domains/[id]/page.tsx`) に既に `categoryLabels` が存在する：
```typescript
const categoryLabels: Record<string, string> = {
  screen: "画面",
  internal: "内部",
  interface: "IF",
};
```

## 修正内容

### 対象ファイル
- `components/system-domains/basic-info-section.tsx`

### 手順
1. `categoryLabels` マッピングを追加（一覧画面と同じ定義）
2. 機能分類表示を `{categoryLabels[srf.category]}` に変更

### 追加コード
```typescript
const categoryLabels: Record<string, string> = {
  screen: "画面",
  internal: "内部",
  interface: "IF",
};
```

### 変更箇所（40行目）
```typescript
// 修正前
<span className="ml-2 text-slate-900">{srf.category}</span>

// 修正後
<span className="ml-2 text-slate-900">{categoryLabels[srf.category]}</span>
```

## 難易度
```
難易度: ★☆☆
根拠: 1 files, ~10 lines, 1 component
リスク: 低（表示ロジックのみの変更）
```

## 検証方法
1. http://localhost:3000/system-domains/AR/SRF-001 にアクセス
2. 機能分類が「画面」と日本語で表示されていることを確認
3. 他の分類値（内部、IF）も正しく表示されることを確認
