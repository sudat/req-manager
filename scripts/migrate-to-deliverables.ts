/**
 * 既存のsystem_design + entry_points から deliverables へのデータ移行スクリプト
 *
 * 使用方法:
 * bunx tsx scripts/migrate-to-deliverables.ts
 */

import "dotenv/config";
import { supabase } from "../lib/supabase/client";
import { migrateToDeliverables } from "../lib/data/deliverable-migration";

interface SystemFunctionRow {
  id: string;
  title: string;
  system_design: any[] | null;
  entry_points: any[] | null;
  deliverables: any[] | null;
}

async function main() {
  console.log("========================================");
  console.log("Deliverable マイグレーション開始");
  console.log("========================================\n");

  // 1. 全system_functionsを取得
  console.log("1. system_functions テーブルからデータを取得中...");
  const { data: systemFunctions, error: fetchError } = await supabase
    .from("system_functions")
    .select("id, title, system_design, entry_points, deliverables")
    .order("id");

  if (fetchError) {
    console.error("❌ エラー:", fetchError.message);
    process.exit(1);
  }

  if (!systemFunctions || systemFunctions.length === 0) {
    console.log("✅ マイグレーション対象のデータがありません");
    return;
  }

  console.log(`✅ ${systemFunctions.length}件のシステム機能を取得しました\n`);

  // 2. 各レコードを変換してUPDATE
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const srf of systemFunctions as SystemFunctionRow[]) {
    try {
      // 既にdeliverablesが存在する場合はスキップ
      if (srf.deliverables && Array.isArray(srf.deliverables) && srf.deliverables.length > 0) {
        console.log(`⏭️  ${srf.id} (${srf.title}) - 既にデリバラブルが存在するためスキップ`);
        skipCount++;
        continue;
      }

      // system_designとentry_pointsからdeliverablesを生成
      const systemDesign = srf.system_design || [];
      const entryPoints = srf.entry_points || [];

      const deliverables = migrateToDeliverables(systemDesign, entryPoints);

      if (deliverables.length === 0) {
        console.log(`⏭️  ${srf.id} (${srf.title}) - 変換対象のデータなし`);
        skipCount++;
        continue;
      }

      // UPDATE
      const { error: updateError } = await supabase
        .from("system_functions")
        .update({ deliverables })
        .eq("id", srf.id);

      if (updateError) {
        console.error(`❌ ${srf.id} (${srf.title}) - 更新エラー:`, updateError.message);
        errorCount++;
        continue;
      }

      console.log(`✅ ${srf.id} (${srf.title}) - ${deliverables.length}個のデリバラブルに変換`);
      successCount++;
    } catch (err) {
      console.error(`❌ ${srf.id} (${srf.title}) - 処理エラー:`, err);
      errorCount++;
    }
  }

  // 3. 結果サマリー
  console.log("\n========================================");
  console.log("マイグレーション完了");
  console.log("========================================");
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`⏭️  スキップ: ${skipCount}件`);
  console.log(`❌ エラー: ${errorCount}件`);
  console.log(`📊 合計: ${systemFunctions.length}件`);

  if (errorCount > 0) {
    console.error("\n⚠️  エラーが発生しました。ログを確認してください。");
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ スクリプト正常終了");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ スクリプト実行エラー:", err);
    process.exit(1);
  });
