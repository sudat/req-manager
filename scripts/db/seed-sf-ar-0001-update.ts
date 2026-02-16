#!/usr/bin/env -S bun run
/**
 * SF-AR-0001 請求書発行機能のDD更新seed
 * 
 * Usage:
 *   bun scripts/db/seed-sf-ar-0001-update.ts --dry-run
 *   bun scripts/db/seed-sf-ar-0001-update.ts --execute
 */

import { createClient } from "@supabase/supabase-js";
import { structuredDesignDocumentSpecSchema } from "../../lib/domain/schemas/design-document-structured";

const PROJECT_ID = "00000000-0000-0000-0000-000000000001";

// DD-SF-AR-0001-001: 請求書発行画面（修正版）
const dd001Screen = {
  version: "1",
  ioType: "screen",
  typeDetail: {
    ioType: "screen" as const,
    route: "/system/AR/SF-AR-0001",
  },
  inputSchema: {
    trigger: "click" as const,
    action: "請求書発行画面の表示・操作",
    targetElement: "請求書発行画面全体",
    precondition: "ユーザーが請求管理権限を持つこと",
    elements: [
      {
        name: "customerSelector",
        type: "object" as const,
        label: "請求先顧客選択",
        required: true,
        description: "請求先顧客を検索・選択するコンポーネント",
      },
      {
        name: "billingPeriodInput",
        type: "string" as const,
        label: "請求対象期間",
        required: true,
        constraints: { pattern: "^\\d{4}-\\d{2}$" },
        description: "YYYY-MM形式で指定",
      },
      {
        name: "lineItemTable",
        type: "array" as const,
        label: "明細行一覧",
        required: true,
        description: "請求対象となる取引明細の一覧表示と選択",
      },
      {
        name: "dueDateInput",
        type: "string" as const,
        label: "支払期限日",
        required: false,
        constraints: { format: "date" as const },
        description: "未指定時は顧客マスタの設定値を使用",
      },
      {
        name: "previewButton",
        type: "string" as const,
        label: "プレビューボタン",
        required: false,
        description: "請求書プレビューを表示",
      },
      {
        name: "saveDraftButton",
        type: "string" as const,
        label: "下書き保存ボタン",
        required: false,
        description: "下書き保存APIを呼び出し",
      },
      {
        name: "issueButton",
        type: "string" as const,
        label: "発行ボタン",
        required: false,
        description: "請求書発行APIを呼び出し",
      },
    ],
    dataFields: [
      {
        name: "customerId",
        type: "string" as const,
        label: "請求先顧客ID",
        required: true,
        description: "選択された顧客のID",
      },
      {
        name: "billingPeriod",
        type: "string" as const,
        label: "請求対象期間",
        required: true,
        constraints: { pattern: "^\\d{4}-\\d{2}$" },
        description: "YYYY-MM形式",
      },
      {
        name: "selectedLineItems",
        type: "array" as const,
        label: "選択明細行IDリスト",
        required: true,
        constraints: { min: 1 },
        description: "発行対象として選択された明細行のIDリスト",
      },
      {
        name: "dueDate",
        type: "string" as const,
        label: "支払期限日",
        required: false,
        constraints: { format: "date" as const },
        description: "未指定時は顧客マスタの設定値",
      },
    ],
  },
  outputSchema: {
    transition: "/system/AR/SF-AR-0001",
    messages: [],
    behavior: "画面表示、入力検証、プレビュー表示、API呼び出し",
    displayChanges: "プレビュー表示、バリデーションエラー表示、API実行結果表示",
    dataFields: [
      {
        name: "previewData",
        type: "object" as const,
        label: "プレビューデータ",
        required: false,
        description: "請求書プレビュー表示用データ（ヘッダー・明細・税率別内訳）",
      },
      {
        name: "validationErrors",
        type: "array" as const,
        label: "バリデーションエラー",
        required: false,
        description: "入力値検証エラーのリスト",
      },
    ],
  },
  coreLogic: {
    rules: [
      {
        type: "validate" as const,
        name: "input_validation",
        description: "入力値の形式チェック（期間形式YYYY-MM、日付形式、必須項目）",
        preconditions: ["billingPeriodがYYYY-MM形式", "dueDateがdate形式または未指定"],
      },
      {
        type: "validate" as const,
        name: "line_item_selection",
        description: "明細行が1件以上選択されているかチェック",
        preconditions: ["selectedLineItems.length >= 1"],
      },
      {
        type: "derive" as const,
        name: "preview_calculation",
        description: "プレビュー表示用の計算（小計、税率別税額、合計）",
      },
    ],
  },
  sideEffects: {
    description: "下書き保存API、請求書発行APIを呼び出し",
    externalApiCalls: [
      {
        endpoint: "/api/invoices/draft",
        method: "POST" as const,
        payload: [
          {
            name: "customerId",
            type: "string" as const,
            label: "請求先顧客ID",
            required: true,
            description: "請求先顧客のID",
          },
          {
            name: "billingPeriod",
            type: "string" as const,
            label: "請求対象期間",
            required: true,
            description: "YYYY-MM形式",
          },
          {
            name: "selectedLineItems",
            type: "array" as const,
            label: "選択明細行IDリスト",
            required: true,
            description: "発行対象の明細行IDリスト",
          },
          {
            name: "dueDate",
            type: "string" as const,
            label: "支払期限日",
            required: false,
            description: "YYYY-MM-DD形式（未指定時は顧客マスタの設定値）",
          },
        ],
      },
      {
        endpoint: "/api/invoices/issue",
        method: "POST" as const,
        payload: [
          {
            name: "draftInvoiceId",
            type: "string" as const,
            label: "下書き請求書ID",
            required: true,
            description: "下書き保存済みの請求書ID",
          },
          {
            name: "issueDate",
            type: "string" as const,
            label: "発行日",
            required: false,
            description: "YYYY-MM-DD形式（未指定時は当日）",
          },
        ],
      },
    ],
  },
  exceptions: [
    {
      name: "invalid_period_format",
      type: "validation",
      condition: "請求対象期間の形式がYYYY-MM以外の場合",
      description: "請求対象期間の形式がYYYY-MM以外の場合",
      httpStatus: 400,
      errorCode: "INVALID_PERIOD_FORMAT",
      message: "請求対象期間はYYYY-MM形式で指定してください",
      recovery: "none",
      userNotification: "inline",
      logging: "structured",
    },
    {
      name: "no_line_items_selected",
      type: "validation",
      condition: "明細行が選択されていない場合",
      description: "明細行が選択されていない場合",
      httpStatus: 400,
      errorCode: "NO_LINE_ITEMS_SELECTED",
      message: "1件以上の明細行を選択してください",
      recovery: "none",
      userNotification: "inline",
      logging: "structured",
    },
  ],
  nonFunctional: {},
};

// DD-SF-AR-0001-002: 請求書発行API（修正版）
const dd002Api = {
  version: "1",
  ioType: "api",
  typeDetail: {
    ioType: "api" as const,
    method: "POST" as const,
    path: "/api/invoices/issue",
  },
  inputSchema: {
    method: "POST" as const,
    path: "/api/invoices/issue",
    body: [
      {
        name: "draftInvoiceId",
        type: "string" as const,
        label: "下書き請求書ID",
        required: true,
        description: "下書き保存済みの請求書ID",
      },
      {
        name: "issueDate",
        type: "string" as const,
        label: "発行日",
        required: false,
        constraints: { format: "date" as const },
        description: "発行日（未指定時は当日）",
      },
    ],
    dataFields: [
      {
        name: "draftInvoiceId",
        type: "string" as const,
        label: "下書き請求書ID",
        required: true,
        description: "下書き保存済みの請求書ID",
      },
      {
        name: "issueDate",
        type: "string" as const,
        label: "発行日",
        required: false,
        description: "YYYY-MM-DD形式（未指定時は当日）",
      },
    ],
  },
  outputSchema: {
    success: {
      status: 200,
      fields: [
        {
          name: "invoiceId",
          type: "string" as const,
          label: "請求書ID",
          required: true,
          description: "発行された請求書のID",
        },
        {
          name: "invoiceNumber",
          type: "string" as const,
          label: "請求書番号",
          required: true,
          description: "INV-YYYYMM-連番形式",
        },
        {
          name: "totalAmount",
          type: "number" as const,
          label: "請求金額合計",
          required: true,
          description: "税込合計金額",
        },
        {
          name: "pdfUrl",
          type: "string" as const,
          label: "PDFダウンロードURL",
          required: true,
          description: "生成されたPDFのダウンロードURL（非同期生成完了後）",
        },
      ],
    },
    error: [
      {
        status: 404,
        description: "下書き請求書が存在しない",
        fields: [
          {
            name: "error",
            type: "string" as const,
            label: "エラー",
            required: true,
            description: "DRAFT_NOT_FOUND",
          },
        ],
      },
      {
        status: 409,
        description: "既に発行済み",
        fields: [
          {
            name: "error",
            type: "string" as const,
            label: "エラー",
            required: true,
            description: "ALREADY_ISSUED",
          },
        ],
      },
      {
        status: 422,
        description: "顧客情報不足",
        fields: [
          {
            name: "error",
            type: "string" as const,
            label: "エラー",
            required: true,
            description: "CUSTOMER_INFO_INCOMPLETE",
          },
          {
            name: "missingFields",
            type: "array" as const,
            label: "不足項目",
            required: true,
            description: "不足している顧客情報のリスト",
          },
        ],
      },
    ],
    dataFields: [
      {
        name: "invoiceId",
        type: "string" as const,
        label: "請求書ID",
        required: true,
        description: "発行された請求書のID",
      },
      {
        name: "invoiceNumber",
        type: "string" as const,
        label: "請求書番号",
        required: true,
        description: "INV-YYYYMM-連番形式",
      },
      {
        name: "totalAmount",
        type: "number" as const,
        label: "請求金額合計",
        required: true,
        description: "税込合計金額",
      },
      {
        name: "pdfUrl",
        type: "string" as const,
        label: "PDFダウンロードURL",
        required: true,
        description: "生成されたPDFのダウンロードURL",
      },
    ],
  },
  coreLogic: {
    rules: [
      {
        type: "validate" as const,
        name: "draft_exists",
        description: "下書き請求書の存在チェック",
        preconditions: ["draftInvoiceIdに該当する下書きが存在すること"],
      },
      {
        type: "validate" as const,
        name: "customer_info_complete",
        description: "顧客情報の必須項目チェック（AC-SR-TASK-003-001-003対応）",
        preconditions: ["顧客名", "住所", "登録番号（適格請求書の場合）"],
      },
      {
        type: "validate" as const,
        name: "not_already_issued",
        description: "未発行状態チェック",
        preconditions: ["statusが'draft'であること"],
      },
      {
        type: "derive" as const,
        name: "invoice_number_generate",
        description: "請求書番号を自動採番（INV-YYYYMM-連番4桁）",
        formulas: ["INV-{YYYYMM}-{seq:0001}"],
      },
      {
        type: "derive" as const,
        name: "tax_calculation",
        description: "税率別（10%/8%）に消費税額を計算。端数は1円単位切り捨て",
        formulas: ["tax = floor(amount * rate)"],
        preconditions: ["amount, rateは明細データより取得"],
      },
      {
        type: "derive" as const,
        name: "total_amount",
        description: "小計＋消費税で請求合計を算出",
        formulas: ["小計＋消費税 = 請求合計"],
      },
      {
        type: "decide" as const,
        name: "pdf_queue",
        description: "PDF生成ジョブをキューに登録。非同期処理で生成",
      },
      {
        type: "decide" as const,
        name: "status_transition",
        description: "ステータスを'draft'から'issued'に変更すべきか判定",
      },
    ],
  },
  sideEffects: {
    description: "請求書データの確定、PDF生成キューイング、イベント発行、メール送信",
    dbOperations: [
      {
        table: "invoices",
        operation: "update",
        affectedColumns: ["status", "invoice_number", "issue_date", "total_amount", "updated_at"],
        condition: "id = ${draftInvoiceId}",
      },
      {
        table: "invoice_line_items",
        operation: "update",
        affectedColumns: ["tax_amount", "total_amount"],
        condition: "invoice_id = ${draftInvoiceId}",
      },
    ],
    externalApiCalls: [
      {
        endpoint: "/jobs/pdf-generate",
        method: "POST" as const,
        payload: [
          {
            name: "invoiceId",
            type: "string" as const,
            label: "請求書ID",
            required: true,
            description: "PDF生成対象の請求書ID",
          },
        ],
      },
    ],
    events: [
      {
        eventType: "invoice.issued",
        payload: [
          {
            name: "invoiceId",
            type: "string" as const,
            label: "請求書ID",
            required: true,
            description: "発行された請求書ID",
          },
          {
            name: "customerId",
            type: "string" as const,
            label: "顧客ID",
            required: true,
            description: "請求先顧客ID",
          },
        ],
        destination: "queue" as const,
      },
    ],
  },
  exceptions: [
    {
      name: "draft_not_found",
      type: "state",
      condition: "指定された下書き請求書が存在しない",
      description: "指定された下書き請求書が存在しない",
      httpStatus: 404,
      errorCode: "DRAFT_NOT_FOUND",
      message: "指定された下書き請求書が見つかりません",
      recovery: "none",
      userNotification: "inline",
      logging: "structured",
    },
    {
      name: "already_issued",
      type: "conflict",
      condition: "既に発行済みの請求書",
      description: "既に発行済みの請求書",
      httpStatus: 409,
      errorCode: "ALREADY_ISSUED",
      message: "この請求書は既に発行されています",
      recovery: "none",
      userNotification: "inline",
      logging: "structured",
    },
    {
      name: "customer_info_incomplete",
      type: "validation",
      condition: "顧客情報が不足している（AC-SR-TASK-003-001-003対応）",
      description: "顧客情報が不足している（AC-SR-TASK-003-001-003対応）",
      httpStatus: 422,
      errorCode: "CUSTOMER_INFO_INCOMPLETE",
      message: "顧客情報が不足しています。顧客マスタを確認してください",
      recovery: "none",
      userNotification: "inline",
      logging: "structured",
    },
  ],
  nonFunctional: {
    performance: "PDF生成は非同期で行い、APIレスポンスは即時返却",
    availability: "PDF生成サービス障害時はキューに残し、復旧後に再処理",
  },
};

// DD-SF-AR-0001-003: 請求書一括発行バッチ（修正版）
const dd003Batch = {
  version: "1",
  ioType: "batch",
  typeDetail: {
    ioType: "batch" as const,
    schedule: "0 2 1 * *",
    source: "transactions（未請求取引テーブル）",
  },
  inputSchema: {
    schedule: "0 2 1 * *",
    source: "transactions（未請求取引テーブル）",
    parameters: [
      {
        name: "targetMonth",
        type: "string" as const,
        label: "対象年月",
        required: true,
        constraints: { pattern: "^\\d{4}-\\d{2}$" },
        description: "YYYY-MM形式",
      },
      {
        name: "chunkSize",
        type: "number" as const,
        label: "チャンクサイズ",
        required: false,
        constraints: { min: 10, max: 500, default: 100 },
        description: "一度に処理する件数（デフォルト100件）",
      },
    ],
    dataFields: [
      {
        name: "targetMonth",
        type: "string" as const,
        label: "対象年月",
        required: true,
        description: "YYYY-MM形式",
      },
      {
        name: "chunkSize",
        type: "number" as const,
        label: "チャンクサイズ",
        required: false,
        description: "処理単位（件数）",
      },
    ],
  },
  outputSchema: {
    summary: {
      processedCount: 0,
      successCount: 0,
      errorCount: 0,
      status: "completed" as const,
    },
    nextBatch: "次回実行: 翌月1日 02:00",
    dataFields: [
      {
        name: "processedCount",
        type: "number" as const,
        label: "処理件数",
        required: true,
        description: "処理対象となった請求書件数",
      },
      {
        name: "successCount",
        type: "number" as const,
        label: "成功件数",
        required: true,
        description: "正常に発行された請求書件数",
      },
      {
        name: "errorCount",
        type: "number" as const,
        label: "エラー件数",
        required: true,
        description: "エラーとなった件数",
      },
      {
        name: "logFilePath",
        type: "string" as const,
        label: "ログファイルパス",
        required: true,
        description: "処理ログの出力先パス",
      },
    ],
  },
  coreLogic: {
    rules: [
      {
        type: "decide" as const,
        name: "monthly_extraction",
        description: "対象月の未請求取引を顧客単位で抽出",
        preconditions: ["transactions.status = 'unbilled'", "transaction_date <= 対象月末"],
      },
      {
        type: "derive" as const,
        name: "chunking",
        description: "処理対象をチャンクサイズ単位に分割し、並列処理",
        preconditions: ["chunkSizeは10〜500の範囲"],
      },
      {
        type: "decide" as const,
        name: "batch_issue",
        description: "各チャンク内で請求書を一括発行",
      },
      {
        type: "decide" as const,
        name: "error_handling",
        description: "エラー発生時はログ出力し、後続処理を継続",
      },
    ],
  },
  sideEffects: {
    description: "請求書データの一括作成、PDF生成キューイング、ログファイル出力、通知イベント発行",
    dbOperations: [
      {
        table: "invoices",
        operation: "insert",
        affectedColumns: ["customer_id", "invoice_number", "issue_date", "total_amount", "status"],
      },
      {
        table: "invoice_line_items",
        operation: "insert",
        affectedColumns: ["invoice_id", "item_name", "quantity", "unit_price", "tax_rate", "tax_amount"],
      },
      {
        table: "batch_logs",
        operation: "insert",
        affectedColumns: ["batch_name", "target_month", "processed_count", "success_count", "error_count", "executed_at"],
      },
    ],
    fileOutputs: [
      {
        path: "/logs/invoice-batch-${timestamp}.log",
        format: "txt" as const,
      },
    ],
    events: [
      {
        eventType: "invoice.batch.completed",
        payload: [
          {
            name: "targetMonth",
            type: "string" as const,
            label: "対象年月",
            required: true,
            description: "処理対象年月",
          },
          {
            name: "processedCount",
            type: "number" as const,
            label: "処理件数",
            required: true,
            description: "処理した請求書件数",
          },
          {
            name: "successCount",
            type: "number" as const,
            label: "成功件数",
            required: true,
            description: "成功した件数",
          },
        ],
        destination: "queue" as const,
      },
    ],
  },
  exceptions: [
    {
      name: "no_unbilled_transactions",
      type: "state",
      condition: "対象月の未請求取引が存在しない",
      description: "対象月の未請求取引が存在しない",
      httpStatus: 200,
      errorCode: "NO_UNBILLED_TRANSACTIONS",
      message: "対象月の未請求取引はありませんでした",
      recovery: "none",
      userNotification: "none",
      logging: "structured",
    },
    {
      name: "pdf_generation_failed",
      type: "external",
      condition: "一部のPDF生成に失敗",
      description: "一部のPDF生成に失敗",
      httpStatus: 500,
      errorCode: "PDF_GENERATION_FAILED",
      message: "一部の請求書PDF生成に失敗しました。ログを確認してください",
      recovery: "manual_intervention",
      userNotification: "toast",
      logging: "structured",
    },
  ],
  nonFunctional: {
    performance: "チャンク単位で並列処理し、大量データでも一定時間で完了",
    availability: "エラーが発生しても後続処理を継続し、全体の成功率を最大化",
  },
};

// DD-SF-AR-0001-004: 請求書データモデル（現状維持・軽微修正）
const dd004Model = {
  version: "1",
  ioType: "model",
  typeDetail: {
    ioType: "model" as const,
    entityName: "Invoice",
    entityLogicalName: "請求書",
    entityDescription: "発行済の請求書ヘッダー情報を管理。適格請求書要件を満たす項目構成",
    attributes: [
      { name: "id", type: "UUID" as const, nullable: false, primaryKey: true, description: "請求書を一意に識別するID" },
      { name: "customerId", type: "UUID" as const, nullable: false, foreignKey: true, description: "請求先顧客ID" },
      { name: "invoiceNumber", type: "string" as const, unique: true, nullable: false, constraints: "pattern:^INV-\\d{6}-\\d{4}$", description: "請求書番号（INV-YYYYMM-連番）" },
      { name: "issueDate", type: "date" as const, nullable: false, description: "発行日" },
      { name: "dueDate", type: "date" as const, nullable: false, description: "支払期限日" },
      { name: "subtotal", type: "number" as const, nullable: false, description: "小計金額（税抜）" },
      { name: "taxAmount10", type: "number" as const, nullable: false, description: "10%消費税額" },
      { name: "taxAmount8", type: "number" as const, nullable: false, description: "8%消費税額" },
      { name: "totalAmount", type: "number" as const, nullable: false, description: "合計金額（税込）" },
      { name: "status", type: "enum" as const, nullable: false, enumValues: ["draft", "issued", "sent", "paid"], description: "ステータス" },
      { name: "registrationNumber", type: "string" as const, nullable: true, description: "適格請求書発行事業者の登録番号（T+13桁）" },
      { name: "createdAt", type: "datetime" as const, nullable: false, description: "作成日時" },
      { name: "updatedAt", type: "datetime" as const, nullable: false, description: "更新日時" },
    ],
    relationships: [
      { type: "N:1", target: "Customer", description: "請求先顧客", columnMappings: [{ source: "customerId", target: "id" }] },
      { type: "1:N", target: "InvoiceLineItem", description: "請求明細", columnMappings: [{ source: "id", target: "invoiceId" }] },
    ],
    stateTransitions: [
      { from: "draft", to: ["issued"] },
      { from: "issued", to: ["sent", "paid"] },
      { from: "sent", to: ["paid"] },
    ],
  },
  sideEffects: {
    description: "副作用なし（データモデルの定義のみ）",
  },
  coreLogic: { rules: [] },
  exceptions: [],
  nonFunctional: {},
};

// DD-SF-AR-0001-005: メール送信I/F（修正版）
const dd005ExternalIf = {
  version: "1",
  ioType: "external_if",
  typeDetail: {
    ioType: "external_if" as const,
    protocol: "HTTPS",
    endpoint: "https://api.sendgrid.com/v3",
  },
  inputSchema: {
    method: "POST" as const,
    path: "/mail/send",
    body: [
      {
        name: "invoiceId",
        type: "string" as const,
        label: "請求書ID",
        required: true,
        description: "送信対象の請求書ID",
      },
      {
        name: "to",
        type: "string" as const,
        label: "宛先メールアドレス",
        required: true,
        constraints: { format: "email" as const },
        description: "送信先メールアドレス",
      },
      {
        name: "pdfUrl",
        type: "string" as const,
        label: "PDF URL",
        required: true,
        description: "添付するPDFのURL",
      },
    ],
    dataFields: [
      {
        name: "invoiceId",
        type: "string" as const,
        label: "請求書ID",
        required: true,
        description: "送信対象の請求書ID",
      },
      {
        name: "to",
        type: "string" as const,
        label: "宛先メールアドレス",
        required: true,
        description: "送信先メールアドレス",
      },
      {
        name: "pdfUrl",
        type: "string" as const,
        label: "PDF URL",
        required: true,
        description: "添付するPDFのURL",
      },
    ],
  },
  outputSchema: {
    success: {
      status: 202,
      fields: [
        {
          name: "messageId",
          type: "string" as const,
          label: "メッセージID",
          required: true,
          description: "SendGrid/SESから返却されたメッセージID",
        },
        {
          name: "status",
          type: "string" as const,
          label: "送信ステータス",
          required: true,
          description: "accepted / queued",
        },
      ],
    },
    error: [
      {
        status: 400,
        description: "不正なリクエスト",
        fields: [{ name: "error", type: "string" as const, label: "エラー", required: true, description: "INVALID_REQUEST" }],
      },
      {
        status: 401,
        description: "認証失敗",
        fields: [{ name: "error", type: "string" as const, label: "エラー", required: true, description: "AUTHENTICATION_FAILED" }],
      },
      {
        status: 429,
        description: "レート制限",
        fields: [{ name: "error", type: "string" as const, label: "エラー", required: true, description: "RATE_LIMIT_EXCEEDED" }],
      },
    ],
    dataFields: [
      {
        name: "messageId",
        type: "string" as const,
        label: "メッセージID",
        required: true,
        description: "SendGrid/SESから返却されたメッセージID",
      },
      {
        name: "status",
        type: "string" as const,
        label: "送信ステータス",
        required: true,
        description: "accepted / queued / bounced / delivered / opened",
      },
      {
        name: "sentAt",
        type: "string" as const,
        label: "送信日時",
        required: true,
        description: "ISO 8601形式",
      },
    ],
  },
  coreLogic: {
    rules: [
      {
        type: "decide" as const,
        name: "email_queue",
        description: "送信ジョブをキューに登録",
      },
      {
        type: "decide" as const,
        name: "send_retry",
        description: "送信失敗時に指数バックオフで再試行（最大3回）",
        preconditions: ["retryCount < 3"],
      },
      {
        type: "decide" as const,
        name: "provider_selection",
        description: "SendGrid優先、失敗時はSESフォールバック",
      },
    ],
  },
  sideEffects: {
    description: "外部メールサービス（SendGrid/SES）へのAPI呼び出し、送信ログ記録",
    dbOperations: [
      {
        table: "email_send_logs",
        operation: "insert",
        affectedColumns: ["invoice_id", "to_address", "message_id", "status", "provider", "sent_at", "error_message"],
      },
    ],
    externalApiCalls: [
      {
        endpoint: "https://api.sendgrid.com/v3/mail/send",
        method: "POST" as const,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        payload: [
          { name: "personalizations", type: "array" as const, label: "パーソナライゼーション", required: true },
          { name: "from", type: "object" as const, label: "送信元", required: true },
          { name: "subject", type: "string" as const, label: "件名", required: true },
          { name: "content", type: "array" as const, label: "本文", required: true },
          { name: "attachments", type: "array" as const, label: "添付ファイル", required: true },
        ],
      },
      {
        endpoint: "https://email.us-east-1.amazonaws.com",
        method: "POST" as const,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        payload: [
          { name: "Source", type: "string" as const, label: "送信元", required: true },
          { name: "Destination", type: "object" as const, label: "宛先", required: true },
          { name: "Message", type: "object" as const, label: "メッセージ", required: true },
        ],
      },
    ],
  },
  exceptions: [
    {
      name: "authentication_failed",
      type: "external",
      condition: "APIキー認証失敗",
      description: "APIキー認証失敗",
      httpStatus: 401,
      errorCode: "AUTHENTICATION_FAILED",
      message: "メールサービスの認証に失敗しました",
      recovery: "manual_intervention",
      userNotification: "modal",
      logging: "error",
    },
    {
      name: "rate_limit_exceeded",
      type: "external",
      condition: "送信レート制限超過",
      description: "送信レート制限超過",
      httpStatus: 429,
      errorCode: "RATE_LIMIT_EXCEEDED",
      message: "送信レート制限を超えました。しばらく待ってから再試行してください",
      recovery: "retry_with_backoff",
      userNotification: "toast",
      logging: "structured",
    },
    {
      name: "bounced_email",
      type: "external",
      condition: "メールバウンス（宛先不明等）",
      description: "メールバウンス（宛先不明等）",
      httpStatus: 200,
      errorCode: "BOUNCED_EMAIL",
      message: "メールが拒否されました。宛先アドレスを確認してください",
      recovery: "manual_intervention",
      userNotification: "toast",
      logging: "audit",
    },
  ],
  nonFunctional: {
    performance: "非同期で送信処理を行い、即時レスポンスを返却",
    availability: "SendGrid障害時はSESにフォールバックし、冗長性を確保",
  },
};

// DD-SF-AR-0001-006: 請求書下書き保存API（新規追加）
const dd006DraftApi = {
  version: "1",
  ioType: "api",
  typeDetail: {
    ioType: "api" as const,
    method: "POST" as const,
    path: "/api/invoices/draft",
  },
  inputSchema: {
    method: "POST" as const,
    path: "/api/invoices/draft",
    body: [
      {
        name: "customerId",
        type: "string" as const,
        label: "請求先顧客ID",
        required: true,
        description: "請求先顧客のID",
      },
      {
        name: "billingPeriod",
        type: "string" as const,
        label: "請求対象期間",
        required: true,
        constraints: { pattern: "^\\d{4}-\\d{2}$" },
        description: "YYYY-MM形式",
      },
      {
        name: "selectedLineItems",
        type: "array" as const,
        label: "選択明細行IDリスト",
        required: true,
        description: "発行対象の明細行IDリスト",
      },
      {
        name: "dueDate",
        type: "string" as const,
        label: "支払期限日",
        required: false,
        constraints: { format: "date" as const },
        description: "未指定時は顧客マスタの設定値",
      },
      {
        name: "existingDraftId",
        type: "string" as const,
        label: "既存下書きID",
        required: false,
        description: "更新する場合の既存下書きID（新規作成時は省略）",
      },
    ],
    dataFields: [
      {
        name: "customerId",
        type: "string" as const,
        label: "請求先顧客ID",
        required: true,
        description: "請求先顧客のID",
      },
      {
        name: "billingPeriod",
        type: "string" as const,
        label: "請求対象期間",
        required: true,
        description: "YYYY-MM形式",
      },
      {
        name: "selectedLineItems",
        type: "array" as const,
        label: "選択明細行IDリスト",
        required: true,
        description: "発行対象の明細行IDリスト",
      },
      {
        name: "dueDate",
        type: "string" as const,
        label: "支払期限日",
        required: false,
        description: "YYYY-MM-DD形式",
      },
      {
        name: "existingDraftId",
        type: "string" as const,
        label: "既存下書きID",
        required: false,
        description: "更新対象の下書きID（省略時は新規作成）",
      },
    ],
  },
  outputSchema: {
    success: {
      status: 200,
      fields: [
        {
          name: "draftInvoiceId",
          type: "string" as const,
          label: "下書き請求書ID",
          required: true,
          description: "作成・更新された下書き請求書のID",
        },
        {
          name: "previewData",
          type: "object" as const,
          label: "プレビューデータ",
          required: true,
          description: "計算済みの請求書プレビューデータ",
        },
        {
          name: "savedAt",
          type: "string" as const,
          label: "保存日時",
          required: true,
          description: "ISO 8601形式",
        },
      ],
    },
    error: [
      {
        status: 404,
        description: "指定された顧客または明細行が存在しない",
        fields: [{ name: "error", type: "string" as const, label: "エラー", required: true, description: "NOT_FOUND" }],
      },
      {
        status: 409,
        description: "既に発行済みの下書きを更新しようとした",
        fields: [{ name: "error", type: "string" as const, label: "エラー", required: true, description: "ALREADY_ISSUED" }],
      },
    ],
    dataFields: [
      {
        name: "draftInvoiceId",
        type: "string" as const,
        label: "下書き請求書ID",
        required: true,
        description: "作成・更新された下書き請求書のID",
      },
      {
        name: "previewData",
        type: "object" as const,
        label: "プレビューデータ",
        required: true,
        description: "計算済みの請求書プレビューデータ（ヘッダー・明細・税率別内訳）",
      },
      {
        name: "savedAt",
        type: "string" as const,
        label: "保存日時",
        required: true,
        description: "保存された日時",
      },
    ],
  },
  coreLogic: {
    rules: [
      {
        type: "validate" as const,
        name: "customer_exists",
        description: "請求先顧客の存在チェック",
        preconditions: ["customerIdに該当する顧客が存在すること"],
      },
      {
        type: "validate" as const,
        name: "line_items_exist",
        description: "明細行の存在チェック",
        preconditions: ["selectedLineItemsの全IDが有効であること"],
      },
      {
        type: "validate" as const,
        name: "not_already_issued",
        description: "既存下書きの場合、未発行状態チェック",
        preconditions: ["existingDraftIdが指定されている場合、status='draft'であること"],
      },
      {
        type: "derive" as const,
        name: "tax_calculation",
        description: "税率別に消費税額を計算（端数切り捨て）",
        formulas: ["tax = floor(amount * rate)"],
      },
      {
        type: "derive" as const,
        name: "total_calculation",
        description: "小計・税額・合計を計算",
        formulas: ["小計＋消費税 = 合計"],
      },
      {
        type: "decide" as const,
        name: "upsert_operation",
        description: "新規作成または更新の判定",
        preconditions: ["existingDraftIdが指定されていれば更新、なければ新規作成"],
      },
    ],
  },
  sideEffects: {
    description: "下書き請求書データの作成または更新",
    dbOperations: [
      {
        table: "invoices",
        operation: "upsert",
        affectedColumns: ["customer_id", "billing_period", "due_date", "subtotal", "tax_amount_10", "tax_amount_8", "total_amount", "status", "updated_at"],
        condition: "id = ${existingDraftId} OR new record",
      },
      {
        table: "invoice_line_items",
        operation: "upsert",
        affectedColumns: ["invoice_id", "transaction_id", "item_name", "quantity", "unit_price", "tax_rate", "tax_amount", "line_total"],
        condition: "invoice_id = ${draftInvoiceId}",
      },
    ],
  },
  exceptions: [
    {
      name: "customer_not_found",
      type: "state",
      condition: "指定された顧客が存在しない",
      description: "指定された顧客が存在しない",
      httpStatus: 404,
      errorCode: "CUSTOMER_NOT_FOUND",
      message: "指定された請求先顧客が見つかりません",
      recovery: "none",
      userNotification: "inline",
      logging: "structured",
    },
    {
      name: "line_item_not_found",
      type: "state",
      condition: "指定された明細行が存在しない",
      description: "指定された明細行が存在しない",
      httpStatus: 404,
      errorCode: "LINE_ITEM_NOT_FOUND",
      message: "指定された明細行が見つかりません",
      recovery: "none",
      userNotification: "inline",
      logging: "structured",
    },
    {
      name: "already_issued",
      type: "conflict",
      condition: "既に発行済みの下書きを更新しようとした",
      description: "既に発行済みの下書きを更新しようとした",
      httpStatus: 409,
      errorCode: "ALREADY_ISSUED",
      message: "この下書きは既に発行されているため更新できません",
      recovery: "none",
      userNotification: "inline",
      logging: "structured",
    },
  ],
  nonFunctional: {
    performance: "プレビュー計算は同期的に行い、即時レスポンス",
    availability: "DB接続エラー時はエラーレスポンスを返却",
  },
};

// DD更新対象リスト
const ddUpdates = [
  { id: "DD-SF-AR-0001-001", name: "請求書発行画面", data: dd001Screen },
  { id: "DD-SF-AR-0001-002", name: "請求書発行API", data: dd002Api },
  { id: "DD-SF-AR-0001-003", name: "請求書一括発行バッチ", data: dd003Batch },
  { id: "DD-SF-AR-0001-004", name: "請求書データモデル", data: dd004Model },
  { id: "DD-SF-AR-0001-005", name: "メール送信I/F", data: dd005ExternalIf },
];

// 新規追加DD
const ddNew = [
  { id: "DD-SF-AR-0001-006", name: "請求書下書き保存API", srfId: "SF-AR-0001", type: "api", data: dd006DraftApi },
];

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--execute");
  const skipNew = args.includes("--skip-new");
  const validateOnly = args.includes("--validate-only");

  console.log("🚀 SF-AR-0001 DD Update Script");
  console.log(`Mode: ${validateOnly ? "VALIDATE ONLY" : dryRun ? "DRY RUN" : "EXECUTE"}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log("");

  // --validate-onlyモード: Zodバリデーションのみ実行
  if (validateOnly) {
    console.log("📋 Running Zod validation only...\n");
    
    const allDDs = [
      ...ddUpdates.map(dd => ({ ...dd, operation: "update" as const })),
      ...ddNew.map(dd => ({ ...dd, operation: "insert" as const })),
    ];

    let hasError = false;
    for (const dd of allDDs) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Validating: ${dd.id} - ${dd.name} (${dd.operation})`);
      console.log("=".repeat(60));

      const validation = structuredDesignDocumentSpecSchema.safeParse(dd.data);

      if (!validation.success) {
        console.error("❌ Zod validation failed:");
        validation.error.issues.forEach((err) => {
          console.error(`  - ${err.path.join(".")}: ${err.message}`);
        });
        hasError = true;
      } else {
        console.log("✅ Zod validation passed!");
        console.log(`   ioType: ${(dd.data as { ioType?: string }).ioType}`);
        console.log(`   coreLogic.rules: ${(dd.data as { coreLogic?: { rules?: unknown[] } }).coreLogic?.rules?.length || 0}`);
        console.log(`   sideEffects: ${JSON.stringify((dd.data as { sideEffects?: { description?: string } }).sideEffects?.description).slice(0, 60)}...`);
      }
    }

    console.log(`\n\n${"=".repeat(60)}`);
    console.log("📊 VALIDATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total DDs: ${allDDs.length}`);
    console.log(`Status: ${hasError ? "❌ FAILED" : "✅ ALL PASSED"}`);
    
    process.exit(hasError ? 1 : 0);
  }

  // Supabaseクライアント初期化
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    console.error("");
    console.error("To validate without DB connection, use: --validate-only");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 既存DDの更新
  console.log(`📋 Updating ${ddUpdates.length} existing DDs...\n`);

  for (const dd of ddUpdates) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Processing: ${dd.id} - ${dd.name}`);
    console.log("=".repeat(60));

    // Step 1: Zodバリデーション
    console.log("\n📋 Step 1: Validating with Zod schema...");
    const validation = structuredDesignDocumentSpecSchema.safeParse(dd.data);

    if (!validation.success) {
      console.error("❌ Zod validation failed:");
      validation.error.issues.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      console.error(`\n⛔ Stopping execution due to validation error in ${dd.id}`);
      process.exit(1);
    }
    console.log("✅ Zod validation passed!");

    // Step 2: 現在のデータ取得
    console.log("\n🔍 Step 2: Fetching current data...");
    const { data: current, error: fetchError } = await supabase
      .from("design_documents")
      .select("id, name, type, details")
      .eq("id", dd.id)
      .eq("project_id", PROJECT_ID)
      .single();

    if (fetchError) {
      console.error(`❌ Failed to fetch ${dd.id}: ${fetchError.message}`);
      process.exit(1);
    }

    if (!current) {
      console.error(`❌ DD not found: ${dd.id}`);
      process.exit(1);
    }

    console.log(`✅ Found: ${current.name} (${current.type})`);

    // Step 3: Dry-runまたはExecute
    if (dryRun) {
      console.log("\n🏃 DRY RUN - Skipping actual update");
      console.log("\n📊 Changes preview:");
      console.log(`  - sideEffects: ${JSON.stringify((dd.data as { sideEffects?: { description?: string } }).sideEffects?.description).slice(0, 50)}...`);
      console.log(`  - coreLogic.rules count: ${(dd.data as { coreLogic?: { rules?: unknown[] } }).coreLogic?.rules?.length || 0}`);
    } else {
      console.log("\n🚀 EXECUTING UPDATE...");

      const { error: updateError } = await supabase
        .from("design_documents")
        .update({
          details: dd.data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dd.id)
        .eq("project_id", PROJECT_ID);

      if (updateError) {
        console.error(`❌ Update failed: ${updateError.message}`);
        process.exit(1);
      }

      console.log("✅ Update successful!");
    }
  }

  // 新規DDの追加（--skip-newがない場合）
  if (!skipNew) {
    console.log(`\n\n${"=".repeat(60)}`);
    console.log(`📋 Adding ${ddNew.length} new DDs...`);
    console.log("=".repeat(60));

    for (const dd of ddNew) {
      console.log(`\n${"-".repeat(60)}`);
      console.log(`Processing: ${dd.id} - ${dd.name}`);
      console.log("-".repeat(60));

      // Step 1: Zodバリデーション
      console.log("\n📋 Step 1: Validating with Zod schema...");
      const validation = structuredDesignDocumentSpecSchema.safeParse(dd.data);

      if (!validation.success) {
        console.error("❌ Zod validation failed:");
        validation.error.issues.forEach((err) => {
          console.error(`  - ${err.path.join(".")}: ${err.message}`);
        });
        console.error(`\n⛔ Skipping ${dd.id} due to validation error`);
        continue;
      }
      console.log("✅ Zod validation passed!");

      // Step 2: 既存チェック
      console.log("\n🔍 Step 2: Checking if already exists...");
      const { data: existing, error: checkError } = await supabase
        .from("design_documents")
        .select("id")
        .eq("id", dd.id)
        .eq("project_id", PROJECT_ID)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error(`❌ Error checking ${dd.id}: ${checkError.message}`);
        continue;
      }

      if (existing) {
        console.log(`⚠️  ${dd.id} already exists, skipping`);
        continue;
      }

      console.log("✅ Not exists, ready to insert");

      // Step 3: Dry-runまたはExecute
      if (dryRun) {
        console.log("\n🏃 DRY RUN - Skipping actual insert");
      } else {
        console.log("\n🚀 EXECUTING INSERT...");

        const { error: insertError } = await supabase.from("design_documents").insert({
          id: dd.id,
          project_id: PROJECT_ID,
          srf_id: dd.srfId,
          name: dd.name,
          type: dd.type,
          details: dd.data,
          summary: (dd.data as { summary?: string }).summary || `${dd.name}の設計書`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error(`❌ Insert failed: ${insertError.message}`);
          continue;
        }

        console.log("✅ Insert successful!");
      }
    }
  }

  // requirement_linksへのcaller link追加（001 → 006）
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("📋 Adding caller link (DD-SF-AR-0001-001 → DD-SF-AR-0001-006)");
  console.log("=".repeat(60));

  const callerLink = {
    project_id: PROJECT_ID,
    source_type: "dd",
    source_id: "DD-SF-AR-0001-001",
    target_type: "dd",
    target_id: "DD-SF-AR-0001-006",
    link_type: "calls_sync",
    suspect: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 既存チェック
  console.log("\n🔍 Checking if link already exists...");
  const { data: existingLink, error: linkCheckError } = await supabase
    .from("requirement_links")
    .select("id")
    .eq("project_id", PROJECT_ID)
    .eq("source_type", "dd")
    .eq("source_id", "DD-SF-AR-0001-001")
    .eq("target_type", "dd")
    .eq("target_id", "DD-SF-AR-0001-006")
    .eq("link_type", "calls_sync")
    .single();

  if (linkCheckError && linkCheckError.code !== "PGRST116") {
    console.error(`❌ Error checking link: ${linkCheckError.message}`);
  } else if (existingLink) {
    console.log("⚠️  Caller link already exists, skipping");
  } else {
    console.log("✅ Link not exists, ready to insert");

    if (dryRun) {
      console.log("\n🏃 DRY RUN - Skipping actual insert");
      console.log("\n📊 Link details:");
      console.log(`  Source: ${callerLink.source_id}`);
      console.log(`  Target: ${callerLink.target_id}`);
      console.log(`  Type: ${callerLink.link_type}`);
    } else {
      console.log("\n🚀 EXECUTING INSERT...");

      const { error: linkInsertError } = await supabase
        .from("requirement_links")
        .insert(callerLink);

      if (linkInsertError) {
        console.error(`❌ Link insert failed: ${linkInsertError.message}`);
      } else {
        console.log("✅ Caller link added successfully!");
      }
    }
  }

  // 完了サマリー
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "EXECUTED"}`);
  console.log(`Updated DDs: ${ddUpdates.length}`);
  if (!skipNew) {
    console.log(`New DDs: ${ddNew.length}`);
  }
  console.log("\nUpdated DDs:");
  ddUpdates.forEach((dd) => console.log(`  ✅ ${dd.id}: ${dd.name}`));
  if (!skipNew) {
    console.log("\nNew DDs:");
    ddNew.forEach((dd) => console.log(`  ➕ ${dd.id}: ${dd.name}`));
  }
  console.log(`\nCaller Links: ${existingLink ? "⚠️ skipped (exists)" : dryRun ? "🏃 dry-run" : "✅ added"}`);

  if (dryRun) {
    console.log("\n⚠️  This was a dry-run. Use --execute to apply changes.");
  } else {
    console.log("\n✅ All changes have been applied successfully!");
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
