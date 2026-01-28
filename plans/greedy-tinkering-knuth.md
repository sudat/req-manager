# 関連業務要件セクションのレイアウト変更

## 概要
システム要件カード内の「関連業務要件」セクションを、枠付きデザインから「受入条件」と同じ上ボーダー区切りのレイアウトに変更する。

## 難易度
**難易度**: ★☆☆
**根拠**: 1ファイル、約10行の変更、単一コンポーネントのみ。成功率95%
**リスク**: 低 - 表示スタイルの変更のみ、ロジック変更なし

---

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `components/system-domains/system-requirements-section.tsx` | `BusinessRequirementLink` コンポーネントのスタイル変更 |

---

## 詳細変更内容

### 対象コンポーネント
`BusinessRequirementLink`（166-217行目）

### 変更1: 関連業務要件がない場合（166-172行目）

**変更前**:
```tsx
<div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 text-[12px] text-slate-500">
  <SectionLabel className="mb-2">関連業務要件</SectionLabel>
  関連業務要件が未設定です。
</div>
```

**変更後**:
```tsx
<div className="border-t border-slate-100 pt-3 text-[12px] text-slate-500">
  <div className="text-[12px] font-medium text-slate-500 mb-2">関連業務要件</div>
  関連業務要件が未設定です。
</div>
```

### 変更2: 関連業務要件がある場合（175-216行目）

**変更前**:
```tsx
<div className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
  <SectionLabel className="mb-2">関連業務要件</SectionLabel>
  <div className="space-y-1.5">
    {/* ... */}
  </div>
</div>
```

**変更後**:
```tsx
<div className="border-t border-slate-100 pt-3">
  <div className="text-[12px] font-medium text-slate-500 mb-2">関連業務要件</div>
  <div className="space-y-1.5">
    {/* ... */}
  </div>
</div>
```

---

## スタイル変更のポイント

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| 外枠 | `rounded-md border border-slate-200` | ❌ 削除 |
| 背景色 | `bg-slate-50/70` | ❌ 削除 |
| パディング | `p-3` | `pt-3`（上のみ） |
| 上ボーダー | ❌ なし | `border-t border-slate-100` |
| ラベル | `SectionLabel`（11px, uppercase） | `text-[12px] font-medium text-slate-500` |

---

## 検証方法

### 手順
1. ローカル開発サーバーを起動
   ```bash
   bun run dev
   ```
2. Playwright MCP でシステム機能詳細ページにアクセス
   ```
   URL: http://localhost:3002/system-domains/GL/SRF-017
   ```
3. システム要件カードを展開
4. 以下を確認：
   - [ ] 「関連業務要件」に枠（border）がなくなっている
   - [ ] 背景色が白（グレー背景なし）
   - [ ] 上ボーダー（`border-t`）で前セクションと区切られている
   - [ ] ラベルのスタイルが「受入条件」と同じ（12px, font-medium, slate-500）
   - [ ] 関連業務要件なしの場合も同様のスタイル

### 期待される表示イメージ

**変更前**:
```
┌─────────────────────────────┐
│ 関連業務要件                  │  ← 枠付き + グレー背景
│ ┌─────────────────────────┐ │
│ │ BR-001 要件名           │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**変更後**:
```
──────────────────────────────  ← 上ボーダーのみ
関連業務要件                    ← シンプルなラベル
  BR-001 要件名
```
