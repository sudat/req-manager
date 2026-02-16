#!/usr/bin/env -S bun run
/**
 * マージ検証スクリプト
 * DD-SF-AR-0001-002の更新とDD-SF-AR-0002-002の削除を検証
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  console.log("🔍 検証: DD-SF-AR-0001-002の更新内容を確認\n");

  // Step 1: DD-SF-AR-0001-002の確認
  const { data: dd002, error: error002 } = await supabase
    .from("design_documents")
    .select("id, name, details")
    .eq("id", "DD-SF-AR-0001-002")
    .single();

  if (error002 || !dd002) {
    console.error("❌ DD-SF-AR-0001-002 not found");
    process.exit(1);
  }

  console.log("✅ DD-SF-AR-0001-002 found");
  console.log(`   Name: ${dd002.name}`);

  const rules = (dd002.details as { coreLogic?: { rules?: Array<{ name: string; type: string; description: string }> } }).coreLogic?.rules || [];
  console.log(`   coreLogic.rules count: ${rules.length}`);

  const requiredRules = [
    "tax_breakdown_by_rate",
    "tax_rate_assignment",
    "qualified_invoice_format"
  ];

  let allRulesFound = true;
  for (const ruleName of requiredRules) {
    const rule = rules.find(r => r.name === ruleName);
    if (rule) {
      console.log(`   ✅ ${ruleName} rule found`);
    } else {
      console.error(`   ❌ ${ruleName} rule NOT found`);
      allRulesFound = false;
    }
  }

  const exceptions = (dd002.details as { exceptions?: Array<{ name: string; errorCode: string }> }).exceptions || [];
  const taxRateError = exceptions.find(e => e.errorCode === "TAX_RATE_NOT_CONFIGURED");
  if (taxRateError) {
    console.log(`   ✅ TAX_RATE_NOT_CONFIGURED exception found`);
  } else {
    console.error(`   ❌ TAX_RATE_NOT_CONFIGURED exception NOT found`);
    allRulesFound = false;
  }

  const productTimeoutError = exceptions.find(e => e.errorCode === "PRODUCT_MASTER_TIMEOUT");
  if (productTimeoutError) {
    console.log(`   ✅ PRODUCT_MASTER_TIMEOUT exception found`);
  } else {
    console.error(`   ❌ PRODUCT_MASTER_TIMEOUT exception NOT found`);
    allRulesFound = false;
  }

  const outputFields = (dd002.details as { outputSchema?: { success?: { fields?: Array<{ name: string }> } } }).outputSchema?.success?.fields || [];
  const taxBreakdownField = outputFields.find(f => f.name === "taxBreakdown");
  if (taxBreakdownField) {
    console.log(`   ✅ taxBreakdown field in outputSchema`);
  } else {
    console.error(`   ❌ taxBreakdown field NOT found in outputSchema`);
    allRulesFound = false;
  }

  console.log("\n🔍 検証: DD-SF-AR-0002-002の削除を確認\n");

  // Step 2: DD-SF-AR-0002-002が削除されているか確認
  const { data: dd0002, error: error0002 } = await supabase
    .from("design_documents")
    .select("id")
    .eq("id", "DD-SF-AR-0002-002")
    .maybeSingle();

  if (dd0002) {
    console.error("❌ DD-SF-AR-0002-002 still exists!");
    process.exit(1);
  }

  if (error0002 && error0002.code !== "PGRST116") {
    console.error(`❌ Error checking DD-SF-AR-0002-002: ${error0002.message}`);
    process.exit(1);
  }

  console.log("✅ DD-SF-AR-0002-002 deleted successfully");

  // 結果
  console.log("\n" + "=".repeat(60));
  console.log("📊 検証結果");
  console.log("=".repeat(60));

  if (allRulesFound) {
    console.log("✅ All verifications passed!");
    console.log("\n📝 Summary:");
    console.log("  - DD-SF-AR-0001-002 に税率別内訳集計ロジックが追加されました");
    console.log("  - DD-SF-AR-0002-002 が削除されました");
    console.log("  - SF-AR-0002 は「商品マスタ税率区分管理」として存続します");
    process.exit(0);
  } else {
    console.error("❌ Some verifications failed");
    process.exit(1);
  }
}

verify().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
