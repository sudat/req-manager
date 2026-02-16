#!/usr/bin/env -S bun run
/**
 * SF-AR-0001/0002 マージ用seed
 * - DD-SF-AR-0001-002に税率別内訳集計ルールを追加
 * - DD-SF-AR-0002-002を削除
 * 
 * Usage:
 *   bun scripts/db/seed-merge-sf-ar-0002.ts --dry-run
 *   bun scripts/db/seed-merge-sf-ar-0002.ts --execute
 */

import { createClient } from "@supabase/supabase-js";
import { structuredDesignDocumentSpecSchema } from "../../lib/domain/schemas/design-document-structured";

const PROJECT_ID = "00000000-0000-0000-0000-000000000001";

// DD-SF-AR-0001-002: 請求書発行API（税率別内訳集計ロジック追加版）
const dd002ApiUpdated = {
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
        {
          name: "taxBreakdown",
          type: "object" as const,
          label: "税率別内訳",
          required: true,
          description: "税率ごとの税抜金額・消費税額・税込金額の内訳",
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
      {
        status: 422,
        description: "税率区分が設定されていない商品が含まれる",
        fields: [
          {
            name: "error",
            type: "string" as const,
            label: "エラー",
            required: true,
            description: "TAX_RATE_NOT_CONFIGURED",
          },
          {
            name: "productIds",
            type: "array" as const,
            label: "未設定商品IDリスト",
            required: true,
            description: "税率区分が未設定の商品IDリスト",
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
      {
        name: "taxBreakdown",
        type: "object" as const,
        label: "税率別内訳",
        required: true,
        description: "税率ごとの金額内訳（10%/8%/軽減税率/不課税）",
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
        type: "validate" as const,
        name: "line_items_valid",
        description: "明細データの妥当性チェック",
        preconditions: ["lineItemsが空でない", "商品マスタに存在する商品IDのみ"],
      },
      {
        type: "derive" as const,
        name: "invoice_number_generate",
        description: "請求書番号を自動採番（INV-YYYYMM-連番4桁）",
        formulas: ["INV-{YYYYMM}-{seq:0001}"],
      },
      {
        type: "derive" as const,
        name: "tax_rate_assignment",
        description: "商品マスタの税率区分に基づき、各明細に税率を適用（10%/8%/軽減税率/不課税）",
        preconditions: ["product.taxCategoryが設定されていること"],
      },
      {
        type: "derive" as const,
        name: "tax_calculation_per_line",
        description: "明細行ごとに消費税額を計算（税抜金額 × 税率、端数は1円単位切り捨て）",
        formulas: ["tax = floor(amount * rate)"],
        preconditions: ["amount: 税抜金額", "rate: 適用税率（0.10, 0.08, 0.00）"],
      },
      {
        type: "derive" as const,
        name: "tax_breakdown_by_rate",
        description: "税率別（10%/8%/軽減税率/不課税）に税抜金額・消費税額・税込金額を集計",
        formulas: [
          "subtotal10 = Σ(10%対象明細の税抜金額)",
          "tax10 = Σ(10%対象明細の消費税額)",
          "subtotal8 = Σ(8%対象明細の税抜金額)",
          "tax8 = Σ(8%対象明細の消費税額)",
          "subtotalReduced = Σ(軽減税率対象明細の税抜金額)",
          "taxReduced = Σ(軽減税率対象明細の消費税額)",
          "subtotalZero = Σ(不課税対象明細の税抜金額)",
        ],
      },
      {
        type: "derive" as const,
        name: "total_amount",
        description: "全税率の小計＋消費税で請求合計を算出",
        formulas: ["合計 = (subtotal10 + tax10) + (subtotal8 + tax8) + (subtotalReduced + taxReduced) + subtotalZero"],
      },
      {
        type: "derive" as const,
        name: "qualified_invoice_format",
        description: "適格請求書対応：税率ごとの対価と消費税額を区分して出力フォーマット生成",
        preconditions: ["インボイス制度に準拠したフォーマット"],
      },
      {
        type: "decide" as const,
        name: "pdf_queue",
        description: "PDF生成ジョブをキューに登録。非同期処理で生成（税率別内訳表を含む）",
      },
      {
        type: "decide" as const,
        name: "status_transition",
        description: "ステータスを'draft'から'issued'に変更すべきか判定",
      },
    ],
  },
  sideEffects: {
    description: "請求書データの確定（税率別内訳含む）、PDF生成キューイング、イベント発行、メール送信",
    dbOperations: [
      {
        table: "invoices",
        operation: "update",
        affectedColumns: ["status", "invoice_number", "issue_date", "total_amount", "subtotal_10", "tax_amount_10", "subtotal_8", "tax_amount_8", "subtotal_reduced", "tax_amount_reduced", "subtotal_zero", "updated_at"],
        condition: "id = ${draftInvoiceId}",
      },
      {
        table: "invoice_line_items",
        operation: "update",
        affectedColumns: ["tax_rate", "tax_amount", "total_amount"],
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
          {
            name: "taxBreakdown",
            type: "object" as const,
            label: "税率別内訳",
            required: true,
            description: "PDFに含める税率別内訳データ",
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
          {
            name: "taxBreakdown",
            type: "object" as const,
            label: "税率別内訳",
            required: true,
            description: "税率ごとの集計結果",
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
    {
      name: "tax_rate_not_configured",
      type: "state",
      condition: "商品の税率区分が設定されていない",
      description: "軽減税率対象商品等の税率区分が未設定",
      httpStatus: 422,
      errorCode: "TAX_RATE_NOT_CONFIGURED",
      message: "商品の税率区分が設定されていないため、請求書を発行できません。商品マスタを確認してください。",
      recovery: "manual_intervention",
      userNotification: "inline",
      logging: "audit",
    },
    {
      name: "product_master_timeout",
      type: "external",
      condition: "商品マスタ参照がタイムアウト",
      description: "商品マスタAPIがタイムアウト",
      httpStatus: 503,
      errorCode: "PRODUCT_MASTER_TIMEOUT",
      message: "商品マスタ参照がタイムアウトしました。しばらく待ってから再試行してください。",
      recovery: "retry_with_backoff",
      userNotification: "toast",
      logging: "error",
    },
  ],
  nonFunctional: {
    performance: "PDF生成は非同期で行い、APIレスポンスは即時返却。税率別集計は同期処理",
    availability: "PDF生成サービス障害時はキューに残し、復旧後に再処理",
  },
};

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--execute");

  console.log("🚀 SF-AR-0002 → SF-AR-0001 マージ用Seed");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "EXECUTE"}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log("");

  // Supabaseクライアント初期化
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: DD-SF-AR-0001-002の更新
  console.log("=".repeat(60));
  console.log("📋 Step 1: DD-SF-AR-0001-002（請求書発行API）を更新");
  console.log("   税率別内訳集計ロジックを追加");
  console.log("=".repeat(60));

  // Zodバリデーション
  console.log("\n📋 Validating new data with Zod schema...");
  const validation = structuredDesignDocumentSpecSchema.safeParse(dd002ApiUpdated);

  if (!validation.success) {
    console.error("❌ Zod validation failed:");
    validation.error.issues.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
    process.exit(1);
  }
  console.log("✅ Zod validation passed!");

  // 現在のデータ取得
  console.log("\n🔍 Fetching current DD-SF-AR-0001-002...");
  const { data: current002, error: fetchError002 } = await supabase
    .from("design_documents")
    .select("id, name, type, details")
    .eq("id", "DD-SF-AR-0001-002")
    .eq("project_id", PROJECT_ID)
    .single();

  if (fetchError002) {
    console.error(`❌ Failed to fetch DD-SF-AR-0001-002: ${fetchError002.message}`);
    process.exit(1);
  }

  if (!current002) {
    console.error("❌ DD-SF-AR-0001-002 not found");
    process.exit(1);
  }

  console.log(`✅ Found: ${current002.name} (${current002.type})`);

  // 更新実行
  if (dryRun) {
    console.log("\n🏃 DRY RUN - Skipping actual update");
    console.log("\n📊 Changes summary:");
    console.log("   - Added tax_breakdown_by_rate rule (税率別集計)");
    console.log("   - Added tax_rate_assignment rule (税率適用)");
    console.log("   - Added qualified_invoice_format rule (適格請求書対応)");
    console.log("   - Added taxBreakdown to outputSchema");
    console.log("   - Updated sideEffects.dbOperations (税率別カラム追加)");
    console.log("   - Added tax_rate_not_configured exception");
    console.log("   - Added product_master_timeout exception");
  } else {
    console.log("\n🚀 EXECUTING UPDATE...");

    const { error: updateError } = await supabase
      .from("design_documents")
      .update({
        details: dd002ApiUpdated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "DD-SF-AR-0001-002")
      .eq("project_id", PROJECT_ID);

    if (updateError) {
      console.error(`❌ Update failed: ${updateError.message}`);
      process.exit(1);
    }

    console.log("✅ DD-SF-AR-0001-002 updated successfully!");
  }

  // Step 2: DD-SF-AR-0002-002の削除
  console.log("\n" + "=".repeat(60));
  console.log("📋 Step 2: DD-SF-AR-0002-002（税率別内訳集計API）を削除");
  console.log("   機能はDD-SF-AR-0001-002に統合済み");
  console.log("=".repeat(60));

  // 現在のデータ確認
  console.log("\n🔍 Checking DD-SF-AR-0002-002...");
  const { data: current0002, error: fetchError0002 } = await supabase
    .from("design_documents")
    .select("id, name, type")
    .eq("id", "DD-SF-AR-0002-002")
    .eq("project_id", PROJECT_ID)
    .single();

  if (fetchError0002 && fetchError0002.code !== "PGRST116") {
    console.error(`❌ Error checking DD-SF-AR-0002-002: ${fetchError0002.message}`);
    process.exit(1);
  }

  if (!current0002) {
    console.log("⚠️  DD-SF-AR-0002-002 does not exist (already deleted?)");
  } else {
    console.log(`✅ Found: ${current0002.name} (${current0002.type})`);

    if (dryRun) {
      console.log("\n🏃 DRY RUN - Skipping actual delete");
      console.log("\n📊 Would delete:");
      console.log(`   - ID: ${current0002.id}`);
      console.log(`   - Name: ${current0002.name}`);
    } else {
      console.log("\n🚀 EXECUTING DELETE...");

      const { error: deleteError } = await supabase
        .from("design_documents")
        .delete()
        .eq("id", "DD-SF-AR-0002-002")
        .eq("project_id", PROJECT_ID);

      if (deleteError) {
        console.error(`❌ Delete failed: ${deleteError.message}`);
        process.exit(1);
      }

      console.log("✅ DD-SF-AR-0002-002 deleted successfully!");
    }
  }

  // Step 3: requirement_linksのクリーンアップ（0002-002へのリンクがあれば削除）
  console.log("\n" + "=".repeat(60));
  console.log("📋 Step 3: requirement_linksのクリーンアップ");
  console.log("   DD-SF-AR-0002-002へのcallerリンクを削除");
  console.log("=".repeat(60));

  console.log("\n🔍 Checking requirement_links...");
  const { data: linksToDelete, error: linksError } = await supabase
    .from("requirement_links")
    .select("id, source_type, source_id, target_type, target_id, link_type")
    .eq("project_id", PROJECT_ID)
    .eq("target_type", "dd")
    .eq("target_id", "DD-SF-AR-0002-002");

  if (linksError) {
    console.error(`❌ Error fetching links: ${linksError.message}`);
    // 致命的ではないので続行
  } else if (!linksToDelete || linksToDelete.length === 0) {
    console.log("✅ No links to DD-SF-AR-0002-002 found");
  } else {
    console.log(`✅ Found ${linksToDelete.length} link(s) to DD-SF-AR-0002-002:`);
    linksToDelete.forEach((link) => {
      console.log(`   - ${link.source_type}:${link.source_id} → ${link.target_type}:${link.target_id} (${link.link_type})`);
    });

    if (dryRun) {
      console.log("\n🏃 DRY RUN - Skipping actual delete");
      console.log(`\n📊 Would delete ${linksToDelete.length} link(s)`);
    } else {
      console.log("\n🚀 EXECUTING DELETE...");

      const { error: deleteLinksError } = await supabase
        .from("requirement_links")
        .delete()
        .eq("project_id", PROJECT_ID)
        .eq("target_type", "dd")
        .eq("target_id", "DD-SF-AR-0002-002");

      if (deleteLinksError) {
        console.error(`❌ Failed to delete links: ${deleteLinksError.message}`);
        // 致命的ではないので続行
      } else {
        console.log(`✅ Deleted ${linksToDelete.length} link(s)`);
      }
    }
  }

  // 完了サマリー
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "EXECUTED"}`);
  console.log("");
  console.log("Actions:");
  console.log(`  1. ✅ Updated DD-SF-AR-0001-002 (${dryRun ? "dry-run" : "done"})`);
  console.log(`     - Added tax breakdown aggregation logic from DD-SF-AR-0002-002`);
  console.log(`  2. ✅ Deleted DD-SF-AR-0002-002 (${current0002 ? (dryRun ? "dry-run" : "done") : "not found"})`);
  console.log(`  3. ✅ Cleaned up requirement_links (${linksToDelete?.length || 0} links ${dryRun ? "dry-run" : "deleted"})`);
  console.log("");
  console.log("Result:");
  console.log("  SF-AR-0002の「税率別内訳集計API」機能は");
  console.log("  SF-AR-0001の「請求書発行API」に統合されました。");
  console.log("  SF-AR-0002は「商品マスタ税率区分管理」として存続します。");

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
