# 実装単位SDサンプルデータ登録プラン

## 目的

SRF-001（請求書発行）に対する本物らしい実装単位SD（IU）サンプルデータを登録する。

## 実装内容

### 作成する実装単位SD（4件）

| ID | タイプ | 名称 | 説明 |
|----|--------|------|------|
| IU-AR-001-01 | screen | 請求書発行画面 | 請求対象の一覧表示・選択・発行指示 |
| IU-AR-001-02 | api | 請求書発行API | PDF生成、税率別集計、メール送信 |
| IU-AR-001-03 | batch | 請求書一括発行バッチ | 月次バッチ処理、キューイング制御 |
| IU-AR-001-04 | external_if | メール送信I/F | SendGrid/SES連携、送信結果追跡 |

### データ仕様（PRD 3.9準拠）

**必須項目:**
- `id`: IU-AR-001-01 ~ IU-AR-001-04
- `srf_id`: SRF-001
- `project_id`: 00000000-0000-0000-0000-000000000001
- `type`: screen / api / batch / external_if
- `name`: 日本語名称
- `summary`: 概要説明（日本語）
- `entry_points`: JSONB配列（ファイルパス、型、責務）
- `design_policy`: 設計方針（日本語テキスト）

**details JSONB（YAML形式、標準レベル）:**
- `api_definition`: エンドポイント、入出力、エラー、認可
- `core_logic`: 消費税計算（インボイス対応）、PDF生成、税率別集計
- `screen_design`: 画面構成、バリデーション、アクション
- `db_design`: トランザクション境界、排他、履歴管理
- `exception_handling`: エラー分類、再試行、ユーザーアクション
- `detailed_spec`: プロバイダー連携、webhook、添付ファイル

## 実装手順

### Step 1: 既存データの削除（存在する場合）

```sql
-- 既存IUデータの削除
DELETE FROM public.impl_unit_sds
WHERE srf_id = 'SRF-001'
  AND project_id = '00000000-0000-0000-0000-000000000001';
```

### Step 2: サンプルデータの挿入

SQLファイル `/usr/local/src/dev/wsl/personal-pj/req-manager/.tmp/seed-impl-unit-sds.sql` を作成し、4件のINSERT文を実行。

### Step 3: 検証

```sql
-- 挿入されたデータを確認
SELECT
  id,
  name,
  type,
  jsonb_array_length(entry_points) as entry_point_count
FROM public.impl_unit_sds
WHERE srf_id = 'SRF-001'
ORDER BY id;
```

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `lib/data/impl-unit-sds.ts` | データアクセス関数 |
| `lib/domain/entities.ts` | TypeScript型定義 |
| `lib/domain/enums.ts` | タイプラベル・カラー |
| `docs/PRD.md` | Section 3.9 実装単位SD仕様 |
| `components/system-domains/impl-unit-sd-section.tsx` | 表示コンポーネント |

## 検証方法

1. **データベース確認**: psqlまたはSupabaseダッシュボードで4件のレコードを確認
2. **UI表示確認**: `http://localhost:3001/system-domains/AR/SRF-001` にアクセスし、実装単位セクションに4件表示されることを確認
3. **詳細表示確認**: 各IUのカラム展開でdetailsのYAML内容が正しく表示されることを確認

## インボイス制度対応のポイント

- 適格請求書の必須項目（登録番号T+13桁、税率別対価・税額）を含める
- 10%標準税率・8%軽減税率の区分計算
- 端数処理は切り捨て（1円単位）
`─────────────────────────────────────────────────`
