# DDサンプルデータ拡充計画

## コンテキスト

ユーザーから `http://localhost:3000/system/AR/SF-AR-0001` のDD（Design Document）について「サンプルデータとして不十分な箇所が多数あるから全体的にもっと追加して」という依頼がありました。

**現状のデータ状況（プロジェクトID: 00000000-0000-0000-0000-000000000001）:**

- AR（債権管理）: SF 9件, DD 25件
- AP（債務管理）: SF 8件, DD 13件
- GL（一般会計）: SF 8件, DD 10件
- 合計: SF 26件, DD 48件

**課題（既存DDのdetailsが不足）:**
1. **すべてのDDでcore_logic.rulesが空**（48件中0件がルールを持つ）
2. **model型DDの一部でattributesが不足**（例: DD-SF-AR-0001-005は2件のみ）
3. **model型DDの一部でstateTransitionsが不足**（ARの7件中3件のみ）
4. **api/batch/screen/external_if型ではtypeDetailが未定義の場合がある**

**方針:**
- SFは追加しない（既存のSFのみ）
- 既存のDDのdetailsをUPDATEして拡充する

**具体的な不足例:**
- `DD-SF-AR-0001-001`（請求書発行画面）: inputFields/outputFieldsはあるが、coreLogic.rulesが空
- `DD-SF-AR-0001-005`（請求書テーブル）: attributesが2件のみ（必要なフィールドが不足）
- `DD-SF-AR-0001-002`（請求書発行API）: typeDetail（method, path）が未定義

## 実装アプローチ

既存のDDのdetailsをUPDATEすることで、サンプルデータを拡充します。

### 対象DD一覧（優先順位順）

**優先度高（AR領域 - SF-AR-0001 請求書発行機能）:**
1. `DD-SF-AR-0001-001`（screen）: coreLogic.rules追加
2. `DD-SF-AR-0001-002`（api）: typeDetail追加、coreLogic.rules追加
3. `DD-SF-AR-0001-003`（batch）: typeDetail追加、coreLogic.rules追加
4. `DD-SF-AR-0001-004`（external_if）: typeDetail追加、coreLogic.rules追加
5. `DD-SF-AR-0001-005`（model - 請求書テーブル）: attributes拡充、stateTransitions追加
6. `DD-SF-AR-0001-007`（model - 請求明細テーブル）: attributes追加、stateTransitions追加

**優先度中（AR領域 - 他のSF）:**
7. SF-AR-0002（入金消込機能）のDD
8. SF-AR-0003（売掛残高照会機能）のDD

**優先度低（AP/GL領域）:**
9. AP領域のDD
10. GL領域のDD

### 追加するデータの詳細

#### 1. DD-SF-AR-0001-001（請求書発行画面）coreLogic.rules

```json
{
  "rules": [
    {
      "name": "billing_period_validation",
      "type": "validation",
      "description": "請求対象期間の形式と範囲を検証",
      "preconditions": ["billingPeriodがYYYY-MM形式", "請求対象期間が締め処理完了後"],
      "formula": null,
      "notes": "過去日や未来日への請求は許可しない"
    },
    {
      "name": "customer_eligibility_check",
      "type": "state",
      "description": "顧客が請求書発行可能か確認",
      "preconditions": ["顧客が存在する", "顧客ステータスがactive"],
      "formula": null,
      "notes": "停止中・解約済みの顧客には請求書発行不可"
    },
    {
      "name": "invoice_line_aggregation",
      "type": "aggregation",
      "description": "請求対象期間の取引を集約",
      "preconditions": ["請求対象期間に明細データが存在する"],
      "formula": "totalAmount = SUM(unit_price * quantity)",
      "notes": "税率ごとの集計も行う"
    },
    {
      "name": "tax_calculation",
      "type": "calculation",
      "description": "消費税計算（端数処理）",
      "preconditions": ["各明細の税率が確定している"],
      "formula": "taxAmount = SUM(amount * taxRate) / 切り捨て",
      "rounding": "切捨て",
      "precision": "1円単位"
    },
    {
      "name": "invoice_numbering",
      "type": "decision",
      "description": "請求書番号採番",
      "preconditions": ["採番テーブルが存在する"],
      "formula": "INV-YYYYMM-{連番:0004}",
      "notes": "欠番が発生しないよう排他制御が必要"
    }
  ]
}
```

#### 2. DD-SF-AR-0001-002（請求書発行API）typeDetail追加

```json
{
  "ioType": "api",
  "typeDetail": {
    "ioType": "api",
    "method": "POST",
    "path": "/api/ar/invoices"
  }
}
```

#### 3. DD-SF-AR-0001-003（請求書一括発行バッチ）typeDetail追加

```json
{
  "ioType": "batch",
  "typeDetail": {
    "ioType": "batch",
    "schedule": "0 2 * * *",
    "source": "/data/invoice_requests.csv"
  }
}
```

#### 4. DD-SF-AR-0001-004（メール送信I/F）typeDetail追加

```json
{
  "ioType": "external_if",
  "typeDetail": {
    "ioType": "external_if",
    "protocol": "HTTPS",
    "endpoint": "${EMAIL_SERVICE_API}/send"
  }
}
```

#### 5. DD-SF-AR-0001-005（請求書テーブル）attributes拡充

**現在:** invoiceId, customerId（2件）
**追加予定:** invoice_no, issue_date, due_date, total_amount, tax_amount, status, created_at, updated_at

```json
{
  "attributes": [
    {"name": "invoiceId", "type": "UUID", "primaryKey": true, "nullable": false, "logicalName": "請求書ID"},
    {"name": "customerId", "type": "UUID", "nullable": false, "logicalName": "顧客ID"},
    {"name": "invoiceNo", "type": "string", "unique": true, "nullable": false, "logicalName": "請求書番号", "constraints": {"pattern": "^INV-\\\\d{8}-\\\\d{4}$"}},
    {"name": "issueDate", "type": "Date", "nullable": false, "logicalName": "発行日"},
    {"name": "dueDate", "type": "Date", "nullable": false, "logicalName": "支払期限", "constraints": {"min": "issueDate"}},
    {"name": "totalAmount", "type": "number", "nullable": false, "logicalName": "税込総額", "constraints": {"min": 0}},
    {"name": "taxAmount", "type": "number", "nullable": false, "logicalName": "消費税額", "constraints": {"min": 0}},
    {"name": "subtotalAmount", "type": "number", "nullable": false, "logicalName": "税抜金額", "constraints": {"min": 0}},
    {"name": "status", "type": "enum", "nullable": false, "logicalName": "ステータス", "enumValues": ["draft", "issued", "paid", "canceled"], "default": "draft"},
    {"name": "createdAt", "type": "timestamp", "nullable": false, "logicalName": "作成日時"},
    {"name": "updatedAt", "type": "timestamp", "nullable": false, "logicalName": "更新日時"}
  ]
}
```

#### 6. DD-SF-AR-0001-005（請求書テーブル）stateTransitions追加

```json
{
  "stateTransitions": [
    {"from": "draft", "to": ["issued", "canceled"], "condition": "発行指示またはキャンセル"},
    {"from": "issued", "to": ["paid", "canceled"], "condition": "入金完了またはキャンセル"},
    {"from": "paid", "to": [], "condition": "最終状態（遷移なし）"},
    {"from": "canceled", "to": [], "condition": "最終状態（遷移なし）"}
  ]
}
```

### Phase 1: システム領域（SD）の作成

AR, AP, GL の3つのシステム領域を作成します。

**SQL:**
```sql
INSERT INTO system_domains (id, project_id, name, description, sort_order) VALUES
('SD-AR', 'f7f85d50-7587-464b-90b8-5c85807e748c', '売掛金管理', '請求書発行から入金消込までの売掛金を管理する領域', 1),
('SD-AP', 'f7f85d50-7587-464b-90b8-5c85807e748c', '買掛金管理', '仕入伝票から支払までの買掛金を管理する領域', 2),
('SD-GL', 'f7f85d50-7587-464b-90b8-5c85807e748c', '総勘定元帳', '仕訳登録から財務諸表作成までの会計処理を管理する領域', 3);
```

### Phase 2: システム機能（SF）の作成

各SD配下にシステム機能を作成します。AR領域を例に挙げると：

| SF ID | 名称 | 説明 |
|-------|------|------|
| SF-AR-0001 | 請求書発行機能 | 請求書を生成・発行する機能 |
| SF-AR-0002 | 入金消込機能 | 入金データと請求データを突合・消込する機能 |
| SF-AR-0003 | 売掛残高照会機能 | 顧客別の売掛残高を確認する機能 |

AP領域、GL領域も同様に作成。

### Phase 3: デザイン書（DD）の作成

各SF配下に詳細なDDを作成します。AR領域のSF-AR-0001（請求書発行機能）を例に挙げると：

#### 3.1 DD一覧

| DD ID | タイプ | 名称 | エントリポイント |
|-------|--------|------|------------------|
| DD-AR-001 | screen | 請求書発行画面 | `/app/ar/invoice-issue/page.tsx` |
| DD-AR-002 | api | 請求書発行API | `/app/api/ar/invoices/route.ts` |
| DD-AR-003 | batch | 請求書PDF生成バッチ | `jobs/invoice-pdf-batch.ts` |
| DD-AR-004 | model | 請求書エンティティ | (論理モデル) |
| DD-AR-005 | external_if | メール送信I/F | （外部メールサービス連携） |

#### 3.2 各DDの詳細（構造化スキーマ使用）

**DD-AR-001（screen）:**
- inputFields: 顧客ID、請求対象期間、出力先（メール/PDFダウンロード）
- outputFields: 発行結果、請求書PDF URL
- coreLogic: 請求書作成のビジネスルール
- sideEffects: 請求書データ作成（DB）、PDF生成（ファイル）

**DD-AR-004（model）:**
- typeDetail: 論理エンティティ定義
  - entityName: Invoice（請求書）
  - attributes: id, customer_id, issue_date, due_date, total_amount, tax_amount, status
  - relationships: Customer (N:1), InvoiceLine (1:N)
  - stateTransitions: draft → issued → paid → canceled

### Phase 4: 業務側データの作成

システム側の機能を実現するための業務要件も必要に応じて作成します。

| BD | BT | BR |
|----|----|-----|
| BD-AR: 請求業務 | BT-AR-001: 請求書発行 | BR-AR-001: 請求書をPDFで出力できる |

### 実装方法

**方法A: SQL直接実行（推奨）**
- Supabase MCPを使用して、各テーブルにINSERT文を実行
- データ量が多くないため、SQLで直接挿入する方が高速

**方法B: アプリ経由**
- UI画面から手動で作成
- 時間がかかるため非推奨

### 作成するサンプルデータの詳細

#### AR領域（売掛金管理）

**SD-AR / SF-AR-0001（請求書発行機能）**

1. **DD-AR-001: 請求書発行画面（screen）**
   - inputFields:
     - customerId: 顧客ID（必須、string）
     - targetMonth: 請求対象月（必須、string, format: yyyy-MM）
     - outputType: 出力先（必須、enum: [pdf, email]）
   - outputFields:
     - invoiceId: 発行された請求書ID
     - pdfUrl: PDFダウンロードURL
   - coreLogic:
     - 請求対象期間の取引を集約
     - 消費税計算（端数切捨て）
     - 請求書番号採番（連番）
   - sideEffects:
     - DB操作: invoicesテーブルにINSERT
     - ファイル出力: PDFを `/invoices/{invoiceId}.pdf` に保存
     - 外部API: email出力の場合、メール送信APIを呼ぶ

2. **DD-AR-002: 請求書発行API（api）**
   - ioType: api
   - typeDetail: { method: "POST", path: "/api/ar/invoices" }
   - inputFields: （screenと同じ）
   - outputFields: （screenと同じ）
   - exceptions:
     - 請求対象データが存在しない（400）
     - 顧客が存在しない（404）
     - 採番エラー（500）

3. **DD-AR-003: 請求書PDF生成バッチ（batch）**
   - ioType: batch
   - typeDetail: { schedule: "0 2 * * *", source: "/data/invoice_requests.csv" }
   - inputFields:
     - requestId: バッチリクエストID
   - outputFields:
     - processedCount: 処理件数
     - successCount: 成功件数
     - errorCount: 失敗件数
   - sideEffects:
     - ファイル出力: PDFを一括生成
     - DB操作: ステータス更新

4. **DD-AR-004: 請求書エンティティ（model）**
   - ioType: model
   - typeDetail:
     - entityName: Invoice
     - entityLogicalName: 請求書
     - entityDescription: 顧客への請求を表すエンティティ
     - attributes:
       - id: UUID PK
       - customer_id: 顧客ID FK
       - invoice_no: 請求書番号（ユニーク）
       - issue_date: 発行日
       - due_date: 支払期日
       - total_amount: 税込総額
       - tax_amount: 消費税額
       - status: ステータス（draft/issued/paid/canceled）
     - relationships:
       - Customer: N:1（1つの請求書は1人の顧客に属する）
       - InvoiceLine: 1:N（1つの請求書は複数の明細を持つ）
     - stateTransitions:
       - draft → issued: 発行時
       - issued → paid: 入金完了時
       - issued → canceled: キャンセル時

5. **DD-AR-005: メール送信I/F（external_if）**
   - ioType: external_if
   - typeDetail:
     - protocol: HTTPS
     - endpoint: https://api.example-mail.com/v1/send
   - inputFields:
     - to: 送信先メールアドレス
     - subject: 件名
     - attachment: 添付ファイルURL（PDF）
   - outputFields:
     - messageId: 送信メッセージID
   - sideEffects:
     - 外部API: メール送信APIを呼ぶ
   - exceptions:
     - 送信失敗（503）
     - 再試行ポリシー: 3回、指数バックオフ

**SD-AR / SF-AR-0002（入金消込機能）**

1. **DD-AR-006: 入金消込画面（screen）**
2. **DD-AR-007: 入金消込API（api）**
3. **DD-AR-008: 消込ロジック（coreLogic詳細）**

**SD-AR / SF-AR-0003（売掛残高照会機能）**

1. **DD-AR-009: 売掛残高一覧画面（screen）**
2. **DD-AR-010: 売掛残高集計API（api）**

#### AP領域（買掛金管理）

**SD-AP / SF-AP-0001〜0003**
- 仕入伝票登録機能
- 支払処理機能
- 買掛残高照会機能
- AR領域と対称的な構造

#### GL領域（総勘定元帳）

**SD-GL / SF-GL-0001〜0004**
- 仕訳登録機能
- 仕訳一覧照会機能
- 財務諸表作成機能
- 試算表作成機能

## 実装方法

**方法: Supabase MCPでUPDATE実行**

1. 各DDのdetailsをUPDATEするSQLを作成
2. Supabase MCPのexecute_sqlで実行
3. UIで反映を確認

**UPDATEの例（DD-SF-AR-0001-001のcoreLogic.rules追加）:**
```sql
UPDATE design_documents
SET details = jsonb_set(
  details,
  '{coreLogic,rules}',
  '[...rules...]'
)
WHERE id = 'DD-SF-AR-0001-001' AND project_id = '00000000-0000-0000-0000-000000000001';
```

## 検証方法

1. `/system/AR/SF-AR-0001` にアクセスしてDDが表示される
2. 各DDの「コアロジック」セクションにルールが表示される
3. model型DDの「属性定義」に全フィールドが表示される
4. model型DDの「状態遷移」に遷移図が表示される
5. ER図画面（`/schema/er`）でmodel型DDが正しく表示される

## タスクリスト

- [ ] DD-SF-AR-0001-001: coreLogic.rules追加（請求書発行画面）
- [ ] DD-SF-AR-0001-002: typeDetail追加、coreLogic.rules追加（請求書発行API）
- [ ] DD-SF-AR-0001-003: typeDetail追加、coreLogic.rules追加（請求書一括発行バッチ）
- [ ] DD-SF-AR-0001-004: typeDetail追加、coreLogic.rules追加（メール送信I/F）
- [ ] DD-SF-AR-0001-005: attributes拡充、stateTransitions追加（請求書テーブル）
- [ ] DD-SF-AR-0001-006: 検証（既に詳細なのでスキップ可）
- [ ] DD-SF-AR-0001-007: attributes追加、stateTransitions追加（請求明細テーブル）
