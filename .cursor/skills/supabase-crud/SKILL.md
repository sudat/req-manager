---
name: supabase-crud
description: Supabase MCPを使用したデータベースのCRUD操作スキル。テーブルへのデータ追加・参照・更新・削除を安全に実行する。トリガー例：「usersテーブルにデータを追加」「新しいユーザーを登録」「昨日登録されたユーザーを表示」「このユーザーのメールアドレスを変更」「inactive状態のレコードを削除」など、Supabaseデータベースの操作を依頼された場合に使用する。
---

# Supabase CRUD Operations

Supabase MCP (plugin:supabase) を使用して、データベースのCRUD操作を安全かつ効率的に実行するスキル。

## Core Workflow

### 1. Project Selection (初回のみ)

会話の最初にプロジェクトを特定する。

```
1. mcp__plugin_supabase_supabase__list_projects を実行
2. 複数プロジェクトがある場合、ユーザーに選択させる
3. 選択されたproject_refをセッション中記憶する
```

### 2. Schema Confirmation (操作前)

CRUD操作の前に、必ずテーブル構造を確認する。

```
mcp__plugin_supabase_supabase__list_tables を実行
- project_ref: [選択されたプロジェクトID]
- schemas: ["public"] (デフォルト)

確認項目:
- テーブル名の正確性
- カラム名とデータ型
- 必須カラム（NOT NULL制約）
- 主キー・外部キー制約
```

### 3. Operation Execution

操作タイプに応じた実行フロー。

#### SELECT (データ参照)
```
1. list_tablesでスキーマ確認
2. execute_sqlでSELECT実行
3. 結果を整形して表示

安全性チェック: 不要（読み取り専用のため）
```

#### INSERT (データ追加)
```
1. list_tablesでスキーマ確認（必須カラム、データ型）
2. execute_sqlでINSERT実行（RETURNING *推奨）
3. 追加されたレコードを表示

安全性チェック: 不要（新規追加のため）
```

#### UPDATE (データ更新)
```
1. list_tablesでスキーマ確認
2. execute_sqlでSELECT COUNT(*) + WHERE条件で影響件数を確認
3. 影響件数をユーザーに提示し、承認を求める
4. 承認後、execute_sqlでUPDATE実行（RETURNING *推奨）
5. 更新されたレコードを表示

安全性チェック: 必須
- WHERE句なしのUPDATEは警告
- 影響件数が多い場合（10件以上）は特に注意喚起
```

#### DELETE (データ削除)
```
1. list_tablesでスキーマ確認
2. execute_sqlでSELECT * + WHERE条件で削除対象を表示
3. 削除対象レコードをユーザーに提示し、承認を求める
4. 承認後、execute_sqlでDELETE実行（RETURNING *推奨）
5. 削除されたレコードを表示

安全性チェック: 必須
- WHERE句なしのDELETEは強く警告
- 削除は不可逆なので、レコード内容を必ず表示
```

## Operation Examples

### Example 1: データ参照
```
ユーザー: 「昨日登録されたユーザーを見せて」

1. list_tables → users テーブル構造確認
2. execute_sql:
   SELECT * FROM users
   WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
   ORDER BY created_at DESC;
3. 結果を表形式で表示
```

### Example 2: データ追加
```
ユーザー: 「新しいユーザーを登録して。名前は太郎、メールはtaro@example.com」

1. list_tables → usersテーブルの必須カラム確認（name, emailが必須か確認）
2. execute_sql:
   INSERT INTO users (name, email)
   VALUES ('太郎', 'taro@example.com')
   RETURNING *;
3. 追加されたレコードを表示
```

### Example 3: データ更新（安全性確認あり）
```
ユーザー: 「ID=123のユーザーのメールアドレスをnew@example.comに変更して」

1. list_tables → usersテーブル構造確認
2. execute_sql (影響件数確認):
   SELECT COUNT(*) FROM users WHERE id = 123;
   → 結果: 1件
3. ユーザーに確認:
   「1件のレコードを更新します。実行しますか？」
4. 承認後、execute_sql:
   UPDATE users
   SET email = 'new@example.com'
   WHERE id = 123
   RETURNING *;
5. 更新されたレコードを表示
```

### Example 4: データ削除（安全性確認あり）
```
ユーザー: 「inactive状態のユーザーを削除して」

1. list_tables → usersテーブル構造確認
2. execute_sql (削除対象確認):
   SELECT * FROM users WHERE status = 'inactive';
   → 結果: 3件のレコード表示
3. ユーザーに確認:
   「以下の3件のレコードを削除します。実行しますか？
   - ID=10, name='山田', email='yamada@example.com'
   - ID=25, name='佐藤', email='sato@example.com'
   - ID=42, name='田中', email='tanaka@example.com'」
4. 承認後、execute_sql:
   DELETE FROM users WHERE status = 'inactive' RETURNING *;
5. 削除されたレコードを表示
```

## Safety Guidelines

### Critical Rules

1. **UPDATE/DELETEは必ず事前確認**
   - 影響件数または対象レコードを表示
   - ユーザーの明示的な承認を得る
   - WHERE句なしの操作は特に警告

2. **スキーマ確認を省略しない**
   - カラム名のタイポを防ぐ
   - データ型の不一致を防ぐ
   - 制約違反を事前に把握

3. **RETURNING句を活用**
   - INSERT/UPDATE/DELETE後の結果を確認
   - ユーザーに操作結果を明示

### Error Handling

操作失敗時の対応:

```
1. エラーメッセージをユーザーに提示
2. get_logsでPostgreSQLログを確認（必要に応じて）
3. 原因を特定し、修正案を提示
   - 外部キー制約違反 → 参照先レコードの確認
   - データ型不一致 → 正しい型でのキャスト
   - 構文エラー → SQL文法の修正
```

## Advanced Features

### Bulk Operations

大量データの操作:

```sql
-- LIMITで段階実行
DELETE FROM logs WHERE created_at < '2023-01-01' LIMIT 1000;

-- トランザクション
BEGIN;
  INSERT INTO orders (user_id, total) VALUES (1, 1000);
  UPDATE users SET points = points - 100 WHERE id = 1;
COMMIT;
```

### Performance Tips

```sql
-- INDEXの活用確認
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- ページネーション
SELECT * FROM users ORDER BY created_at DESC LIMIT 20 OFFSET 0;
```

## MCP Tools Reference

詳細なツール仕様は `references/mcp_tools.md` を参照:

- **list_projects**: プロジェクト一覧取得
- **list_tables**: テーブル構造取得
- **execute_sql**: SQL実行（SELECT/INSERT/UPDATE/DELETE）
- **get_logs**: エラーログ取得
- **get_advisors**: パフォーマンス提案

## Non-CRUD Operations

このスキルはCRUD操作に特化。以下は対象外:

- **DDL操作** (CREATE/ALTER/DROP TABLE)
  → `apply_migration` を使用（マイグレーション履歴管理）
- **型定義生成**
  → `generate_typescript_types` を使用
- **Edge Functions**
  → 別スキルまたは直接MCPツール使用
