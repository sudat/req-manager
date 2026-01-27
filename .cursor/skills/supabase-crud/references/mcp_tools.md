# Supabase MCP Tools Reference

## Project Management

### `list_projects`
プロジェクト一覧を取得。

```
結果: プロジェクトID、名前、リージョン、ステータスのリスト
```

### `get_project`
特定プロジェクトの詳細情報を取得。

```
パラメータ:
- project_ref: プロジェクトID
```

## Database Operations

### `list_tables`
テーブル一覧とスキーマ情報を取得。

```
パラメータ:
- project_ref: プロジェクトID
- schemas (optional): スキーマ名のリスト（デフォルト: ["public"]）

結果: テーブル名、カラム名、データ型、制約情報
```

**使用タイミング:**
- CRUD操作前に必ずスキーマを確認
- カラム名やデータ型が不明な場合

### `execute_sql`
SQL文を実行。SELECT/INSERT/UPDATE/DELETEに使用。

```
パラメータ:
- project_ref: プロジェクトID
- query: 実行するSQL文

注意:
- マイグレーション履歴は残らない
- DDL（CREATE/ALTER/DROP）はapply_migrationを使用
```

**例:**

```sql
-- SELECT
SELECT * FROM users WHERE created_at > '2024-01-01' LIMIT 10;

-- INSERT
INSERT INTO users (name, email) VALUES ('太郎', 'taro@example.com') RETURNING *;

-- UPDATE
UPDATE users SET email = 'new@example.com' WHERE id = 123 RETURNING *;

-- DELETE
DELETE FROM users WHERE id = 123 RETURNING *;
```

### `apply_migration`
DDL（スキーマ変更）を実行。マイグレーション履歴が残る。

```
パラメータ:
- project_ref: プロジェクトID
- version: マイグレーションバージョン（YYYYMMDDHHMMSSなど）
- name: マイグレーション名
- statements: 実行するDDL文のリスト

使用タイミング:
- CREATE TABLE/ALTER TABLE/DROP TABLEなどのスキーマ変更
- INDEXやCONSTRAINTの追加/削除
```

### `list_migrations`
適用済みマイグレーション履歴を取得。

```
パラメータ:
- project_ref: プロジェクトID

結果: バージョン、名前、実行日時のリスト
```

## Debugging & Monitoring

### `get_logs`
サービス別のログを取得。エラー調査に使用。

```
パラメータ:
- project_ref: プロジェクトID
- service: ログタイプ（api/postgres/edge/auth/storage/realtime）
- limit (optional): 取得件数

使用タイミング:
- SQL実行エラーの原因調査
- 認証エラーのトラブルシューティング
```

### `get_advisors`
セキュリティ・パフォーマンスの警告を取得。

```
パラメータ:
- project_ref: プロジェクトID

結果: インデックス不足、セキュリティリスクなどの提案
```

## Type Generation

### `generate_typescript_types`
データベーススキーマからTypeScript型定義を生成。

```
パラメータ:
- project_ref: プロジェクトID
- lang: 言語（typescript/swift/kotlin）

使用タイミング:
- フロントエンド開発時
- スキーマ変更後の型同期
```

## Configuration

### `get_project_url`
プロジェクトのAPI URLを取得。

```
パラメータ:
- project_ref: プロジェクトID
```

### `get_publishable_keys`
公開可能なAPIキーを取得。

```
パラメータ:
- project_ref: プロジェクトID

注意: anon keyは公開可能だが、service_role keyは秘密情報
```

## Best Practices

### エラーハンドリング
```sql
-- WHERE句なしのUPDATE/DELETEを防ぐ
-- 実行前にSELECT COUNT(*)で影響件数を確認
SELECT COUNT(*) FROM users WHERE status = 'inactive';
-- 確認後に実行
DELETE FROM users WHERE status = 'inactive';
```

### トランザクション
```sql
-- 複数操作を1つのトランザクションで実行
BEGIN;
  INSERT INTO orders (user_id, total) VALUES (1, 1000);
  UPDATE users SET points = points - 100 WHERE id = 1;
COMMIT;
```

### パフォーマンス
```sql
-- LIMITを使って大量データの一部取得
SELECT * FROM logs ORDER BY created_at DESC LIMIT 100;

-- INDEXが効いているか確認（EXPLAIN使用）
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

## Common Errors

### Authentication Error
```
Error: Invalid API credentials
対処: プロジェクトIDが正しいか確認、MCPの認証設定を確認
```

### Syntax Error
```
Error: syntax error at or near "..."
対処: SQL文法を確認、PostgreSQL構文リファレンス参照
```

### Permission Denied
```
Error: permission denied for table ...
対処: RLS（Row Level Security）ポリシーを確認、service_roleキー使用を検討
```

### Foreign Key Violation
```
Error: violates foreign key constraint
対処: 参照先レコードの存在確認、依存関係の順序を確認
```
