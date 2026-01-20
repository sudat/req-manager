import { SystemFunction, RelatedRequirementInfo, DesignItemCategory } from '@/lib/domain';

export const systemFunctions: SystemFunction[] = [
  // AR関連（7件 → 6件に統合）
  {
    id: "SRF-001",
    category: "screen",
    title: "請求書発行",
    summary: `## 概要

適格請求書等保存方式に対応した請求書PDFを生成する機能

### 主な機能
- PuppeteerとHandlebars.jsによるHTMLテンプレートからのPDF生成
- 税率別（10%/8%）の対価額と税額の集計・表示
- 登録番号（T+13桁）を含むインボイス対応帳票出力

### 対象
経理担当者、営業担当者（請求書作成者）

### 関連
- 関連タスク：TASK-003
- 関連要件：SR-TASK-003-001, SR-TASK-003-002`,
    status: "implemented",
    relatedTaskIds: ["TASK-003"],
    requirementIds: ["SR-TASK-003-001", "SR-TASK-003-002"],
    systemDesign: [
      {
        id: "SD-001-001",
        category: "ui",
        title: "請求書テンプレートエンジン",
        description: "Puppeteerを使用してHTMLベースの請求書テンプレートからPDFを生成する。テンプレートはHandlebars.jsを使用し、動的なデータバインディングに対応する。",
        priority: "high"
      },
      {
        id: "SD-001-002",
        category: "database",
        title: "税率別内訳データ構造",
        description: "請求明細テーブルに税率コード（10%/8%）を追加し、税率ごとの対価額と税額を集計可能にする。適格請求書要件を満たすデータモデル。",
        priority: "high"
      },
      {
        id: "SD-001-003",
        category: "api",
        title: "請求書生成API",
        description: "REST APIエンドポイント `/api/invoices/generate` を提供。請求対象IDを受け取り、PDF生成キューを登録する。非同期処理でPDF生成を行い、完了通知を送信。",
        priority: "high"
      },
      {
        id: "SD-001-004",
        category: "integration",
        title: "登録番号表示対応",
        description: "事業者マスタに登録番号（T+13桁）を追加し、請求書PDFのフッター部に表示する。インボイス制度対応。",
        priority: "high"
      },
      {
        id: "SD-001-005",
        category: "batch",
        title: "PDF生成バッチ処理",
        description: "定時実行バッチで請求対象を抽出し、一括PDF生成を行う。大量処理時にキューイングし、処理順序を制御。",
        priority: "medium"
      },
      {
        id: "SD-001-006",
        category: "error_handling",
        title: "PDF生成エラーハンドリング",
        description: "テンプレート解析エラー、データ不備、Puppeteerプロセス異常等のエラーパターンを定義し、再実行機能を提供。",
        priority: "medium"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/billing",
        paths: [
          "apps/billing/src/invoice/generateInvoice.ts",
          "apps/billing/src/invoice/templates/invoice-template.html",
        ],
        note: "請求書生成のメインロジックとテンプレート",
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "SRF-002",
    category: "internal",
    title: "税率別内訳集計機能",
    summary: `## 概要

請求明細から税率別の対価と税額を集計し、帳票出力APIへ提供する機能

### 主な機能
- 商品マスタの税率区分に基づく軽減税率（8%）と標準税率（10%）の判定・計算
- 税率別集計結果のキャッシュによる再集計負荷軽減
- 端数処理ルール（切り捨て/四捨五入/切り上げ）の設定

### 対象
経理担当者、税務担当者

### 関連
- 関連タスク：TASK-003
- 関連要件：SR-TASK-003-003`,
    status: "implemented",
    relatedTaskIds: ["TASK-003"],
    requirementIds: ["SR-TASK-003-003"],
    systemDesign: [
      {
        id: "SD-002-001",
        category: "logic",
        title: "税率計算アルゴリズム",
        description: "軽減税率（8%）と標準税率（10%）の判定ロジックを実装。商品マスタの税率区分に基づき、明細行ごとの税額を計算。",
        priority: "high"
      },
      {
        id: "SD-002-002",
        category: "database",
        title: "税率別集計テーブル",
        description: "集計結果をキャッシュするテーブルを設計。請求ヘッダID、税率コード、対象額、税額を保持し、再集計の負荷を軽減。",
        priority: "medium"
      },
      {
        id: "SD-002-003",
        category: "logic",
        title: "端数処理ルール",
        description: "税額計算時の端数処理（切り捨て/四捨五入/切り上げ）を設定可能にする。デフォルトは切り捨て。",
        priority: "medium"
      },
      {
        id: "SD-002-004",
        category: "api",
        title: "税額集計API",
        description: "請求明細データを受け取り、税率別集計結果を返すAPIエンドポイント。帳票出力APIから呼び出される。",
        priority: "high"
      },
      {
        id: "SD-002-005",
        category: "batch",
        title: "税額集計バッチ",
        description: "月次処理で税額集計の正確性を検証するバッチ。税務申告用データを作成。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/billing",
        paths: [
          "apps/billing/src/tax/calculateTax.ts",
          "apps/billing/src/tax/types.ts",
        ],
        note: "税率計算と集計ロジック",
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "SRF-003",
    category: "internal",
    title: "入金データ取り込み機能",
    summary: `## 概要

銀行からダウンロードした全銀フォーマットファイルを解析し、入金データをデータベースへ登録する機能

### 主な機能
- 全銀協フォーマット（固定長テキスト）のパース処理
- FTPサーバーからの銀行ファイル自動ダウンロードと取り込みバッチ処理
- フォーマットエラー、文字化け等のエラーハンドリングと再実行機能

### 対象
経理担当者、システム管理者

### 関連
- 関連タスク：TASK-004
- 関連要件：SR-TASK-004-001`,
    status: "implementing",
    relatedTaskIds: ["TASK-004"],
    requirementIds: ["SR-TASK-004-001"],
    systemDesign: [
      {
        id: "SD-003-001",
        category: "integration",
        title: "全銀フォーマットパーサー",
        description: "日本の銀行標準フォーマット（全銀協）を解析するパーサーを実装。固定長テキストデータをデコードし、入金情報を抽出。",
        priority: "high"
      },
      {
        id: "SD-003-002",
        category: "database",
        title: "入金データテーブル",
        description: "取り込んだ入金データを保存するテーブル設計。銀行コード、支店コード、口座番号、入金額、入金日等を保持。",
        priority: "high"
      },
      {
        id: "SD-003-003",
        category: "batch",
        title: "取り込みバッチ処理",
        description: "FTPサーバーから銀行ファイルをダウンロードし、パース処理を実行。エラーレコードは別テーブルに保存。",
        priority: "high"
      },
      {
        id: "SD-003-004",
        category: "error_handling",
        title: "エラーハンドリングと再実行",
        description: "フォーマットエラー、文字化け、レコード長不一致等のエラーを検知。エラーファイルを保存し、再実行機能を提供。",
        priority: "medium"
      },
      {
        id: "SD-003-005",
        category: "database",
        title: "取り込み履歴テーブル",
        description: "ファイル名、取り込み日時、レコード数、成功/失敗数を記録。監査証跡として活用。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/payment",
        paths: [
          "apps/payment/src/import/bankFileParser.ts",
          "apps/payment/src/import/paymentImportService.ts",
        ],
        note: "銀行ファイルパーサーとインポートサービス",
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "SRF-004",
    category: "internal",
    title: "入金消込機能",
    summary: `## 概要

取り込んだ入金データと請求データを突合し、自動・手動で消込処理を行う機能

### 主な機能
- 顧客コード、金額、入金日をキーとした自動消込アルゴリズム
- 自動消込できなかった入金の手動紐付け（ドラッグ＆ドロップ対応）
- 1回の入金で複数請求を消込、または複数回の入金で1請求を消込する部分消込対応

### 対象
経理担当者、回収担当者

### 関連
- 関連タスク：TASK-004
- 関連要件：SR-TASK-004-002`,
    status: "testing",
    relatedTaskIds: ["TASK-004"],
    requirementIds: ["SR-TASK-004-002"],
    systemDesign: [
      {
        id: "SD-004-001",
        category: "logic",
        title: "自動消込アルゴリズム",
        description: "顧客コード、金額、入金日をキーとして、請求データとマッチング。完全一致の場合は自動消込。",
        priority: "high"
      },
      {
        id: "SD-004-002",
        category: "database",
        title: "消込テーブル設計",
        description: "入金ID、請求ID、消込額、消込日、消込タイプ（自動/手動）を管理。部分消込にも対応。",
        priority: "high"
      },
      {
        id: "SD-004-003",
        category: "ui",
        title: "手動消込画面",
        description: "自動消込できなかった入金と請求の一覧を表示し、手動で紐付けられるUI。ドラッグ＆ドロップで紐付け。",
        priority: "medium"
      },
      {
        id: "SD-004-004",
        category: "logic",
        title: "部分消込対応",
        description: "1回の入金で複数請求を消込、または複数回の入金で1請求を消込するロジック。残高管理。",
        priority: "medium"
      },
      {
        id: "SD-004-005",
        category: "database",
        title: "消込履歴テーブル",
        description: "消込操作の履歴を記録。誰がいつどの操作を行ったかを追跡可能。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/payment",
        paths: [
          "apps/payment/src/matching/reconciliationService.ts",
          "apps/payment/src/matching/paymentMatchingEngine.ts",
        ],
        note: "消込ロジックとマッチングエンジン",
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "SRF-005",
    category: "screen",
    title: "債権管理一覧画面",
    summary: `## 概要

未回収債権を一覧表示し、督促状況や回収計画を確認できる画面

### 主な機能
- 顧客別、期日別、金額順でのソート・フィルタ機能
- 経過日数に応じた色分け表示（30日以内：青、60日以内：黄、60日超：赤）
- 債権一覧のExcel/CSV形式エクスポート

### 対象
経理担当者、回収担当者、営業マネージャー

### 関連
- 関連タスク：TASK-005
- 関連要件：SR-TASK-005-001, SR-TASK-005-002`,
    status: "not_implemented",
    relatedTaskIds: ["TASK-005"],
    requirementIds: ["SR-TASK-005-001", "SR-TASK-005-002"],
    systemDesign: [
      {
        id: "SD-005-001",
        category: "ui",
        title: "債権一覧画面",
        description: "未回収債権の一覧表示。顧客別、期日別、金額順でソート可能。回収担当者別のフィルタ機能。",
        priority: "high"
      },
      {
        id: "SD-005-002",
        category: "database",
        title: "債権残高ビュー",
        description: "請求テーブルと入金テーブルを結合し、債権残高を算出するビュー。パフォーマンス最適化。",
        priority: "high"
      },
      {
        id: "SD-005-003",
        category: "ui",
        title: "督促ステータス表示",
        description: "債権の経過日数に応じて色分け表示（30日以内：青、60日以内：黄、60日超：赤）。督促状発行ボタン。",
        priority: "medium"
      },
      {
        id: "SD-005-004",
        category: "api",
        title: "回収計画立案API",
        description: "債権残高と回収予定日から回収計画を作成するAPI。キャッシュフロー予測に活用。",
        priority: "low"
      },
      {
        id: "SD-005-005",
        category: "ui",
        title: "エクスポート機能",
        description: "債権一覧をExcel/CSV形式でエクスポート。経理部門での社内共有に対応。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ar",
        paths: [
          "apps/ar/src/collection/receivablesListScreen.tsx",
          "apps/ar/src/collection/receivablesService.ts",
        ],
        note: "債権管理一覧画面とサービス層",
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "SRF-006",
    category: "screen",
    title: "与信管理画面",
    summary: `## 概要

顧客別の与信枠を管理し、限度超過時のアラートを行う画面

### 主な機能
- 顧客別の与信枠、使用枠、残枠の一覧表示と超過顧客のハイライト
- 売掛計上時の与信枠チェックと超過時のアラート通知（受注阻止オプション付き）
- 与信枠変更履歴の記録と監査証跡

### 対象
営業担当者、与信管理者、経理担当者

### 関連
- 関連タスク：TASK-001
- 関連要件：SR-TASK-001-001`,
    status: "implementing",
    relatedTaskIds: ["TASK-001"],
    requirementIds: ["SR-TASK-001-001"],
    systemDesign: [
      {
        id: "SD-006-001",
        category: "database",
        title: "与信枠管理テーブル",
        description: "顧客ごとの与信枠、使用枠、残枠を管理。履歴テーブルで変更履歴を追跡。",
        priority: "high"
      },
      {
        id: "SD-006-002",
        category: "ui",
        title: "与信管理画面",
        description: "顧客別の与信枠一覧表示。限度超過顧客は赤字でハイライト。与信枠変更ダイアログ。",
        priority: "high"
      },
      {
        id: "SD-006-003",
        category: "logic",
        title: "限度超過検出ロジック",
        description: "売掛計上時に与信枠をチェックし、超過場合はアラートを発報。受注阻止のオプション。",
        priority: "high"
      },
      {
        id: "SD-006-004",
        category: "api",
        title: "アラート通知API",
        description: "与信枠超過時にメールおよび画面通知を送信。通知先は営業担当、経理担当。",
        priority: "medium"
      },
      {
        id: "SD-006-005",
        category: "database",
        title: "与信枠変更履歴",
        description: "変更日時、変更前、変更後、変更理由を記録。監査証跡として活用。",
        priority: "medium"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ar",
        paths: [
          "apps/ar/src/credit/creditLimitService.ts",
        ],
        note: "与信枠管理サービス",
      },
    ],
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-03-15T00:00:00Z",
  },
  {
    id: "SRF-007",
    category: "interface",
    title: "電子請求書送信IF",
    summary: `## 概要

生成された請求書PDFを顧客ポータルへ送信するインターフェース機能

### 主な機能
- 顧客ポータルとのAPI連携（OAuth 2.0認証）による請求書PDF送信
- 送信キューマネージャーによるリトライ機能とデッドレターキュー管理
- 送信結果の記録と失効分の再送機能

### 対象
経理担当者、システム管理者

### 関連
- 関連タスク：TASK-003
- 関連要件：SR-TASK-003-004`,
    status: "not_implemented",
    relatedTaskIds: ["TASK-003"],
    requirementIds: ["SR-TASK-003-004"],
    systemDesign: [
      {
        id: "SD-007-001",
        category: "integration",
        title: "顧客ポータルAPI連携",
        description: "顧客ポータルとAPI連携し、請求書PDFを送信。認証にはOAuth 2.0を使用。",
        priority: "high"
      },
      {
        id: "SD-007-002",
        category: "batch",
        title: "送信キューマネージャー",
        description: "請求書PDF生成後、即時送信キューに登録。リトライ機能、デッドレターキューを管理。",
        priority: "high"
      },
      {
        id: "SD-007-003",
        category: "database",
        title: "送信結果テーブル",
        description: "送信ID、請求書ID、送信日時、送信ステータス（成功/失敗）、エラー内容を記録。",
        priority: "high"
      },
      {
        id: "SD-007-004",
        category: "api",
        title: "再送API",
        description: "送信失敗または顧客の再送要求に対応。送信キューへの再登録機能。",
        priority: "medium"
      },
      {
        id: "SD-007-005",
        category: "batch",
        title: "送信結果監視バッチ",
        description: "定期的に送信結果を確認し、失敗分を検出。管理者に通知。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/billing",
        paths: [
          "apps/billing/src/invoice/eInvoiceSender.ts",
          "apps/billing/src/api/eInvoiceAPI.ts",
        ],
        note: "電子請求書送信APIとポータル連携",
      },
    ],
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "SRF-008",
    category: "internal",
    title: "延滞債権アラート機能",
    summary: `## 概要

延滞債権を検知し、関係者へ通知する機能

### 主な機能
- 日次バッチによる延滞債権の自動検出（基準日：支払期日+60日）
- 延滞債権情報を含むメール通知（回収担当者宛）
- 通知履歴の記録による二重通知防止

### 対象
回収担当者、経理担当者

### 関連
- 関連タスク：TASK-006, TASK-005
- 関連要件：SR-TASK-006-001`,
    status: "testing",
    relatedTaskIds: ["TASK-006", "TASK-005"],
    requirementIds: ["SR-TASK-006-001"],
    systemDesign: [
      {
        id: "SD-008-001",
        category: "database",
        title: "延滞基準日管理テーブル",
        description: "顧客ごとの延滞基準日を管理。デフォルトは支払期日+60日。",
        priority: "high"
      },
      {
        id: "SD-008-002",
        category: "batch",
        title: "延滞検出バッチ",
        description: "日次バッチで延滞債権を検出。基準日を超過した債権を抽出。",
        priority: "high"
      },
      {
        id: "SD-008-003",
        category: "api",
        title: "メール通知機能",
        description: "延滞債権の情報をメールテンプレートに埋め込み、回収担当者へ送信。",
        priority: "medium"
      },
      {
        id: "SD-008-004",
        category: "database",
        title: "通知履歴テーブル",
        description: "通知ID、債権ID、通知日時、通知先、通知内容を記録。二重通知防止。",
        priority: "medium"
      },
      {
        id: "SD-008-005",
        category: "ui",
        title: "通知設定画面",
        description: "延滞基準日、通知先、通知タイミングを設定する画面。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ar",
        paths: [
          "apps/ar/src/collection/overdueAlertService.ts",
        ],
        note: "延滞アラートサービス",
      },
    ],
    createdAt: "2024-02-15T00:00:00Z",
    updatedAt: "2024-04-01T00:00:00Z",
  },
  // AP関連（8件）
  {
    id: "SRF-009",
    category: "screen",
    title: "支払依頼画面",
    summary: `## 概要

支払対象の仕入請求書を選択し、金額確認の上で承認依頼を行う画面

### 主な機能
- 仕入請求書の一覧表示とチェックボックスによる支払対象選択
- 支払対象の合計金額と買掛残高の照合・バリデーション
- 承認依頼作成時の承認者へのメール通知

### 対象
経理担当者、仕入担当者

### 関連
- 関連タスク：TASK-009
- 関連要件：SR-TASK-009-001`,
    status: "implemented",
    relatedTaskIds: ["TASK-009"],
    requirementIds: ["SR-TASK-009-001"],
    systemDesign: [
      {
        id: "SD-009-001",
        category: "ui",
        title: "支払依頼画面",
        description: "支払対象の仕入請求書の一覧表示。チェックボックスで支払対象を選択し、金額確認後、承認依頼を実行。",
        priority: "high"
      },
      {
        id: "SD-009-002",
        category: "database",
        title: "支払依頼テーブル",
        description: "依頼ID、依頼者、依頼日時、支払金額、承認ステータスを管理。",
        priority: "high"
      },
      {
        id: "SD-009-003",
        category: "logic",
        title: "金額バリデーション",
        description: "支払対象の合計金額と買掛残高を照合。不一致の場合はエラー表示。",
        priority: "medium"
      },
      {
        id: "SD-009-004",
        category: "api",
        title: "承認依頼通知",
        description: "支払依頼作成時、承認者へメール通知。承認画面へのリンクを含む。",
        priority: "medium"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ap",
        paths: [
          "apps/ap/src/payment/requestScreen.tsx",
        ],
        note: "支払依頼画面コンポーネント",
      },
    ],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "SRF-010",
    category: "screen",
    title: "支払承認画面",
    summary: `## 概要

支払依頼の一覧表示、承認・却下を行う画面

### 主な機能
- 承認待ち支払依頼の詳細表示（仕入請求書画像、支払金額含む）
- 支払金額に応じた承認権限管理（50万以上：部長承認、100万以上：本部長承認等）
- 承認/却下結果の依頼者へのメール通知

### 対象
承認権限者（部長、本部長等）

### 関連
- 関連タスク：TASK-010
- 関連要件：SR-TASK-010-001`,
    status: "testing",
    relatedTaskIds: ["TASK-010"],
    requirementIds: ["SR-TASK-010-001"],
    systemDesign: [
      {
        id: "SD-010-001",
        category: "ui",
        title: "支払承認画面",
        description: "承認待ちの支払依頼の一覧表示。依頼詳細、仕入請求書画像、支払金額を確認し、承認/却下を選択。",
        priority: "high"
      },
      {
        id: "SD-010-002",
        category: "database",
        title: "承認履歴テーブル",
        description: "承認ID、承認者、承認日時、承認結果、承認コメントを記録。",
        priority: "high"
      },
      {
        id: "SD-010-003",
        category: "logic",
        title: "承認権限管理",
        description: "支払金額に応じた承認権限を設定。50万以上は部長承認、100万以上は本部長承認等。",
        priority: "medium"
      },
      {
        id: "SD-010-004",
        category: "api",
        title: "承認結果通知",
        description: "承認/却下の結果を依頼者へメール通知。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ap",
        paths: [
          "apps/ap/src/payment/approvalScreen.tsx",
        ],
        note: "支払承認画面コンポーネント",
      },
    ],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-03-05T00:00:00Z",
  },
  {
    id: "SRF-011",
    category: "internal",
    title: "支払実行機能",
    summary: `## 概要

承認済みの支払データを銀行IFへ送信し、支払を実行する機能

### 主な機能
- 全銀フォーマットによる支払データ作成と銀行への送信
- 承認済み支払依頼の抽出と銀行IF連携の定時実行バッチ
- 銀行IFエラー時の再送キュー登録（最大3回リトライ）

### 対象
経理担当者、システム管理者

### 関連
- 関連タスク：TASK-011
- 関連要件：SR-TASK-011-001`,
    status: "implementing",
    relatedTaskIds: ["TASK-011"],
    requirementIds: ["SR-TASK-011-001"],
    systemDesign: [
      {
        id: "SD-011-001",
        category: "integration",
        title: "銀行IF連携（全銀プロトコル）",
        description: "全銀フォーマットで支払データを作成し、銀行へ送信。支払実行結果を取得。",
        priority: "high"
      },
      {
        id: "SD-011-002",
        category: "batch",
        title: "支払実行バッチ",
        description: "承認済みの支払依頼を抽出し、銀行IF連携を実行。定時実行。",
        priority: "high"
      },
      {
        id: "SD-011-003",
        category: "database",
        title: "支払実行テーブル",
        description: "支払ID、銀行コード、送信日時、実行ステータス、エラー内容を記録。",
        priority: "high"
      },
      {
        id: "SD-011-004",
        category: "error_handling",
        title: "エラー処理と再送",
        description: "銀行IFエラー時に再送キューに登録。最大3回リトライ。",
        priority: "medium"
      },
      {
        id: "SD-011-005",
        category: "ui",
        title: "支払実行結果画面",
        description: "支払実行結果の一覧表示。成功/失敗のステータス、エラー詳細を確認。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ap",
        paths: [
          "apps/ap/src/payment/executionService.ts",
        ],
        note: "支払実行サービス",
      },
    ],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-03-20T00:00:00Z",
  },
  {
    id: "SRF-012",
    category: "screen",
    title: "手形管理画面",
    summary: `## 概要

支払手形の発行、期日管理、支払処理を行う画面

### 主な機能
- 支払手形の一覧表示（期日順、金額順でソート）
- 手形の期日管理と期日到来時の通知
- 期日到来手形の抽出と銀行IF連携による支払実行バッチ

### 対象
経理担当者、財務担当者

### 関連
- 関連タスク：TASK-012
- 関連要件：SR-TASK-012-001, SR-TASK-012-002`,
    status: "not_implemented",
    relatedTaskIds: ["TASK-012"],
    requirementIds: ["SR-TASK-012-001", "SR-TASK-012-002"],
    systemDesign: [
      {
        id: "SD-012-001",
        category: "database",
        title: "手形マスタテーブル",
        description: "手形ID、手形番号、振出日、期日、金額、受取人/支払人を管理。",
        priority: "high"
      },
      {
        id: "SD-012-002",
        category: "ui",
        title: "手形管理画面",
        description: "支払手形の一覧表示。期日順、金額順でソート。手形発行、期日管理、支払処理を実行。",
        priority: "high"
      },
      {
        id: "SD-012-003",
        category: "logic",
        title: "期日管理機能",
        description: "手形の期日を管理し、期日到来時に通知。支払実行のトリガーとして活用。",
        priority: "medium"
      },
      {
        id: "SD-012-004",
        category: "batch",
        title: "手形支払実行バッチ",
        description: "期日到来の手形を抽出し、銀行IF連携で支払を実行。",
        priority: "medium"
      },
      {
        id: "SD-012-005",
        category: "database",
        title: "手形履歴テーブル",
        description: "手形の発行、裏書、割引、支払等の履歴を記録。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ap",
        paths: [
          "apps/ap/src/note/noteManagementScreen.tsx",
          "apps/ap/src/note/noteService.ts",
        ],
        note: "手形管理画面とビジネスロジック",
      },
    ],
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "SRF-013",
    category: "internal",
    title: "仕入請求書取込機能",
    summary: `## 概要

仕入先から受け取った請求書データを取り込み、買掛金へ計上する機能

### 主な機能
- OCR連携による請求書スキャン画像からの文字抽出・自動データ作成（オプション）
- 請求内容の手動入力画面（仕入先、請求番号、金額、消費税）
- 必須項目チェック、金額整合性チェック、仕入先マスタ存在チェック

### 対象
経理担当者、仕入担当者

### 関連
- 関連タスク：TASK-007
- 関連要件：SR-TASK-007-001`,
    status: "implemented",
    relatedTaskIds: ["TASK-007"],
    requirementIds: ["SR-TASK-007-001"],
    systemDesign: [
      {
        id: "SD-013-001",
        category: "integration",
        title: "OCR連携（オプション）",
        description: "仕入請求書のスキャン画像からOCRで文字を抽出し、請求データを自動作成。",
        priority: "medium"
      },
      {
        id: "SD-013-002",
        category: "ui",
        title: "手動入力画面",
        description: "OCR未使用の場合、手動で請求内容を入力する画面。仕入先、請求番号、金額、消費税を入力。",
        priority: "high"
      },
      {
        id: "SD-013-003",
        category: "database",
        title: "仕入請求書テーブル",
        description: "請求ID、仕入先ID、請求番号、請求日、金額、消費税、取込ステータスを管理。",
        priority: "high"
      },
      {
        id: "SD-013-004",
        category: "logic",
        title: "請求内容バリデーション",
        description: "必須項目チェック、金額の整合性チェック、仕入先マスタの存在チェック。",
        priority: "medium"
      },
      {
        id: "SD-013-005",
        category: "batch",
        title: "買掛計上連携",
        description: "取り込んだ請求書データを買掛金テーブルへ登録するバッチ処理。",
        priority: "high"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ap",
        paths: [
          "apps/ap/src/invoice/invoiceImportService.ts",
        ],
        note: "請求書インポートサービス",
      },
    ],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-02-15T00:00:00Z",
  },
  {
    id: "SRF-014",
    category: "screen",
    title: "買掛残高確認画面",
    summary: `## 概要

仕入先別の買掛残高を表示し、支払計画を策定する画面

### 主な機能
- 仕入先別の買掛残高一覧表示（支払予定日、金額、残高）
- 買掛残高と支払条件に基づく支払計画の立案
- 仕入先ごとの支払実績・支払傾向分析ダッシュボード

### 対象
経理担当者、財務担当者

### 関連
- 関連タスク：TASK-014
- 関連要件：SR-TASK-014-001`,
    status: "testing",
    relatedTaskIds: ["TASK-014"],
    requirementIds: ["SR-TASK-014-001"],
    systemDesign: [
      {
        id: "SD-014-001",
        category: "ui",
        title: "買掛残高一覧画面",
        description: "仕入先別の買掛残高一覧を表示。支払予定日、金額、残高を確認。",
        priority: "high"
      },
      {
        id: "SD-014-002",
        category: "database",
        title: "買掛残高ビュー",
        description: "仕入請求書テーブルと支払テーブルを結合し、買掛残高を算出するビュー。",
        priority: "high"
      },
      {
        id: "SD-014-003",
        category: "api",
        title: "支払計画立案API",
        description: "買掛残高と支払条件から支払計画を作成するAPI。支払予測に活用。",
        priority: "medium"
      },
      {
        id: "SD-014-004",
        category: "ui",
        title: "仕入先別分析",
        description: "仕入先ごとの支払実績、支払傾向を分析するダッシュボード。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ap",
        paths: [
          "apps/ap/src/apBalance/balanceScreen.tsx",
        ],
        note: "買掛残高画面コンポーネント",
      },
    ],
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-03-25T00:00:00Z",
  },
  {
    id: "SRF-015",
    category: "interface",
    title: "仕入先ポータルIF",
    summary: `## 概要

仕入先ポータルと連携し、請求書データを取得するインターフェース機能

### 主な機能
- 仕入先ポータルとのAPI連携（API KeyまたはOAuth認証）
- 定期的な請求書データの取得と自社システムとの同期バッチ
- APIエラー、データ不整合等の検知と管理者通知

### 対象
経理担当者、システム管理者

### 関連
- 関連タスク：TASK-013
- 関連要件：SR-TASK-013-002, SR-TASK-013-003`,
    status: "not_implemented",
    relatedTaskIds: ["TASK-013"],
    requirementIds: ["SR-TASK-013-002", "SR-TASK-013-003"],
    systemDesign: [
      {
        id: "SD-015-001",
        category: "integration",
        title: "仕入先ポータルAPIクライアント",
        description: "仕入先ポータルとAPI連携し、請求書データを取得。認証にはAPI KeyまたはOAuthを使用。",
        priority: "high"
      },
      {
        id: "SD-015-002",
        category: "api",
        title: "請求書データ取得API",
        description: "仕入先ポータルから請求書データを取得し、自社システムへ取り込むエンドポイント。",
        priority: "high"
      },
      {
        id: "SD-015-003",
        category: "logic",
        title: "認証・認可機能",
        description: "仕入先ポータルとの認証連携。API Keyの管理、トークンのリフレッシュ。",
        priority: "medium"
      },
      {
        id: "SD-015-004",
        category: "batch",
        title: "データ同期バッチ",
        description: "定期的に仕入先ポータルから請求書データを取得し、自社システムと同期。",
        priority: "medium"
      },
      {
        id: "SD-015-005",
        category: "error_handling",
        title: "同期エラー処理",
        description: "APIエラー、データ不整合等のエラーを検知し、管理者に通知。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ap",
        paths: [
          "apps/ap/src/portal/supplierPortalClient.ts",
          "apps/ap/src/portal/invoiceFetchService.ts",
        ],
        note: "仕入先ポータルAPIクライアント",
      },
    ],
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "SRF-016",
    category: "internal",
    title: "支払予定表作成機能",
    summary: `## 概要

買掛データから支払予定を自動作成する機能

### 主な機能
- 買掛データと支払条件（締日、支払日）に基づく支払予定日計算
- 月次バッチによる翌月支払予定の自動作成
- 自動作成された支払予定の手動調整（支払日変更、金額分割）

### 対象
経理担当者、財務担当者

### 関連
- 関連タスク：TASK-013
- 関連要件：SR-TASK-013-001`,
    status: "implementing",
    relatedTaskIds: ["TASK-013"],
    requirementIds: ["SR-TASK-013-001"],
    systemDesign: [
      {
        id: "SD-016-001",
        category: "logic",
        title: "支払予定計算ロジック",
        description: "買掛データと支払条件（締日、支払日）から支払予定日を計算。",
        priority: "high"
      },
      {
        id: "SD-016-002",
        category: "database",
        title: "支払予定テーブル",
        description: "支払予定ID、仕入先ID、支払予定日、金額、ステータスを管理。",
        priority: "high"
      },
      {
        id: "SD-016-003",
        category: "batch",
        title: "支払予定自動作成バッチ",
        description: "月次バッチで翌月の支払予定を自動作成。",
        priority: "high"
      },
      {
        id: "SD-016-004",
        category: "ui",
        title: "支払予定調整機能",
        description: "自動作成された支払予定を手動で調整する画面。支払日の変更、金額の分割。",
        priority: "medium"
      },
      {
        id: "SD-016-005",
        category: "database",
        title: "支払日ルール管理テーブル",
        description: "仕入先ごとの支払日ルール（毎月25日締め翌月末払い等）を管理。",
        priority: "medium"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/ap",
        paths: [
          "apps/ap/src/payment/paymentScheduleService.ts",
        ],
        note: "支払予定サービス",
      },
    ],
    createdAt: "2024-02-15T00:00:00Z",
    updatedAt: "2024-04-05T00:00:00Z",
  },
  // GL関連（8件）
  {
    id: "SRF-017",
    category: "screen",
    title: "手動仕訳入力画面",
    summary: `## 概要

手動で仕訳データを入力し、仕訳帳へ登録する機能

### 主な機能
- 日付、借方勘定科目、貸方勘定科目、金額、摘要の入力フォーム
- ツリービューまたはオートコンプリートによる勘定科目選択
- 借方合計と貸方合計のバリデーション（不一致の場合はエラー）
- 頻繁に使用する仕訳パターンのテンプレート保存と再利用

### 対象
経理担当者、会計担当者

### 関連
- 関連タスク：TASK-015
- 関連要件：SR-TASK-015-001`,
    status: "implemented",
    relatedTaskIds: ["TASK-015"],
    requirementIds: ["SR-TASK-015-001"],
    systemDesign: [
      {
        id: "SD-017-001",
        category: "ui",
        title: "仕訳入力フォーム",
        description: "日付、借方勘定科目、貸方勘定科目、金額、摘要を入力するフォーム。",
        priority: "high"
      },
      {
        id: "SD-017-002",
        category: "ui",
        title: "勘定科目選択UI",
        description: "ツリービューまたはオートコンプリートで勘定科目を選択。科目コードと科目名を表示。",
        priority: "high"
      },
      {
        id: "SD-017-003",
        category: "logic",
        title: "貸借バリデーション",
        description: "借方合計と貸方合計が一致することを確認。不一致の場合はエラー表示。",
        priority: "high"
      },
      {
        id: "SD-017-004",
        category: "database",
        title: "仕訳テンプレートテーブル",
        description: "頻繁に使用する仕訳パターンをテンプレートとして保存。再利用時に呼び出し。",
        priority: "medium"
      },
      {
        id: "SD-017-005",
        category: "ui",
        title: "仕訳テンプレート機能",
        description: "保存したテンプレートを一覧表示し、選択すると仕訳入力フォームに値をセット。",
        priority: "medium"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/gl",
        paths: [
          "apps/gl/src/journal/manualEntryScreen.tsx",
        ],
        note: "手動仕訳入力画面コンポーネント",
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "SRF-018",
    category: "internal",
    title: "仕訳転記機能",
    summary: `## 概要

各業務プロセスから自動生成される仕訳を転記する機能

### 主な機能
- 売上、買掛、決算等の各業務プロセスからの仕訳データ自動生成
- 業務イベントと仕訳パターンを紐づけるルールテーブル管理
- 生成された仕訳データの仕訳帳テーブルへの転記バッチ処理

### 対象
経理担当者、システム管理者

### 関連
- 関連タスク：TASK-016
- 関連要件：SR-TASK-016-001`,
    status: "implemented",
    relatedTaskIds: ["TASK-016"],
    requirementIds: ["SR-TASK-016-001"],
    systemDesign: [
      {
        id: "SD-018-001",
        category: "logic",
        title: "自動仕訳生成エンジン",
        description: "各業務プロセス（売上、買掛、決算等）から仕訳データを自動生成。",
        priority: "high"
      },
      {
        id: "SD-018-002",
        category: "database",
        title: "仕訳ルールテーブル",
        description: "業務イベントと仕訳パターンを紐づけるルールテーブル。",
        priority: "high"
      },
      {
        id: "SD-018-003",
        category: "batch",
        title: "転記バッチ",
        description: "生成された仕訳データを仕訳帳テーブルへ転記するバッチ処理。",
        priority: "high"
      },
      {
        id: "SD-018-004",
        category: "database",
        title: "転記ステータステーブル",
        description: "仕訳ID、転記ステータス（未転記/転記済/エラー）、エラー内容を管理。",
        priority: "medium"
      },
      {
        id: "SD-018-005",
        category: "error_handling",
        title: "エラー仕訳処理",
        description: "転記エラーが発生した仕訳をエラーテーブルに保存。再転記機能を提供。",
        priority: "medium"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/gl",
        paths: [
          "apps/gl/src/journal/journalPostingService.ts",
        ],
        note: "仕訳転記サービス",
      },
    ],
    createdAt: "2024-01-01T00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "SRF-019",
    category: "screen",
    title: "総勘定元帳画面",
    summary: `## 概要

勘定科目別の取引明細を表示する画面

### 主な機能
- 勘定科目選択と期間指定（会計期間、月次、日次）による取引明細表示
- 借方合計、貸方合計、残高の表示と仕訳詳細へのドリルダウン
- 総勘定元帳のPDF形式出力（監査、税務申告対応）

### 対象
経理担当者、会計監査人、税理士

### 関連
- 関連タスク：TASK-017
- 関連要件：SR-TASK-017-001`,
    status: "implemented",
    relatedTaskIds: ["TASK-017"],
    requirementIds: ["SR-TASK-017-001"],
    systemDesign: [
      {
        id: "SD-019-001",
        category: "database",
        title: "総勘定元帳データ構造",
        description: "仕訳テーブルと勘定科目マスタを結合し、勘定科目別の取引明細を生成。",
        priority: "high"
      },
      {
        id: "SD-019-002",
        category: "ui",
        title: "総勘定元帳画面",
        description: "勘定科目を選択し、期間を指定して取引明細を表示。",
        priority: "high"
      },
      {
        id: "SD-019-003",
        category: "ui",
        title: "勘定科目別明細表示",
        description: "借方合計、貸方合計、残高を表示。ドリルダウンで仕訳詳細を確認。",
        priority: "medium"
      },
      {
        id: "SD-019-004",
        category: "ui",
        title: "期間指定機能",
        description: "会計期間、月次、日次等で期間を指定してデータを抽出。",
        priority: "medium"
      },
      {
        id: "SD-019-005",
        category: "ui",
        title: "PDF出力",
        description: "総勘定元帳をPDF形式で出力。監査、税務申告に対応。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/gl",
        paths: [
          "apps/gl/src/ledger/generalLedgerScreen.tsx",
        ],
        note: "総勘定元帳画面コンポーネント",
      },
    ],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-02-15T00:00:00Z",
  },
  {
    id: "SRF-020",
    category: "screen",
    title: "試算表画面",
    summary: `## 概要

試算表を表示し、貸借整合を確認する画面

### 主な機能
- 総勘定元帳から勘定科目別の借方合計、貸方合計を集計
- 全勘定科目の借方合計と貸方合計の整合チェック
- 前期比、前月比による金額比較と増減率表示
- 試算表のExcel形式出力（経営分析活用）

### 対象
経理担当者、財務担当者、経営企画

### 関連
- 関連タスク：TASK-018
- 関連要件：SR-TASK-018-001`,
    status: "testing",
    relatedTaskIds: ["TASK-018"],
    requirementIds: ["SR-TASK-018-001"],
    systemDesign: [
      {
        id: "SD-020-001",
        category: "logic",
        title: "試算表生成ロジック",
        description: "総勘定元帳から勘定科目別の借方合計、貸方合計を集計。",
        priority: "high"
      },
      {
        id: "SD-020-002",
        category: "logic",
        title: "貸借整合チェック",
        description: "全勘定科目の借方合計と貸方合計が一致することを確認。",
        priority: "high"
      },
      {
        id: "SD-020-003",
        category: "ui",
        title: "試算表画面",
        description: "勘定科目コード、勘定科目名、借方金額、貸方金額を一覧表示。",
        priority: "high"
      },
      {
        id: "SD-020-004",
        category: "ui",
        title: "期比較機能",
        description: "前期比、前月比で金額を比較。増減率を表示。",
        priority: "medium"
      },
      {
        id: "SD-020-005",
        category: "ui",
        title: "Excel出力",
        description: "試算表をExcel形式で出力。経営分析に活用。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/gl",
        paths: [
          "apps/gl/src/trialBalance/trialBalanceScreen.tsx",
        ],
        note: "試算表画面コンポーネント",
      },
    ],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "SRF-021",
    category: "screen",
    title: "財務諸表画面",
    summary: `## 概要

貸借対照表（B/S）、損益計算書（P/L）を表示し、Excel出力を行う画面

### 主な機能
- 試算表データからのB/S、P/L生成（勘定科目の配賦ルール適用）
- セグメント別表示の可能な財務諸表表示
- 財務諸表のExcel形式出力（株主総会、銀行提出対応）

### 対象
経理担当者、財務担当者、経営層

### 関連
- 関連タスク：TASK-019
- 関連要件：SR-TASK-019-001`,
    status: "implementing",
    relatedTaskIds: ["TASK-019"],
    requirementIds: ["SR-TASK-019-001"],
    systemDesign: [
      {
        id: "SD-021-001",
        category: "database",
        title: "B/Sテンプレート設計",
        description: "貸借対照表の出力フォーマットを定義。資産、負債、純資産のセクション。",
        priority: "high"
      },
      {
        id: "SD-021-002",
        category: "database",
        title: "P/Lテンプレート設計",
        description: "損益計算書の出力フォーマットを定義。売上原価、販売費、営業利益等。",
        priority: "high"
      },
      {
        id: "SD-021-003",
        category: "logic",
        title: "財務諸表生成エンジン",
        description: "試算表データからB/S、P/Lを生成。勘定科目の配賦ルールを適用。",
        priority: "high"
      },
      {
        id: "SD-021-004",
        category: "ui",
        title: "財務諸表画面",
        description: "B/S、P/Lを表示。セグメント別の表示も可能。",
        priority: "medium"
      },
      {
        id: "SD-021-005",
        category: "ui",
        title: "Excel出力機能",
        description: "財務諸表をExcel形式で出力。株主総会、銀行提出に対応。",
        priority: "medium"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/gl",
        paths: [
          "apps/gl/src/financials/statementsScreen.tsx",
        ],
        note: "財務諸表画面コンポーネント",
      },
    ],
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-04-01T00:00:00Z",
  },
  {
    id: "SRF-022",
    category: "internal",
    title: "決算整理機能",
    summary: `## 概要

決算時に必要な整理仕訳を自動計上する機能

### 主な機能
- 減価償却、賞与引当等の決算整理仕訳ルール定義
- 固定資産マスタからの償却費計算と仕訳データ自動生成
- 決算整理仕訳転記後の試算表締め処理
- 次期への繰越残高計算と期首残高設定

### 対象
経理担当者、会計担当者

### 関連
- 関連タスク：TASK-020
- 関連要件：SR-TASK-020-001, SR-TASK-020-002, SR-TASK-020-003`,
    status: "not_implemented",
    relatedTaskIds: ["TASK-020"],
    requirementIds: ["SR-TASK-020-001", "SR-TASK-020-002", "SR-TASK-020-003"],
    systemDesign: [
      {
        id: "SD-022-001",
        category: "logic",
        title: "決算整理仕訳ルール",
        description: "決算時に必要な整理仕訳（減価償却、賞与引当等）のルールを定義。",
        priority: "high"
      },
      {
        id: "SD-022-002",
        category: "batch",
        title: "減価償却費自動計上",
        description: "固定資産マスタから償却費を計算し、仕訳データを自動生成。",
        priority: "high"
      },
      {
        id: "SD-022-003",
        category: "batch",
        title: "試算表締め処理",
        description: "決算整理仕訳転記後、試算表を締め処理。期中データと区別。",
        priority: "high"
      },
      {
        id: "SD-022-004",
        category: "batch",
        title: "繰越処理",
        description: "次期への繰越残高を計算し、次期の期首残高として設定。",
        priority: "medium"
      },
      {
        id: "SD-022-005",
        category: "ui",
        title: "決算整理画面",
        description: "決算整理仕訳の一覧表示。修正、削除を実行。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/gl",
        paths: [
          "apps/gl/src/closing/closingAdjustmentService.ts",
          "apps/gl/src/closing/adjustmentRulesEngine.ts",
        ],
        note: "決算整理仕訳自動生成エンジン",
      },
    ],
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "SRF-023",
    category: "internal",
    title: "固定資産償却機能",
    summary: `## 概要

固定資産の償却費を自動計算する機能

### 主な機能
- 固定資産マスタ管理（資産名、取得価額、耐用年数、償却方法）
- 定額法、定率法による償却費計算（取得日、償却開始日考慮）
- 各固定資産の償却スケジュール（耐用年数分）作成
- 月次バッチによる償却費計算と仕訳データ自動生成

### 対象
経理担当者、会計担当者

### 関連
- 関連タスク：TASK-021
- 関連要件：SR-TASK-021-001`,
    status: "testing",
    relatedTaskIds: ["TASK-021"],
    requirementIds: ["SR-TASK-021-001"],
    systemDesign: [
      {
        id: "SD-023-001",
        category: "database",
        title: "固定資産マスタ管理",
        description: "資産ID、資産名、取得価額、耐用年数、償却方法（定額法/定率法）を管理。",
        priority: "high"
      },
      {
        id: "SD-023-002",
        category: "logic",
        title: "償却計算エンジン",
        description: "定額法、定率法で償却費を計算。取得日、償却開始日を考慮。",
        priority: "high"
      },
      {
        id: "SD-023-003",
        category: "batch",
        title: "償却スケジュール作成",
        description: "各固定資産の償却スケジュール（耐用年数分）を作成。",
        priority: "medium"
      },
      {
        id: "SD-023-004",
        category: "batch",
        title: "償却費自動計上",
        description: "月次バッチで償却費を計算し、仕訳データを自動生成。",
        priority: "high"
      },
      {
        id: "SD-023-005",
        category: "ui",
        title: "固定資産一覧画面",
        description: "固定資産の一覧表示。取得価額、帳簿価額、償却累計額を確認。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/gl",
        paths: [
          "apps/gl/assets/depreciationService.ts",
        ],
        note: "減価償却サービス",
      },
    ],
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-20T00:00:00Z",
  },
  {
    id: "SRF-024",
    category: "screen",
    title: "税申告画面",
    summary: `## 概要

消費税、法人税の申告データを作成する画面

### 主な機能
- 総勘定元帳からの課税売上、免税売上、課税仕入集計による消費税申告データ作成
- 損益計算書からの所得金額計算による法人税申告データ作成
- 消費税、法人税申告データの表示・修正・調整
- 税務申告書のPDF形式出力（e-Tax連携準備）

### 対象
経理担当者、税務担当者、税理士

### 関連
- 関連タスク：TASK-022
- 関連要件：SR-TASK-022-001, SR-TASK-022-002`,
    status: "not_implemented",
    relatedTaskIds: ["TASK-022"],
    requirementIds: ["SR-TASK-022-001", "SR-TASK-022-002"],
    systemDesign: [
      {
        id: "SD-024-001",
        category: "logic",
        title: "消費税申告データ作成",
        description: "総勘定元帳から課税売上、免税売上、課税仕入を集計。消費税申告書データを作成。",
        priority: "high"
      },
      {
        id: "SD-024-002",
        category: "logic",
        title: "法人税申告データ作成",
        description: "損益計算書から所得金額を計算。法人税申告書データを作成。",
        priority: "high"
      },
      {
        id: "SD-024-003",
        category: "ui",
        title: "税申告画面",
        description: "消費税、法人税の申告データを表示。修正、調整を実行。",
        priority: "medium"
      },
      {
        id: "SD-024-004",
        category: "ui",
        title: "税務报表出力",
        description: "税務申告書をPDF形式で出力。e-Tax連携の準備。",
        priority: "medium"
      },
      {
        id: "SD-024-005",
        category: "integration",
        title: "e-Tax連携（将来対応）",
        description: "国税庁のe-TaxシステムとAPI連携。申告データの電子提出。",
        priority: "low"
      }
    ],
    codeRefs: [
      {
        githubUrl: "https://github.com/example/gl",
        paths: [
          "apps/gl/src/tax/taxFilingScreen.tsx",
          "apps/gl/src/tax/consumptionTaxReportService.ts",
          "apps/gl/src/tax/corporateTaxReportService.ts",
        ],
        note: "税申告画面と申告データ生成",
      },
    ],
    createdAt: "2024-03-15T00:00:00Z",
    updatedAt: "2024-03-15T00:00:00Z",
  },
];

export const getSystemFunctionById = (id: string): SystemFunction | undefined => {
  return systemFunctions.find(s => s.id === id);
};

export const getSystemFunctionsByStatus = (status: string): SystemFunction[] => {
  return systemFunctions.filter(s => s.status === status);
};

export const getSystemFunctionsByTaskId = (taskId: string): SystemFunction[] => {
  return systemFunctions.filter(s => s.relatedTaskIds.includes(taskId));
};

// 関連要件情報を取得
export const getRelatedRequirements = (srfId: string): RelatedRequirementInfo[] => {
  const srf = getSystemFunctionById(srfId);
  if (!srf) return [];

  // モックでは関連要件の紐付けデータを持たないため空配列を返す
  return [];
};

// 設計カテゴリのラベルを取得
export const getDesignCategoryLabel = (category: DesignItemCategory): string => {
  const labels: Record<DesignItemCategory, string> = {
    database: "データベース設計",
    api: "API設計",
    logic: "ビジネスロジック",
    ui: "UI/画面設計",
    integration: "外部連携",
    batch: "バッチ処理",
    error_handling: "エラーハンドリング",
  };
  return labels[category] || category;
};
