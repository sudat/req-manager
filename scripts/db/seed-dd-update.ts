#!/usr/bin/env -S bun run
/**
 * DD内容更新用共通seedスクリプト
 * ZodスキーマでバリデーションしてからDB更新
 * 
 * Usage:
 *   bun scripts/db/seed-dd-update.ts --project-id=<id> --dd-id=<id> --dry-run
 *   bun scripts/db/seed-dd-update.ts --project-id=<id> --dd-id=<id> --execute
 */

import { structuredDesignDocumentSpecSchema } from "../../lib/domain/schemas/design-document-structured";
import { createClient } from "@supabase/supabase-js";

interface UpdateConfig {
  projectId: string;
  ddId: string;
  details: unknown;
  dryRun: boolean;
}

function parseArgs(): UpdateConfig {
  const args = process.argv.slice(2);
  const config: Partial<UpdateConfig> = {
    dryRun: !args.includes("--execute"),
  };

  for (const arg of args) {
    if (arg.startsWith("--project-id=")) {
      config.projectId = arg.split("=")[1];
    } else if (arg.startsWith("--dd-id=")) {
      config.ddId = arg.split("=")[1];
    }
  }

  if (!config.projectId || !config.ddId) {
    console.error("Usage: bun seed-dd-update.ts --project-id=<id> --dd-id=<id> [--execute]");
    console.error("");
    console.error("Required: --project-id, --dd-id");
    console.error("Options:");
    console.error("  --execute    Actually execute the update (default: dry-run)");
    process.exit(1);
  }

  return config as UpdateConfig;
}

async function validateWithZod(details: unknown): Promise<{ success: boolean; error?: string }> {
  try {
    const result = structuredDesignDocumentSpecSchema.safeParse(details);
    if (result.success) {
      return { success: true };
    } else {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      return { success: false, error: `Zod validation failed:\n${errors}` };
    }
  } catch (e) {
    return { success: false, error: `Unexpected error during validation: ${e}` };
  }
}

async function updateDD(config: UpdateConfig & { details: unknown }): Promise<void> {
  // Step 1: Zodバリデーション
  console.log(`\n📋 Validating DD ${config.ddId} with Zod schema...`);
  const validation = await validateWithZod(config.details);
  
  if (!validation.success) {
    console.error("❌ Validation failed:");
    console.error(validation.error);
    process.exit(1);
  }
  console.log("✅ Zod validation passed!");

  // Step 2: DB接続
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 3: 現在のデータ確認
  console.log(`\n🔍 Fetching current DD data...`);
  const { data: currentData, error: fetchError } = await supabase
    .from("design_documents")
    .select("id, name, type, details")
    .eq("id", config.ddId)
    .eq("project_id", config.projectId)
    .single();

  if (fetchError) {
    console.error(`❌ Failed to fetch DD: ${fetchError.message}`);
    process.exit(1);
  }

  if (!currentData) {
    console.error(`❌ DD not found: ${config.ddId}`);
    process.exit(1);
  }

  console.log(`✅ Found DD: ${currentData.name} (${currentData.type})`);

  // Step 4: Dry-runまたはExecute
  if (config.dryRun) {
    console.log("\n🏃 DRY RUN MODE");
    console.log("\n📊 Update summary:");
    console.log(`  Project ID: ${config.projectId}`);
    console.log(`  DD ID: ${config.ddId}`);
    console.log(`  DD Name: ${currentData.name}`);
    console.log(`  DD Type: ${currentData.type}`);
    console.log("\n📝 New details (validated):");
    console.log(JSON.stringify(config.details, null, 2));
    console.log("\n⚠️  This was a dry-run. Use --execute to apply changes.");
  } else {
    console.log("\n🚀 EXECUTING UPDATE...");
    
    const { error: updateError } = await supabase
      .from("design_documents")
      .update({
        details: config.details,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.ddId)
      .eq("project_id", config.projectId);

    if (updateError) {
      console.error(`❌ Update failed: ${updateError.message}`);
      process.exit(1);
    }

    console.log("✅ Update successful!");
    
    // Step 5: 更新結果の検証
    console.log("\n🔍 Verifying update...");
    const { data: verifyData, error: verifyError } = await supabase
      .from("design_documents")
      .select("id, name, details, updated_at")
      .eq("id", config.ddId)
      .eq("project_id", config.projectId)
      .single();

    if (verifyError) {
      console.error(`❌ Verification failed: ${verifyError.message}`);
      process.exit(1);
    }

    console.log("✅ Verification successful!");
    console.log(`   Updated at: ${verifyData.updated_at}`);
  }
}

// メイン実行
async function main() {
  const config = parseArgs();
  
  // detailsは呼び出し側（個別seed）から受け取る
  // このスクリプトは単体では使えない
  console.error("❌ This script should not be called directly.");
  console.error("Use individual seed scripts that import and call updateDD().");
  process.exit(1);
}

// エクスポート（個別seedから使用）
export { validateWithZod, updateDD };
export type { UpdateConfig };

// 直接実行された場合
if (import.meta.main) {
  main();
}
