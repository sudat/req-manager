# 業務要件とシステム要件の紐付けデータ修正

## 概要
業務要件とシステム要件の紐付けデータを、キーワードマッチングによって自動修正するスクリプトを作成・実行する。

## 現状のデータ状況
- **業務要件（business_requirements）**: 53件すべて`srf_id`が`null`
- **システム要件（system_requirements）**: `business_requirement_ids`が空または一部設定済み
  - TASK-001: 既に`business_requirement_ids`が設定されている
  - TASK-002以降: すべて空配列
- **システム機能（system_functions）**: 25件存在（SRF-001〜SRF-025）

## 実装方針
1. **紐付け方法**: 両方のテーブルを更新
   - `business_requirements.srf_id`を設定
   - `system_requirements.business_requirement_ids`を設定
2. **対応関係**: キーワードマッチングで自動判定

## キーワードマッチングアルゴリズム

### スコア計算
```
1. 同じ task_id の業務要件とシステム要件を対象
2. title と summary からキーワード抽出（空白・句読点で分割）
3. 業務要件のキーワードがシステム要件に含まれる数をカウント
4. スコア判定:
   - スコア >= 2: 自動紐付け
   - スコア == 1: 確認が必要（ログに出力）
   - スコア == 0: 紐付けなし
```

### 既存データ保護
- 既に`srf_id`が設定されている業務要件はスキップ
- 既に`business_requirement_ids`が設定されているシステム要件はスキップ

## 実装ファイル

### 新規作成ファイル
```
scripts/db/link-requirements-by-keyword-matching.ts
```

### 関連ファイル（読み取り専用）
- `lib/data/business-requirements.ts` - 更新関数を使用
- `lib/data/system-requirements.ts` - 更新関数を使用
- `lib/domain/value-objects.ts` - 型定義を参照

## 実装計画

### Phase 1: 基本スクリプト作成
1. CLI引数パーサー（`--dry-run`, `--execute`, `--task=TASK-XXX`）
2. キーワード抽出・スコア計算関数
3. 型定義（MatchingResult, TaskMatchingSummary）

### Phase 2: マッチングロジック実装
1. タスク単位のグルーピング
2. マッチング実行関数
3. 既存データチェック

### Phase 3: ドライランモード実装
1. 結果表示関数
2. ログ出力形式

### Phase 4: 実行モード実装
1. 更新処理実装
2. エラーハンドリング

### Phase 5: テスト・検証
1. ドライランで確認
2. 実行モードでデータ更新

## 実行方法

```bash
# ドライラン（確認モード）
bun scripts/db/link-requirements-by-keyword-matching.ts --dry-run

# 実行モード
bun scripts/db/link-requirements-by-keyword-matching.ts --execute

# 特定タスクのみ対象
bun scripts/db/link-requirements-by-keyword-matching.ts --dry-run --task=TASK-002
```

## ログ出力例

```
=== キーワードマッチングによる要件紐付け ===

モード: DRY-RUN
対象タスク: すべて

--- TASK-002: 売掛計上 ---
  ✓ 自動紐付け候補: 1件
  ? 確認が必要: 0件
  ⊘ 既に紐付け済み: 0件

  [DRY-RUN] 紐付け: 売掛金の正確な計上処理 -> 売掛金自動計上バッチ処理
    スコア: 3
    マッチキーワード: 売掛金, 計上, 処理

--- TASK-003: 請求書発行 ---
  ✓ 自動紐付け候補: 2件
  ...

=== サマリー ===
全タスク: 6件
自動紐付け候補: XX件
確認が必要: XX件
既に紐付け済み: 2件
```

## リスク評価

| リスク | 対策 |
|--------|------|
| 誤紐付けによるデータ不整合 | スコア >= 2 のみ自動紐付け、ドライランで必ず確認 |
| 中途半端な更新 | 1件ずつ更新して即時ログ、既存データは上書きしない |
| キーワードマッチングの精度不足 | スコア1件は確認待ち、結果に確信度を表示 |

## 更新内容

### business_requirements テーブル
```sql
UPDATE business_requirements
SET srf_id = <システム機能ID>, updated_at = NOW()
WHERE id = <業務要件ID>;
```

### system_requirements テーブル
```sql
UPDATE system_requirements
SET business_requirement_ids = array_append(business_requirement_ids, <業務要件ID>), updated_at = NOW()
WHERE id = <システム要件ID>;
```

## 難易度
**★☆☆**
- 根拠: 1ファイル新規作成、既存リポジトリ関数使用
- 成功率: 90%
