# サンプルモデル設計書登録計画

## Context

設計書（design_documents）の「種別：モデル」に対して、UI動作確認用のサンプルデータを登録する。

### 現状
- 既存のモデル設計書: 3件（顧客マスタ、連結パッケージ集計データモデル、請求書テーブル）
- モデル種別は `lib/domain/schemas/design-document-structured.ts` で定義済み
- details には `entityName`, `attributes`, `relationships` などを含む JSONB 構造

### 目的
UI動作確認のため、リッチなサンプルモデルを追加する。
- 複数のテーブルとリレーションシップの表現
- attributes（フィールド定義）のバリエーション
- stateTransitions（状態遷移）の例

---

## 実装計画

### 1. 登録するサンプルモデル

| ID | 名称 | SRF | 説明 |
|----|------|-----|------|
| DD-SF-AR-0001-006 | 商品マスタ | SF-AR-0001（請求書発行） | 商品の基本情報と税率を管理 |
| DD-SF-AP-0001-003 | 支払明細テーブル | SF-AP-0001（支払依頼） | 支払依頼の明細データを管理 |
| DD-SF-AR-0003-001 | 入金明細テーブル | SF-AR-0003（入金データ取込） | 入金消込のための明細データ |

### 2. データ構造（details JSONB）

各モデルの details には以下を含める：

```typescript
{
  "version": "1",
  "ioType": "model",
  "typeDetail": {
    "ioType": "model",
    "entityName": "Product",           // エンティティ名
    "entityLogicalName": "商品マスタ",  // 論理名
    "entityDescription": "...",         // 説明
    "attributes": [                     // フィールド定義
      {
        "name": "id",
        "logicalName": "商品ID",
        "type": "UUID",
        "primaryKey": true,
        "nullable": false,
        "unique": true,
        "description": "..."
      },
      // ... 他のフィールド
    ],
    "relationships": [                  // リレーション
      {
        "target": "Invoice",
        "type": "1:N",
        "description": "請求書との関係",
        "columnMappings": [
          { "source": "id", "target": "productId" }
        ]
      }
    ],
    "stateTransitions": [               // 状態遷移（任意）
      {
        "from": "draft",
        "to": ["active", "deleted"],
        "condition": "登録・削除時"
      }
    ]
  }
}
```

### 3. 登録方法

Supabase MCP の `execute_sql` を使用して INSERT 文を実行。

```sql
INSERT INTO design_documents (
  id, srf_id, project_id, name, type, summary, details
) VALUES (
  'DD-SF-AR-0001-006',
  'SF-AR-0001',
  '00000000-0000-0000-0000-000000000001',
  '商品マスタ',
  'model',
  '商品の基本情報と税率を管理するマスタテーブル',
  '{ ... JSONB ... }'::jsonb
);
```

### 4. 登録後の確認

```sql
-- 登録されたモデルを確認
SELECT id, name, type, summary
FROM design_documents
WHERE type = 'model'
ORDER BY id;

-- details の中身を確認
SELECT id, name, details->'typeDetail'->>'entityLogicalName' as entity_name
FROM design_documents
WHERE type = 'model';
```

---

## 検証

1. データが正しく登録されたことを SQL で確認
2. UI（http://localhost:3000/system/{id}/{srfId}/edit/design-documents）でモデルが表示されることを確認
3. 設計書詳細画面で attributes, relationships が正しく表示されることを確認

---

## 関連ファイル

- スキーマ定義: `lib/domain/schemas/design-document-structured.ts`
- 既存の設計書データ: `design_documents` テーブル
