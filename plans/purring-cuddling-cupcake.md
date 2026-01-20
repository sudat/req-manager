# 簡素化候補ファイルの分析

## 分析結果

コードベース内の150行以上のファイルを分析し、簡素化の候補を特定しました。

---

## 優先度 HIGH: 簡素化推奨

### 1. `app/tickets/[id]/edit/page.tsx` (325行)

**問題点:**
- 11個のuseState
- 1つのuseEffect (70行、複雑なデータフェッチと変換)
- 影響範囲のデータ変換ロジックがuseEffect内に混在
- handleSubmitで影響範囲の削除・再作成ロジックが含まれている

**簡素化アプローチ:**
1. カスタムフック `use-ticket-edit-form.ts` へフォーム状態管理を抽出
2. カスタムフック `use-ticket-impact-scopes.ts` へ影響範囲のデータフェッチ・変換ロジックを抽出
3. 影響範囲の保存ロジックを `lib/data/` またはユーティリティ関数へ

**目標:** 325行 → 150行程度 (54%削減)

---

### 2. `hooks/use-related-requirements.ts` (222行)

**問題点:**
- 3個のuseState
- 1つのuseEffect (データフェッチ)
- ファイル内に3つのヘルパー関数が定義されている
- データフェッチと複雑な変換ロジックが混在

**簡素化アプローチ:**
1. ヘルパー関数を `lib/data/related-requirements-transformers.ts` へ抽出
2. 変換ロジックを純粋関数として分離

**目標:** 222行 → 120行程度 (46%削減)

---

## 優先度 MEDIUM: 検討推奨

### 3. `app/system-domains/[id]/[srfId]/edit/hooks/useSystemFunctionForm.ts` (334行)

**現状:**
- 16個のuseState
- 1つのuseEffect
- 複雑なフォーム状態管理

**評価:**
- 既にカスタムフックとして切り出されている
- フォーム管理として責務は明確
- 16個のuseStateはフォーム項目に対応しているため妥当
- **簡素化の優先度は低い**

---

### 4. `app/business/[id]/tasks/[taskId]/page.tsx` (373行)

**現状:**
- 複数の小さなコンポーネントに既に分割されている
- メインコンポーネントはデータフローとコンポジションのみ
- useMemoを適切に使用

**評価:**
- 既に良い構造にリファクタリング済み
- **簡素化の余地は小さい**

---

## 詳細実装計画

### Phase 1: `use-related-requirements.ts` の簡素化（先行）

**理由**: 依存関係が少なく、変換ロジックの分離パターンを確立できる

#### 新規作成ファイル

1. **`lib/data/transformers/related-requirements-transformer.ts`**（約120行）
   - `buildSysReqToBizReqsMap()`：システム要件→業務要件のマップ構築
   - `buildSysReqToBizReqsMapFromSystemReqs()`：システム要件からのマップ構築
   - `buildRelatedRequirements()`：関連要件情報の構築

2. **`hooks/use-related-requirements-data.ts`**（約90行）
   - データフェッチのみに集中
   - エラーハンドリングとローディング状態

#### 変更ファイル

1. **`hooks/use-related-requirements.ts`**（222行→約50行）
   - データフェッチフックと変換器を統合

---

### Phase 2: `app/tickets/[id]/edit/page.tsx` の簡素化

#### 新規作成ファイル

1. **`hooks/use-change-request-edit.ts`**（約120行）
   - 変更要求編集データのフェッチ
   - 影響範囲の読み込みと変換
   - フォーム状態の管理
   - 保存処理

2. **`lib/data/transformers/impact-scope-transformer.ts`**（約80行）
   - `transformImpactScopesToSelectedRequirements(impactScopes, bizReqs, sysReqs)`

3. **`lib/data/transformers/acceptance-input-builder.ts`**（約60行）
   - `buildAcceptanceInputs(selectedRequirements, changeRequestId)`

4. **`components/tickets/change-request-edit-form.tsx`**（約180行）
   - 基本情報フォーム部分の抽出

#### 変更ファイル

1. **`app/tickets/[id]/edit/page.tsx`**（325行→約80行）
   - データフェッチと保存ロジックをフックに移動
   - フォームUIをコンポーネントに抽出

---

## 実施順序

### Step 1: `use-related-requirements.ts` 簡素化
1. `lib/data/transformers/related-requirements-transformer.ts` 作成
2. `hooks/use-related-requirements-data.ts` 作成
3. `hooks/use-related-requirements.ts` リファクタリング
4. 動作確認

### Step 2: `tickets/[id]/edit/page.tsx` 簡素化
1. `lib/data/transformers/impact-scope-transformer.ts` 作成
2. `lib/data/transformers/acceptance-input-builder.ts` 作成
3. `hooks/use-change-request-edit.ts` 作成
4. `components/tickets/change-request-edit-form.tsx` 作成
5. `app/tickets/[id]/edit/page.tsx` リファクタリング
6. 動作確認

---

## Critical Files

### 参照パターン
- `hooks/use-business-requirement-cascade.ts` - カスケードデータフェッチ
- `hooks/use-system-requirement-cascade.ts` - カスケードデータフェッチ
- `hooks/use-requirement-selection.ts` - 選択状態管理
- `components/tickets/ticket-basic-info-form.tsx` - フォームコンポーネント分離
- `lib/data/requirement-mapper.ts` - 変換ロジック分離

---

## 検証手順

### E2E確認
```bash
# 対象: 変更要求編集ページ /tickets/:id/edit
# 確認項目:
# - 既存データの読み込み
# - 影響範囲の変更
# - 保存と反映
```

---

## 難易度評価

**難易度: ★★☆**

| 根拠 | 値 |
|------|-----|
| 新規ファイル | 7ファイル |
| 変更ファイル | 2ファイル |
| 変更行数 | 約550行 |
| 影響コンポーネント | 2ページ + 2フック |
