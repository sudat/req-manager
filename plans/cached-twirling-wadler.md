# AP/AR/GLシステムドメイン データ登録計画

## 概要

`http://localhost:3000/system-domains/` 配下のAP/AR/GLシステムドメインに対して、システム要件の受入基準とシステム機能の実装単位SDを追加する。

## 現状分析

### DB状況（Supabase project_id: mbzvpmcikjncjrnbusdn）

| テーブル | 件数 | 状態 |
|---------|------|------|
| business_domains | 3 | ✅ AR/AP/GL |
| system_functions | 27 | ✅ SRF-001〜SRF-027 |
| system_requirements | 57 | ✅ SR-TASK-XXX-XXX形式 |
| **acceptance_criteria** | **0** | ⚠️ **空や！追加対象** |
| **impl_unit_sds** | **0** | ⚠️ **空や！追加対象** |

### Project ID

```
00000000-0000-0000-0000-000000000001（新会計システムプロジェクト）
```

### 既存System Functions（27件）

| 領域 | SRF範囲 | 主な機能 |
|------|---------|----------|
| **AR** | SRF-001〜008 | 請求書発行、税率別集計、入金取込、入金消込、債権管理、与信管理、電子請求書、延滞アラート |
| **AP** | SRF-009〜016 | 支払依頼、支払承認、支払実行、手形管理、仕入請求書取込、買掛残高、仕入先ポータル、支払予定表 |
| **GL** | SRF-017〜024 | 手動仕訳、仕訳転記、総勘定元帳、試算表、財務諸表、決算整理、固定資産、税申告 |
| **その他** | SRF-025〜027 | 売掛金自動計上バッチ、買掛金管理、テスト伝票 |

## 登録データ計画

### 1. Acceptance Criteria（受入基準）

#### 登録件数
- **合計**: 35件
- **AR**: 12件（4つのSR × 2-3件ずつ）
- **AP**: 12件（4つのSR × 2-3件ずつ）
- **GL**: 11件（4つのSR × 2-3件ずつ）

#### 登録対象System Requirements

| 領域 | System Requirement ID | タイトル | 受入基準数 |
|------|----------------------|----------|-----------|
| **AR** | SR-TASK-003-001 | 請求書PDF生成（検証） | 3 |
| **AR** | SR-TASK-004-002 | 入金消込 | 3 |
| **AR** | SR-TASK-005-001 | 債権管理一覧 | 3 |
| **AR** | SR-TASK-001-001 | 与信管理画面 | 3 |
| **AP** | SR-TASK-009-001 | 支払依頼画面 | 3 |
| **AP** | [対象決定] | 支払承認 | 3 |
| **AP** | [対象決定] | 支払実行 | 3 |
| **AP** | [対象決定] | 買掛残高確認 | 3 |
| **GL** | [対象決定] | 手動仕訳入力 | 3 |
| **GL** | [対象決定] | 総勘定元帳 | 3 |
| **GL** | [対象決定] | 試算表 | 2 |
| **GL** | [対象決定] | 財務諸表 | 3 |

#### 受入基準パターン例

**正常系**:
```sql
AC-SR-TASK-003-001-001:
  description: "請求書PDFが正常に生成されること"
  given_text: "請求対象データが存在し、顧客情報が登録されている"
  when_text: "請求書生成を実行する"
  then_text: "税率別内訳を含む請求書PDFが生成され、ダウンロード可能になる"
```

**異常系**:
```sql
AC-SR-TASK-004-002-002:
  description: "入金額と請求額が不一致の場合、エラーが表示されること"
  given_text: "請求額100,000円の請求データが存在する"
  when_text: "90,000円の入金データを紐付けようとする"
  then_text: "金額不一致エラーが表示され、消込処理が中断される"
```

### 2. Impl Unit SD（実装単位SD）

#### 登録件数
- **合計**: 18件
- **AR**: 6件
- **AP**: 6件
- **GL**: 6件

#### type別配分

| type | 件数 | 内容 |
|------|------|------|
| **screen** | 9 | 画面系実装単位 |
| **api** | 5 | APIエンドポイント |
| **batch** | 3 | バッチ処理 |
| **external_if** | 1 | 外部インターフェース |

#### 登録対象System Functions

| SRF | タイトル | 実装単位 | type |
|-----|----------|----------|------|
| **SRF-001** | 請求書発行 | 請求書発行画面 | screen |
| **SRF-001** | 請求書発行 | 請求書生成API | api |
| **SRF-003** | 入金データ取込 | 入金データ取込バッチ | batch |
| **SRF-004** | 入金消込 | 入金消込API | api |
| **SRF-004** | 入金消込 | 入金消込画面 | screen |
| **SRF-007** | 電子請求書送信 | 顧客ポータルIF | external_if |
| **SRF-009** | 支払依頼 | 支払依頼画面 | screen |
| **SRF-009** | 支払依頼 | 支払依頼API | api |
| **SRF-010** | 支払承認 | 支払承認画面 | screen |
| **SRF-011** | 支払実行 | 支払実行バッチ | batch |
| **SRF-013** | 仕入請求書取込 | 仕入請求書取込API | api |
| **SRF-014** | 買掛残高確認 | 買掛残高一覧画面 | screen |
| **SRF-017** | 手動仕訳入力 | 手動仕訳入力画面 | screen |
| **SRF-018** | 仕訳転記 | 仕訳転記バッチ | batch |
| **SRF-019** | 総勘定元帳 | 総勘定元帳画面 | screen |
| **SRF-020** | 試算表 | 試算表生成API | api |
| **SRF-021** | 財務諸表 | 財務諸表画面 | screen |
| **SRF-021** | 財務諸表 | 財務諸表生成API | api |

## 実行SQL

### 事前確認

```sql
-- 1. project_idの確認
SELECT id, name FROM projects;

-- 2. 登録対象system_requirementsの確認
SELECT id, title, srf_id FROM system_requirements ORDER BY srf_id LIMIT 20;

-- 3. 登録対象system_functionsの確認
SELECT id, title, category, system_domain_id FROM system_functions ORDER BY id;
```

### Acceptance Criteria登録

```sql
-- AR: 請求書PDF生成（SR-TASK-003-001）
INSERT INTO acceptance_criteria (
  id, system_requirement_id, project_id,
  description, given_text, when_text, then_text,
  verification_method, status, sort_order,
  created_at, updated_at
) VALUES
  (
    'AC-SR-TASK-003-001-001',
    'SR-TASK-003-001',
    '00000000-0000-0000-0000-000000000001',
    '請求書PDFが正常に生成されること',
    '請求対象データが存在し、顧客情報が登録されている',
    '請求書生成を実行する',
    '税率別内訳を含む請求書PDFが生成され、ダウンロード可能になる',
    '自動テスト',
    'unverified',
    1,
    NOW(),
    NOW()
  ),
  (
    'AC-SR-TASK-003-001-002',
    'SR-TASK-003-001',
    '00000000-0000-0000-0000-000000000001',
    '軽減税率対象商品が正しく区分されていること',
    '軽減税率8%と標準税率10%の商品が含まれる請求データがある',
    '請求書PDF生成を実行する',
    '税率別内訳が正しく表示され、適格請求書としての要件を満たしている',
    '手動テスト',
    'unverified',
    2,
    NOW(),
    NOW()
  ),
  (
    'AC-SR-TASK-003-001-003',
    'SR-TASK-003-001',
    '00000000-0000-0000-0000-000000000001',
    '顧客情報が不足している場合、エラーが表示されること',
    '顧客情報が未登録の請求対象データが存在する',
    '請求書生成を実行する',
    '顧客情報不足エラーが表示され、PDF生成が実行されない',
    '手動テスト',
    'unverified',
    3,
    NOW(),
    NOW()
  );

-- AR: 入金消込（SR-TASK-004-002）
INSERT INTO acceptance_criteria (
  id, system_requirement_id, project_id,
  description, given_text, when_text, then_text,
  verification_method, status, sort_order,
  created_at, updated_at
) VALUES
  (
    'AC-SR-TASK-004-002-001',
    'SR-TASK-004-002',
    '00000000-0000-0000-0000-000000000001',
    '入金額と請求額が一致する場合、消込が完了すること',
    '請求額100,000円の請求データと100,000円の入金データが存在する',
    '入金消込処理を実行する',
    '請求データが入金済みとなり、債権残高が0円になる',
    '自動テスト',
    'unverified',
    1,
    NOW(),
    NOW()
  ),
  (
    'AC-SR-TASK-004-002-002',
    'SR-TASK-004-002',
    '00000000-0000-0000-0000-000000000001',
    '入金額と請求額が不一致の場合、エラーが表示されること',
    '請求額100,000円の請求データが存在する',
    '90,000円の入金データを紐付けようとする',
    '金額不一致エラーが表示され、消込処理が中断される',
    '手動テスト',
    'unverified',
    2,
    NOW(),
    NOW()
  ),
  (
    'AC-SR-TASK-004-002-003',
    'SR-TASK-004-002',
    '00000000-0000-0000-0000-000000000001',
    '一部入金の場合、残高が正しく計算されること',
    '請求額100,000円の請求データが存在する',
    '30,000円の入金データを紐付ける',
    '請求データの残高が70,000円となり、入金済金額が30,000円となる',
    '自動テスト',
    'unverified',
    3,
    NOW(),
    NOW()
  );

-- 続きは実行時にsystem_requirements一覧を確認して追加する...
```

### Impl Unit SD登録

```sql
-- AR: 請求書発行画面
INSERT INTO impl_unit_sds (
  id, srf_id, project_id,
  name, type, summary,
  entry_points, design_policy, details,
  created_at, updated_at
) VALUES
  (
    'IU-SRF-001-001',
    'SRF-001',
    '00000000-0000-0000-0000-000000000001',
    '請求書発行画面',
    'screen',
    '請求対象を選択し、PDF生成を行う画面',
    '[{"path": "/invoices/generate", "method": "GET", "description": "請求書生成画面"}]'::jsonb,
    'インボイス制度対応、税率別表示、承認フロー',
    '{"ui_components": ["請求対象一覧", "生成ボタン", "プレビュー"], "validation": ["必須項目チェック", "金額整合性チェック"]}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'IU-SRF-001-002',
    'SRF-001',
    '00000000-0000-0000-0000-000000000001',
    '請求書生成API',
    'api',
    '請求書PDF生成を行うAPIエンドポイント',
    '[{"path": "/api/invoices/generate", "method": "POST", "description": "請求書生成API"}]'::jsonb,
    '非同期処理、エラーハンドリング、リトライ機構',
    '{"request": {"invoice_ids": "string[]"}, "response": {"download_url": "string"}, "rate_limiting": "10req/min"}'::jsonb,
    NOW(),
    NOW()
  );

-- AR: 入金消込画面
INSERT INTO impl_unit_sds (
  id, srf_id, project_id,
  name, type, summary,
  entry_points, design_policy, details,
  created_at, updated_at
) VALUES
  (
    'IU-SRF-004-001',
    'SRF-004',
    '00000000-0000-0000-0000-000000000001',
    '入金消込画面',
    'screen',
    '入金データと請求データを紐付ける画面',
    '[{"path": "/payments/matching", "method": "GET", "description": "入金消込画面"}]'::jsonb,
    'ドラッグ＆ドロップ対応、自動マッチング、手動調整',
    '{"ui_components": ["未消込一覧", "入金データ一覧", "マッチング候補"], "features": ["自動マッチング", "一部入金対応"]}'::jsonb,
    NOW(),
    NOW()
  );

-- AR: 顧客ポータルIF
INSERT INTO impl_unit_sds (
  id, srf_id, project_id,
  name, type, summary,
  entry_points, design_policy, details,
  created_at, updated_at
) VALUES
  (
    'IU-SRF-007-001',
    'SRF-007',
    '00000000-0000-0000-0000-000000000001',
    '顧客ポータルIF',
    'external_if',
    '顧客ポータルとの請求書送信インターフェース',
    '[{"path": "/api/portal/invoices", "method": "POST", "description": "顧客ポータル請求書送信API"}]'::jsonb,
    '認証・認可、暗号化、再送制御',
    '{"protocol": "HTTPS", "auth": "OAuth2.0", "format": "JSON", "retry": "3回"}'::jsonb,
    NOW(),
    NOW()
  );

-- 続きは実行時にsystem_functions一覧を確認して追加する...
```

## Critical Files

| ファイル | 説明 |
|---------|------|
| `/lib/data/acceptance-criteria.ts` | 受入基準のデータアクセス関数 |
| `/lib/data/impl-unit-sds.ts` | 実装単位SDのデータアクセス関数 |
| `/lib/domain/entities.ts` | AcceptanceCriterionとImplUnitSdの型定義 |
| `/lib/mock/data/srf/srf.ts` | 既存system_functions構造 |
| `/lib/mock/data/tasks/tasks.ts` | 既存tasksとsystem_requirementsの関連 |

## 実行手順

1. **Supabase MCPでSQL実行**
   - `supabase_crud`スキルを使用してINSERT文を実行

2. **登録順序**
   - 先にacceptance_criteriaを登録（35件）
   - 次にimpl_unit_sdsを登録（18件）

3. **整合性チェック**
   ```sql
   -- 登録件数確認
   SELECT COUNT(*) FROM acceptance_criteria;
   SELECT COUNT(*) FROM impl_unit_sds;

   -- 領域別集計
   SELECT sd.system_domain_id, COUNT(*) as impl_unit_count
   FROM impl_unit_sds ius
   JOIN system_functions sf ON ius.srf_id = sf.id
   JOIN system_domains sd ON sf.system_domain_id = sd.id
   GROUP BY sd.system_domain_id;
   ```

## 検証方法

### 1. データ確認
```sql
-- 受入基準が正しく登録されたか
SELECT ac.id, ac.description, sr.title as requirement_title
FROM acceptance_criteria ac
JOIN system_requirements sr ON ac.system_requirement_id = sr.id
ORDER BY sr.id, ac.sort_order;

-- 実装単位SDが正しく登録されたか
SELECT ius.id, ius.name, ius.type, sf.title as srf_title
FROM impl_unit_sds ius
JOIN system_functions sf ON ius.srf_id = sf.id
ORDER BY sf.id, ius.id;
```

### 2. UI確認
- `http://localhost:3000/system-domains/AR/SRF-001` で受入基準が表示されるか
- `http://localhost:3000/system-domains/AP/SRF-009` で実装単位SDが表示されるか
- `http://localhost:3000/system-domains/GL/SRF-019` でデータが正しくリンクされているか

### 3. E2Eテスト
- Playwright MCPで各システムドメインページにアクセス
- 受入基準と実装単位SDが正しく表示されることを確認

## リスクと対策

| リスク | 対策 |
|--------|------|
| FK制約エラー | 登録前にsystem_requirements/system_functionsのIDを確認 |
| データ重複 | IDの一意性を保証する命名規則を使用 |
| JSON形式エラー | jsonbキャストとバリデーションを行う |
| 件数オーバー | 登録後のCOUNTで確認 |

## まとめ

- **Acceptance Criteria**: 35件（AR:12, AP:12, GL:11）
- **Impl Unit SD**: 18件（screen:9, api:5, batch:3, external_if:1）
- **Project ID**: `00000000-0000-0000-0000-000000000001`
- **実行方法**: Supabase MCPの`execute_sql`を使用
