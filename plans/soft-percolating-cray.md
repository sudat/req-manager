# req-manager コード品質レビュー＆リファクタリング計画

## 調査結果サマリー

### 全体評価
- **過剰な分割設計**: 検出されず（適切な粒度）
- **抽象化不足**: 完全重複コードが3箇所存在（DRY違反）
- **設計品質**: 全体的に良好、Colocationパターンが適切に適用されている

---

## 検出された問題と優先度

### P1: 高優先度（即座に対応すべき）

| 問題 | ファイル | 行数 | 根拠 |
|------|----------|------|------|
| AcceptanceCriteriaInput重複 | `components/forms/` と `app/business/manual-add/components/` | 64行×2 | 完全同一コード |
| RequirementCard重複 | `components/forms/` と `app/business/manual-add/components/` | 150行×2 | インポートパスのみ差異 |
| types.ts重複 | `lib/domain/forms.ts` と `app/business/manual-add/types.ts` | - | 同一型が2箇所に存在 |

### P2: 中優先度（近い将来対応）

| 問題 | ファイル | 行数 | 根拠 |
|------|----------|------|------|
| SelectionDialog重複 | `components/forms/` と `app/business/manual-add/components/` | 147行 vs 180行 | 機能同等、実装差異あり |
| sidebar.tsx内部重複 | `components/layout/sidebar.tsx` | 230行 | 同一リストレンダリングが2箇所 |

### P4: 低優先度（現状維持可）

| 問題 | ファイル | 評価 |
|------|----------|------|
| failIfMissingConfig重複 | `lib/data/*.ts`（7ファイル） | 7行の小関数、変更頻度低 |
| useAsyncData配置 | `app/business/[id]/tasks/[taskId]/hooks/` | 使用箇所拡大時に移動 |
| Prop drilling | 編集ページ全般 | 2-3階層のため許容範囲 |

---

## リファクタリング計画

### 難易度: ★☆☆
**根拠**: 4 files削除, 2 files修正, 0 components影響
**リスク**: インポートパス変更のみ、機能への影響なし

### Step 1: AcceptanceCriteriaInput統合
1. `app/business/manual-add/components/AcceptanceCriteriaInput.tsx` を削除
2. `app/business/manual-add/page.tsx` のインポートを修正:
   ```typescript
   // Before
   import { AcceptanceCriteriaInput } from "./components/AcceptanceCriteriaInput";
   // After
   import { AcceptanceCriteriaInput } from "@/components/forms/AcceptanceCriteriaInput";
   ```

### Step 2: RequirementCard統合
1. `app/business/manual-add/components/RequirementCard.tsx` を削除
2. インポートを修正:
   ```typescript
   // Before
   import { RequirementCard } from "./components/RequirementCard";
   // After
   import { RequirementCard } from "@/components/forms/requirement-card";
   ```

### Step 3: types.ts統合
1. `app/business/manual-add/types.ts` を削除
2. 各ファイルで `@/lib/domain` からインポートするよう修正

### Step 4: SelectionDialog統合
1. `app/business/manual-add/components/SelectionDialog.tsx` を削除
2. `components/forms/SelectionDialog` を使用するよう修正

### Step 5: 動作確認
1. `bun run build` でビルドエラーがないことを確認
2. `bun run dev` で画面表示を確認
3. 業務手動追加画面（/business/manual-add）の動作確認

---

## 対応しない項目（YAGNI適用）

| 項目 | 理由 |
|------|------|
| failIfMissingConfig共通化 | 7行の小関数、7ファイルで使用。共通化の効果より修正コストが大きい |
| useAsyncData移動 | 現在1箇所でのみ使用。使用箇所が増えた段階で移動 |
| Prop drilling解消（Context導入） | 現在2-3階層。4階層以上になった段階で検討 |
| sidebar.tsx分割 | 230行は許容範囲。今回のスコープ外 |

---

## 削除対象ファイル一覧

```
app/business/manual-add/
├── components/
│   ├── AcceptanceCriteriaInput.tsx  ← 削除
│   ├── RequirementCard.tsx          ← 削除
│   └── SelectionDialog.tsx          ← 削除
└── types.ts                         ← 削除
```

---

## 検証方法

1. **ビルド確認**: `bun run build`
2. **開発サーバー起動**: `bun run dev`
3. **画面動作確認**: Playwright MCPで `/business/manual-add` にアクセスし、フォーム操作を確認
