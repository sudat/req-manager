# 不適合DD-IDの洗い出しと修正計画

## Context
ユーザーから `http://localhost:3000/system/AR/SF-AR-0001/edit/design-documents` でDDのIDを見ていると、コード採番ルールに従っていないDDがいくつかあるとの指摘がありました。

### 期待されるID形式
`DD-SF-AR-0001-001`
- `DD-{SF-ID}-{3桁採番}`
- 例: `DD-SF-AR-0001-001`, `DD-SF-GL-0009-001`

### 不適合形式（既存データ）
`DD-AR-001-01`
- SFプレフィックスがない
- 2桁採番になっている

## 調査結果（Exploreエージェントによる）
- **総DD数**: 30件
- **標準形式**: 5件（16.7%）
- **不適合形式**: 25件（83.3%）

### 不適合IDの分布
| グループ | 件数 |
|----------|------|
| AP | 9件 |
| AR | 15件 |
| GL | 6件 |

### 不適合ID一覧（調査済み）
```
AP: DD-AP-009-01, DD-AP-009-02, DD-AP-010-01, DD-AP-011-01, DD-AP-011-02,
    DD-AP-012-01, DD-AP-012-02, DD-AP-013-01, DD-AP-013-02, DD-AP-014-01

AR: DD-AR-001-01, DD-AR-001-02, DD-AR-001-03, DD-AR-001-04, DD-AR-002-01,
    DD-AR-002-02, DD-AR-003-01, DD-AR-003-02, DD-AR-004-01, DD-AR-004-02,
    DD-AR-005-01, DD-AR-005-02, DD-AR-005-03, DD-AR-006-01, DD-AR-006-02,
    DD-AR-007-01, DD-AR-007-02, DD-AR-008-01

GL: DD-GL-018-01, DD-GL-018-02, DD-GL-019-01, DD-GL-020-01,
    DD-GL-021-01, DD-GL-021-02
```

## 実装計画

### Step 1: 外部キー制約の確認
design_documents.id を参照しているテーブルを確認：

```sql
-- 外部キー制約を確認
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'design_documents';
```

### Step 2: 不適合DDのsrf_idを確認
各DDがどのSFに紐づいているか確認：

```sql
-- 不適合IDと紐づくsrf_idを確認
SELECT id, srf_id, name, type
FROM design_documents
WHERE id !~ '^DD-SF-[A-Z]+-\d{4}-\d{3}'
ORDER BY srf_id, id;
```

### Step 3: ID変換ロジック
不適合IDから正しいIDへ変換：

| 変換前 | 変換後 | ロジック |
|--------|--------|----------|
| `DD-AR-001-01` | `DD-SF-AR-0001-001` | `DD-{srf_idの末尾4桁}-{末尾2桁→3桁化}` |

**注意**: srf_id カラムの値が `SF-AR-0001` の形式であることを前提としている。

### Step 4: UPDATE文の実行
Supabase MCPで各レコードをUPDATE：

```sql
-- 例: DD-AR-001-01 → DD-SF-AR-0001-001
UPDATE design_documents
SET id = 'DD-SF-AR-0001-001'
WHERE id = 'DD-AR-001-01'
  AND srf_id = 'SF-AR-0001';
```

**外部キーがある場合**: 先に外部キーを更新してから、design_documentsを更新する必要がある。

### Step 5: 外部キーの更新（必要な場合）
requirement_links テーブルなどで design_document を参照している場合：

```sql
-- requirement_links の target_id/target_type に 'dd' がある場合
UPDATE requirement_links
SET target_id = 'DD-SF-AR-0001-001'
WHERE target_id = 'DD-AR-001-01'
  AND target_type = 'dd';
```

### Step 6: 検証
更新後に正しく修正されたか確認：

```sql
-- 全てのDDが正しい形式になっているか確認
SELECT id, srf_id
FROM design_documents
WHERE id !~ '^DD-SF-[A-Z]+-\d{4}-\d{3}';

-- 結果が0件であることを確認
```

## 実行順序
1. 外部キー制約の確認
2. 不適合DDとsrf_idのマッピング確認
3. 外部キーがあるテーブルの更新（あれば）
4. design_documents テーブルの更新
5. 検証

## 関連ファイル
- ID生成ロジック: `lib/mastra/tools/dd-draft.ts` (271-286行目)
- DD型定義: `lib/domain/entities.ts` (225-237行目)
- DD CRUD: `lib/data/design-documents.ts`

## リスク
- 外部キー制約がある場合、UPDATEに失敗する可能性がある
- srf_id の値が期待する形式（`SF-AR-0001`）でない場合、変換ロジックを調整する必要がある
