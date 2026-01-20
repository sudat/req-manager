# コード簡素化分析レポート

## 分析対象範囲
- `components/tickets/` ディレクトリ
- `components/` ディレクトリ
- `lib/` ディレクトリ
- `app/tickets/` ディレクトリ
- `app/settings/` ディレクトリ

## 優先度高（High Priority）

### 1. `/app/tickets/page.tsx` - 239行
**問題点:**
- サイズ: 239行（Reactコンポーネントとして大きい）
- 複雑さ: 複数の状態管理、データフェッチ、フィルタリング、削除処理が混在
- ネスト: JSX内で条件分岐が多段

**簡素化案:**
1. カスタムフックの抽出: `useChangeRequestList()` - データフェッチ、フィルタリング、CRUD操作を集約
2. コンポーネント分割:
   - `TicketListHeader` - ヘッダー部分
   - `TicketListToolbar` - 検索・フィルターツールバー
   - `TicketListTable` - テーブル部分
3. 定数の外部ファイル化: `statusLabels`, `priorityLabels` を `/lib/utils/ticket-labels.ts` に移動（既に存在）

**期待効果:**
- メインコンポーネント: 239行 → ~80行
- 責任分離によりテスト容易性向上
- 再利用性向上

---

### 2. `/app/tickets/[id]/edit/page.tsx` - 213行
**問題点:**
- サイズ: 213行
- 複雑さ: 多数のuseState、データフェッチ、フォーム処理、バリデーション
- 重複: createページと類似したフォームロジック

**簡素化案:**
1. カスタムフックの抽出: `useTicketEditForm()` - フォーム状態、バリデーション、保存処理
2. 共通フォームコンポーネント化: `TicketBasicInfoForm` - create/editで共通利用（既に存在）
3. 定数の外部ファイル化: ステータス/優先度オプション

**期待効果:**
- メインコンポーネント: 213行 → ~100行
- create/editページでのロジック共有

---

### 3. `/app/settings/page.tsx` - 213行
**問題点:**
- サイズ: 213行
- 複雑さ: フォームバリデーション、状態管理
- 構造: ほとんどがJSXでロジックは少なめ

**簡素化案:**
1. カスタムフックの抽出: `useProjectSettings()` - GitHub URLバリデーション、保存処理
2. セクションコンポーネント化: `ProjectSettingsSection` - プロジェクト設定部分
3. 定数の外部ファイル化: レビューリンク基準オプション

**期待効果:**
- メインコンポーネント: 213行 → ~120行
- バリデーションロジックの再利用性向上

---

### 4. `/components/tickets/ticket-change-item-editor.tsx` - 172行
**問題点:**
- サイズ: 172行
- 複雑さ: 大きなJSXブロック、多数のフォームフィールド、配列操作

**簡素化案:**
1. サブコンポーネント抽出: `ChangeItemForm` - 個別の変更項目フォーム
2. フィールドグループのコンポーネント化: `ChangeItemFields` - 共通フィールドグループ
3. カスタムフックの検討: `useChangeItemEditor()` - 配列操作ロジック

**期待効果:**
- メインコンポーネント: 172行 → ~80行
- フォームフィールドの再利用性向上

---

## 優先度中（Medium Priority）

### 5. `/components/forms/StructuredAcceptanceCriteriaInput.tsx` - 154行
**問題点:**
- サイズ: 154行
- 複雑さ: 配列状態管理、展開/折りたたみ、ID生成ロジック
- 関数: ユーティリティ関数がコンポーネント内に定義されている

**簡素化案:**
1. ユーティリティ関数の分離: `getNextId()`, `normalizeOptional()` を `/lib/utils/acceptance-criteria.ts` に移動
2. サブコンポーネント抽出: `AcceptanceCriterionItem` - 個別の条件入力アイテム
3. カスタムフックの検討: `useExpandedIds()` - 展開状態管理

**期待効果:**
- メインコンポーネント: 154行 → ~90行
- ユーティリティ関数のテスト容易性向上

---

### 6. `/lib/domain/value-objects.ts` - 150行
**問題点:**
- サイズ: 150行（型定義ファイルとしては大きい）
- 構造: 多くの型定義が1ファイルに集約
- 依存: `enums.ts` から `BusinessArea` をインポート（サイクリカル依存のリスク）

**簡素化案:**
1. ドメインごとのファイル分割:
   - `/lib/domain/change-request.ts` - ChangeRequest関連
   - `/lib/domain/impact-scope.ts` - ImpactScope関連
   - `/lib/domain/acceptance-confirmation.ts` - AcceptanceConfirmation関連
   - `/lib/domain/ticket.ts` - チケット関連の型
2. 共通型の `/lib/domain/common.ts` への集約

**期待効果:**
- 単一ファイル: 150行 → 各ファイル ~30-50行
- 依存関係の明確化
- 変更影響範囲の縮小

---

### 7. `/components/tickets/acceptance-confirmation-panel.tsx` - 110行
**問題点:**
- サイズ: 110行
- 複雑さ: 3つのカスタムフック、複数のハンドラー関数
- 依存: 複数のhooksに依存

**簡素化:**
- コンポーネント自体は責務が明確で、既に適切に分割されている
- 優先度は中: 現状でも十分簡潔だが、hooksの実装を確認が必要

**提案:**
- hooksの実装を確認し、簡素化余地があれば対応

---

### 8. `/lib/data/structured.ts` - 118行
**問題点:**
- サイズ: 118行
- 複雑さ: 多数の正規化関数、型ガード
- 構造: 関連する関数がグループ化されている

**簡素化:**
- 現状では十分簡潔で構造化されている
- 各関数は単一責任を果たしており、テスト容易
- 優先度は低: 現状維持で問題ない

---

## 優先度低（Low Priority）

以下のファイルは現状維持で問題ない:

### `/components/tickets/ticket-basic-info-card.tsx` - 65行
- シンプルで読みやすい
- カスタムフックを使用して適切に分割されている

### `/components/tickets/ticket-impact-card.tsx` - 65行
- シンプルで読みやすい
- 責務が明確

### `/components/forms/AcceptanceCriteriaDisplay.tsx` - 32行
- 非常にシンプルで簡潔

### `/components/tickets/ticket-change-items-card.tsx` - 107行
- 複雑さは低い
- JSXは読みやすい

### `/components/tickets/ticket-basic-info-form.tsx` - 161行
- フォームフィールドが多いだけで、ロジックは単純
- プレゼンテーションコンポーネントとして適切

### `/app/tickets/create/page.tsx` - 135行
- シンプルなフォームページ
- ロジックは最小限

---

## 簡素化の優先順位

### フェーズ1: 最大の効果（優先度高）
1. `/app/tickets/page.tsx` - 239行 → ~80行
2. `/app/tickets/[id]/edit/page.tsx` - 213行 → ~100行
3. `/app/settings/page.tsx` - 213行 → ~120行
4. `/components/tickets/ticket-change-item-editor.tsx` - 172行 → ~80行

### フェーズ2: 構造改善（優先度中）
5. `/lib/domain/value-objects.ts` - 150行 → 分割
6. `/components/forms/StructuredAcceptanceCriteriaInput.tsx` - 154行 → ~90行

### フェーズ3: 確認と調整（優先度低）
7. カスタムhooksの実装確認
8. その他の中規模ファイルのレビュー

---

## まとめ

**簡素化対象ファイル数:** 8ファイル
**合計行数削減目標:** 約450行削減（約30%削減）

**主な簡素化手法:**
1. カスタムフックの抽出 - 状態管理と副作用ロジックの分離
2. コンポーネント分割 - プレゼンテーションとロジックの分離
3. ユーティリティ関数の分離 - 再利用性とテスト容易性向上
4. 型定義のファイル分割 - 依存関係の明確化

**次のステップ:**
- ユーザーに優先順位を確認
- フェーズ1から順に簡素化を実施
- 各ファイル簡素化後に動作確認
