# 「legacy」テキスト削除計画

## 概要

業務要件・システム要件の受入条件（acceptance criteria）description に含まれる「legacy」という文字列を削除するスクリプトを作成・実行する。

**注意**: 既存の `remove-legacy-only-text.ts` は「legacy-only」（ハイフン付き）のみを対象としており、今回のスクリプトは「legacy」単体を対象とします。

## 対象

- テーブル: `business_requirements`, `system_requirements`
- カラム: `acceptance_criteria_json` (jsonb), `acceptance_criteria` (text[])
- 処理: description フィールドから "legacy" 文字列を削除（大文字小文字区別なし）

## 実装方針（設計原則）

| 原則 | 適用内容 |
|------|----------|
| YAGNI | Supabase MCPは使用せず、既存の `pg` クライアントで直接実装 |
| DRY | 既存の `remove-legacy-only-text.ts` パターンを再利用 |
| KISS | 単一のTypeScriptスクリプトで完結、複雑なORMは不使用 |
| SRP | 既存スクリプトは修正せず、新規スクリプトとして作成 |

## 実装内容

### 1. 新規スクリプト作成

**ファイル**: `scripts/db/remove-legacy-text.ts`

**主要な処理フロー**:
1. 環境変数チェック (DATABASE_URL)
2. PostgreSQL接続
3. 影響レコード検索 (business_requirements, system_requirements)
4. プレビュー表示 (テーブル形式)
5. DRY_RUNモードの場合は終了
6. 確認プロンプト
7. トランザクション内で更新実行
8. 結果表示

### 2. テキスト処理ロジック

```typescript
const cleanDescription = (desc: string): string => {
  // 1. "legacy" を大文字小文字区別なしに削除（単語境界）
  const cleaned = desc.replace(/\blegacy\b/gi, "");
  // 2. 連続空白を1つの空白に圧縮
  const compressed = cleaned.replace(/\s+/g, " ");
  // 3. trim
  return compressed.trim();
};
```

**処理例**:
| 入力 | 出力 | 備考 |
|------|------|------|
| "legacy requirement" | "requirement" | 前方のlegacy削除 |
| "This is legacy text" | "This is text" | 中間のlegacy削除 |
| "Legacy System" | "System" | 大文字小文字区別なし |
| "LEGACY data" | "data" | 全大文字にも対応 |
| "legacy data migration" | "data migration" | 単語として認識 |

### 3. SQLクエリ

```sql
-- 検索
SELECT id, title, acceptance_criteria_json, acceptance_criteria
FROM {table}
WHERE
  acceptance_criteria_json::text LIKE '%legacy%' OR
  acceptance_criteria::text LIKE '%legacy%';

-- 更新
UPDATE {table}
SET
  acceptance_criteria_json = $1,
  acceptance_criteria = $2,
  updated_at = NOW()
WHERE id = $3;
```

### 4. package.json にスクリプト追加

```json
"scripts": {
  "db:remove-legacy-only": "bun scripts/db/remove-legacy-only-text.ts",
  "db:remove-legacy": "bun scripts/db/remove-legacy-text.ts"
}
```

## 使用方法

```bash
# プレビュー（ドライラン）
DRY_RUN=true bun run db:remove-legacy

# 本番実行
bun run db:remove-legacy
```

## 難易度評価

**難易度: ★☆☆**

**根拠**:
- 修正ファイル: 1 file（新規スクリプト）
- 変更行数: 約50行（既存パターン踏襲）
- 影響コンポーネント: 0（DBスクリプトのみ）

**リスク**:
- 低: トランザクション処理により、エラー時はロールバック
- 低: 既存データ構造を変更せず、文字列のみ更新
- 中: "legacy" が有効な単語として使われているケース（文脈による）
  - 軽減策: DRY_RUNモードでプレビュー

## 依存関係

**既存のみ使用**:
- `pg@^8.17.1` (既に devDependencies に存在)
- `typescript@^5` (既に存在)

**新規追加**: なし

## Critical Files

| ファイル | 役割 |
|---------|------|
| `scripts/db/remove-legacy-text.ts` | **新規作成** - メインスクリプト |
| `package.json` | **修正** - スクリプト追加 |
| `scripts/db/remove-legacy-only-text.ts` | 参照 - 既存パターン |
| `lib/data/structured.ts` | 参照 - AcceptanceCriterionJson 型定義 |

## 検証計画

### 1. ドライラン実行
```bash
DRY_RUN=true bun run db:remove-legacy
```

### 2. 期待出力
```
==> Scanning for 'legacy' text...

==> Preview Mode (DRY_RUN=true)

[business_requirements]
ID                | Title                | Changes
--------------------------------------------------
xxxxxxxxxxxxxxxx  | Legacy Requirement   | 1 changes: AC-001: "legacy system..." → "system..."
Affected: N records

[system_requirements]
Affected: N records

==> Total: N records will be affected
==> DRY_RUN mode: No changes made
```

### 3. 本番実行
```bash
bun run db:remove-legacy
# 確認プロンプトで "yes" を入力
```

### 4. 事後検証クエリ
```sql
-- 検証: "legacy" が残っていないか
SELECT COUNT(*)
FROM business_requirements
WHERE acceptance_criteria_json::text ~* '\blegacy\b'
   OR acceptance_criteria::text ~* '\blegacy\b';
-- 期待結果: 0
```

## エッジケース対応

| ケース | 期待結果 |
|--------|----------|
| description = "legacy" | 空文字列 "" に変換（項目は残す） |
| "Legacy System" | "System" に変換（大文字小文字区別なし） |
| "LEGACY data migration" | "data migration" に変換 |
| "legacy-only data" | 削除されず（別スクリプトの対象） |

## 実行ステップ

1. [ ] `scripts/db/remove-legacy-text.ts` を作成
2. [ ] `package.json` にスクリプトを追加
3. [ ] ドライラン実行してプレビュー確認
4. [ ] 本番実行
5. [ ] 事後検証クエリ実行
