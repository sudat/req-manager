# 仕様差分析: BusinessページとSystem-domainsページの「機能数」列

## 調査概要
- **Businessページ**: http://localhost:3000/business
- **System-domainsページ**: http://localhost:3000/system-domains
- **課題**: System-domainsの「機能数」列の文字サイズがBusinessページより小さい

---

## ファイル構成

| ページ | メインファイル | 設定ファイル |
|--------|----------------|--------------|
| Business | `app/(with-sidebar)/business/page.tsx` | `config/resource-lists.tsx:60-143` |
| System-domains | `app/(with-sidebar)/system-domains/page.tsx` | `config/resource-lists.tsx:151-204` |

**共通コンポーネント**: `components/resource-page/resource-list-page.tsx`

---

## 仕様差の詳細

### 1. Businessページの「要件数」カラム

**位置**: `config/resource-lists.tsx:97-118`

```typescript
{
    id: "businessReqCount",
    header: "業務要件数",
    cell: (biz) => (
        <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">
                {biz.businessReqCount}
            </span>
            <span className="text-[11px] text-slate-400">件</span>
        </div>
    ),
},
```

**特徴**:
- 数字サイズ: `text-[16px]` (大きい)
- フォントウェイト: `font-semibold` (太字)
- 色: `text-slate-900` (濃い)
- 「件」ユニット付き: `text-[11px] text-slate-400`
- `tabular-nums` で数字の幅を揃える

---

### 2. System-domainsページの「機能数」カラム

**位置**: `config/resource-lists.tsx:174-179`

```typescript
{
    id: "functionCount",
    header: "機能数",
    cell: (domain) => (
        <span className="font-mono text-[13px] text-slate-700">
            {domain.functionCount ?? 0}
        </span>
    ),
}
```

**特徴**:
- 数字サイズ: `text-[13px]` (小さい)
- フォントウェイト: 指定なし (標準)
- 色: `text-slate-700` (中程度)
- 「件」ユニットなし

---

## 比較サマリー

| 要素 | Businessページ | System-domainsページ | 差異 |
|------|----------------|---------------------|------|
| 数字サイズ | **16px** | 13px | **+3px (23%大きい)** |
| フォントウェイト | **semibold (600)** | normal (400) | **太字** |
| 色 | **slate-900** | slate-700 | **濃い** |
| ユニット表示 | **あり (「件」)** | なし | **情報量多い** |
| レイアウト | **flex container** | 単一span | **複雑** |

---

## 設計意図の分析

### Businessページ: 強調型パターン
```
┌─────────────────────┐
│ [大きな数字] [小さい単位] │
│  16px       11px     │
└─────────────────────┘
```
- 要件数は**主要な指標**として扱われている
- ユーザーが一目で重要な数値を把握できるよう視覚的に強調
- データの重要度に応じたタイポグラフィの階層化

### System-domainsページ: シンプル型パターン
```
┌─────────────────────┐
│ [数字]               │
│  13px               │
└─────────────────────┘
```
- 機能数は**単なる情報の一部**として扱われている
- 他の説明文と同じ視覚的ウェイト
- より控えめで一貫性のあるデザイン

---

## 結論

この違いは、**データの重要度の違い**を反映している:

- **Businessページ**: 要件数は主要な管理対象であり、ユーザーが最も注目するメトリック
- **System-domainsページ**: 機能数は補助的な情報に過ぎず、説明文と同程度の扱い

---

## 検討事項

### 仕様統一の可能性

両者の表示を統一する場合、以下の選択肢がある:

| 選択肢 | 説明 | メリット | デメリット |
|--------|------|----------|------------|
| **A. 現状維持** | 重要度に応じてスタイルを使い分ける | データの重要度が視覚的に伝わる | 画面間で一貫性がない |
| **B. System-domainsを強化** | 機能数も16px+太字に統一 | 一貫性が出る | 全てが強調されて重要度が伝わらない |
| **C. 中間に統一** | 両方14px程度に統一 | 一貫性がありすぎず控えすぎない | どちらの特徴も失う |
| **D. カスタマイズ可能に** | ユーザー設定で列表示を変更可能 | 柔軟性が高い | 実装コストが高い |

---

## 変更対象ファイル（統一する場合）

統一する場合は `config/resource-lists.tsx` を修正:

1. **System-domainsの機能数を強化する場合**: Line 174-179
2. **Businessの要件数を控えめにする場合**: Line 97-118
3. **両方を中間に統一する場合**: 上記両方

---

## 確認事項

- [x] この仕様差は意図的なものか？
- [x] 両者のスタイルを統一すべきか？
- [x] 統一する場合、どの方向性で？ → **System-domainsをBusinessスタイルに合わせる**

---

# 実装計画: System-domains → Businessスタイルに統一

## 変更内容
System-domainsページの「機能数」列を、Businessページの「要件数」列と同じスタイルに合わせる。

## 変更対象ファイル
- `config/resource-lists.tsx` Line 174-179

## 変更前後

### 変更前 (現在)
```typescript
{
    id: "functionCount",
    header: "機能数",
    className: "px-4 py-3",
    cell: (domain) => (
        <span className="font-mono text-[13px] text-slate-700">
            {domain.functionCount ?? 0}
        </span>
    ),
},
```

### 変更後 (Businessスタイル)
```typescript
{
    id: "functionCount",
    header: "機能数",
    className: "px-4 py-3",
    cell: (domain) => (
        <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">
                {domain.functionCount ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">件</span>
        </div>
    ),
},
```

## 具体的な変更点
1. `span` → `div` (flex container化)
2. `text-[13px]` → `text-[16px]` (数字サイズ拡大)
3. `font-semibold` を追加 (太字化)
4. `text-slate-700` → `text-slate-900` (色を濃く)
5. `tabular-nums` を追加 (数字を等幅に)
6. `items-baseline gap-1.5` のレイアウトを追加
7. `text-[11px] text-slate-400` の「件」ユニットを追加

---

## 難易度評価
**難易度: ★☆☆**
根拠: 1 file, 1箇所変更, 既存パターンの適用のみ
リスク: なし（Businessページで既に使用されている実績のあるパターン）

---

## 検証方法
1. http://localhost:3000/system-domains にアクセス
2. 「機能数」列の数字が大きく（16px）、太字で表示されることを確認
3. 「件」ユニットが付いていることを確認
4. Businessページの「要件数」と同じ見た目であることを確認
