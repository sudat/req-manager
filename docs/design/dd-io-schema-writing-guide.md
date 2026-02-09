# DD 入出力スキーマ／入出力項目 記述ガイド（非エンジニア向け）

## 1. この文書の目的

この文書は、DD（Design Document）にある以下4つの入力欄が「何を意味し」「どう書けばよいか」を、非エンジニアでも説明できるように整理したガイドである。

- 入力スキーマ
- 出力スキーマ
- 入力項目
- 出力項目

特に、次の混乱を解消することを目的とする。

- 「入出力スキーマと入出力項目の違いが分からない」
- 「テーブル項目（DBカラム）との違いが分からない」
- 「画面DDで `click` だけ書いても意味が伝わらない」

---

## 2. 先に結論（上司向け要約）

### 2.1 4項目の役割

- 入出力スキーマ: 振る舞いと契約の枠組み（いつ・何をすると・どうなるか）
- 入出力項目: その枠の中で扱う実データ（項目名、型、必須/任意など）

### 2.2 DB項目との関係

- 入出力項目は「利用者に見える業務データ」
- DB項目は「保存のための内部構造」
- 1対1で一致しないことが普通（分割・統合・非表示がある）

### 2.3 運用上のポイント

- 画面DDは「トリガーだけ」で終わらせず、必ず「操作内容」「操作対象」「前提条件」「期待動作」「画面変化」を書く
- API DDは「メソッド/パス/HTTPステータス」の契約と、REQ/RESの中身（項目）を分けて書く

---

## 3. 用語の定義

## 3.1 入出力スキーマとは

入出力スキーマは、処理の枠組み（契約）を表す定義である。  
「どんなきっかけで」「どんな単位で」「どのような結果を返すか」を明確にする。

例（API）:

- 入力スキーマ: `method=POST`, `path=/api/invoices`
- 出力スキーマ: `success.status=200`, `error.status=400/409`

例（画面）:

- 入力スキーマ: `trigger=click`, `action=請求書を発行`, `targetElement=一括発行ボタン`
- 出力スキーマ: `transition=/billing/invoices`, `behavior=発行ジョブをキュー投入`

## 3.2 入出力項目とは

入出力項目は、スキーマの中で実際にやり取りされるデータの中身である。

例:

- 入力項目: `selectedInvoiceIds`, `issueDate`, `operatorId`
- 出力項目: `jobId`, `queuedCount`, `failedItems`

## 3.3 テーブル項目（DB項目）との違い

テーブル項目は、DBに保存する都合で決まる内部列である。  
入出力項目は、業務や画面/APIの都合で決まる外向けデータである。

一致しない例:

- 入出力項目 `customerName` を、DBでは `first_name` と `last_name` に分割保存
- DBの `created_at` は内部管理用で、入出力項目としては公開しない
- DBの `subtotal` と `tax` を、出力項目では `totalAmount` に統合表示

---

## 4. なぜ分けて書くのか

## 4.1 仕様の曖昧さを減らすため

「何を押すと何が起きるか（スキーマ）」と「何のデータを使うか（項目）」を分けることで、伝達ミスを減らせる。

## 4.2 実装変更に強くするため

DB設計が変わっても、画面/APIの契約が維持されれば、業務上の影響を最小化できる。

## 4.3 レビュー観点を明確にするため

- スキーマレビュー: 振る舞い・遷移・ステータスが妥当か
- 項目レビュー: 必須項目漏れ、型、表示内容が妥当か

---

## 5. DD種別ごとの記述方針

| DD種別 | 入力スキーマ（枠） | 出力スキーマ（枠） | 入力項目（実データ） | 出力項目（実データ） | 書くべき要点 |
|---|---|---|---|---|---|
| `api` | `method`, `path`, `query`, `body` | `success(status, fields)`, `error(status, fields, description)` | REQのデータ項目 | RESのデータ項目 | API契約（HTTP）とデータ中身を分ける |
| `screen` | `trigger`, `action`, `targetElement`, `precondition` | `transition`, `messages`, `behavior`, `displayChanges` | ユーザー入力値・選択値 | 画面表示・更新データ | 「操作→結果→画面変化」を明記する |
| `batch` | `schedule`, `source`, `parameters` | `summary`, `nextBatch` | 実行条件・パラメータ | 集計結果・次回処理情報 | 実行条件と結果要約を明記する |
| `job` | `event`, `payload` | `result`, `nextEvent` | イベント由来データ | 処理結果データ | 非同期連鎖の入口と出口を明記する |
| `external_if` | `protocol`, `endpoint`（typeDetail中心） | 必要に応じて定義 | 連携入力データ | 連携出力データ | 通信方式・接続先・交換データを明確化 |
| `model` | 専用枠は薄い | 専用枠は薄い | モデル入力データ | モデル参照データ | 項目・制約・関連中心に書く |
| `report` | 専用枠は薄い | 専用枠は薄い | 出力条件 | 帳票表示項目 | 出力目的・集計ルール・表示列を明記 |

---

## 6. 画面DDの書き方（最重要）

画面DDで最も多い失敗は、入力スキーマに `click` だけを書いて終わるケースである。  
これでは振る舞いが特定できないため、次の順番で必ず記述する。

## 6.1 入力スキーマに書く内容

- `trigger`: 何がきっかけか（click/input/load/select）
- `action`: どんな操作か（例: 請求書を発行）
- `targetElement`: どのUI部品か（例: 一括発行ボタン）
- `precondition`: 実行条件（例: 1件以上選択済み）

## 6.2 出力スキーマに書く内容

- `transition`: 遷移先（同画面なら空も可）
- `messages`: 利用者向けメッセージ
- `behavior`: システム側で起きる処理
- `displayChanges`: 見た目の変化

## 6.3 入出力項目に書く内容

- 入力項目: 操作時に参照される実データ
  - 例: `selectedInvoiceIds`, `issueDate`, `operatorId`
- 出力項目: 実行後に表示・保持する実データ
  - 例: `jobId`, `queuedCount`, `failedItems`

## 6.4 画面DD 記述例

```yaml
ioType: screen
inputSchema:
  trigger: click
  action: 請求書を発行
  targetElement: 一括発行ボタン
  precondition: 請求対象が1件以上選択されている
outputSchema:
  transition: ""
  messages:
    - 発行を受け付けました
  behavior: 発行ジョブをキュー投入し、一覧を再読み込みする
  displayChanges: 対象行のステータスを「発行待ち」に更新し、トーストを表示する
inputFields:
  - name: selectedInvoiceIds
    type: array
    required: true
  - name: issueDate
    type: string
    required: true
outputFields:
  - name: jobId
    type: string
    required: true
  - name: queuedCount
    type: number
    required: true
```

---

## 7. API DDの書き方

API DDは、次の2層で整理すると伝わりやすい。

- スキーマ（契約）: HTTPの入口と出口
- 項目（中身）: REQ/RESでやり取りする実データ

## 7.1 API DD 記述例

```yaml
ioType: api
inputSchema:
  method: POST
  path: /api/v1/invoices/issue
  query: []
  body:
    - name: selectedInvoiceIds
      type: array
      required: true
    - name: issueDate
      type: string
      required: true
outputSchema:
  success:
    status: 200
    fields:
      - name: jobId
        type: string
        required: true
      - name: queuedCount
        type: number
        required: true
  error:
    - status: 400
      description: 入力不備
      fields:
        - name: errorCode
          type: string
          required: true
        - name: message
          type: string
          required: true
inputFields:
  - name: selectedInvoiceIds
    type: array
    required: true
outputFields:
  - name: jobId
    type: string
    required: true
```

---

## 8. 現在の対象画面の読み方（ARサンプル）

## 8.1 DD-AR-001-02（API）

解釈として正しい形:

- 入力スキーマ: エンドポイント、HTTPメソッド、入力経路（query/body）
- 出力スキーマ: 成功/失敗コードとレスポンス形
- 入力項目: REQの中身
- 出力項目: RESの中身

## 8.2 DD-AR-001-01（画面）

解釈として正しい形:

- 入力スキーマ: きっかけ＋操作内容＋対象＋前提
- 出力スキーマ: 操作後の遷移/メッセージ/期待動作/画面変化
- 入力項目: ユーザーが入れる・選ぶデータ
- 出力項目: 実行後に画面で扱うデータ

---

## 9. NG記述と改善例

## 9.1 NG例（情報不足）

```yaml
inputSchema:
  trigger: click
```

この記述では、次が不明である。

- 何をするクリックか
- どのボタン/部品を押すか
- 実行条件は何か
- 実行後に何が起きるか

## 9.2 改善例（説明可能）

```yaml
inputSchema:
  trigger: click
  action: 請求書を発行
  targetElement: 一括発行ボタン
  precondition: 請求対象が1件以上選択されている
outputSchema:
  behavior: 発行ジョブをキュー投入し一覧を更新する
  displayChanges: 対象行のステータスを発行待ちに変更する
```

---

## 10. レビュー時チェックリスト

上司レビュー時は、以下を順に確認する。

1. スキーマだけ読んで、処理の流れ（開始条件→結果）を説明できるか  
2. 項目だけ読んで、業務データの入出力を説明できるか  
3. 画面DDで `action` と `behavior` が空欄でないか  
4. API DDで HTTP契約（method/path/status）が明示されているか  
5. 入出力項目がDB内部列に寄りすぎていないか  
6. 受入観点（ユーザーに見える結果）が `messages` や `displayChanges` に記載されているか  

---

## 11. まとめ

この設計ルールのポイントは、次の1文に集約できる。

**「スキーマは振る舞いの枠、項目は業務データの中身」**

この分離を維持することで、非エンジニアとエンジニアの間で「何を作るか」の認識合わせがしやすくなる。  
特に画面DDでは、`click` のようなトリガー単体で終わらせず、`action` / `targetElement` / `precondition` / `behavior` / `displayChanges` まで記述することが、品質と説明可能性の鍵である。
