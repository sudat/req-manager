#!/usr/bin/env -S bun run
/**
 * SF-AR-0002 商品マスタ機能の再定義用Seed
 * 
 * 実行内容:
 * 1. system_functions（SF-AR-0002）の更新
 *    - title: 税率別内訳集計機能 → 商品マスタ機能
 *    - summary: 商品の基本情報と税率区分を管理
 * 
 * 2. system_requirements（4件）の新規作成
 *    - SR-AR-0002-001: 商品基本情報管理
 *    - SR-AR-0002-002: 税率区分管理
 *    - SR-AR-0002-003: 商品検索・一覧
 *    - SR-AR-0002-004: 商品履歴管理
 * 
 * 3. design_documents（DD-SF-AR-0002-001）の名称更新
 *    - name: 商品マスタ税率区分管理画面 → 商品マスタ管理画面
 * 
 * Usage:
 *   bun scripts/db/seed-update-sf-ar-0002-product-master.ts --dry-run
 *   bun scripts/db/seed-update-sf-ar-0002-product-master.ts --execute
 */

import { createClient } from "@supabase/supabase-js";

const PROJECT_ID = "00000000-0000-0000-0000-000000000001";

// system_functions の更新内容
const systemFunctionUpdate = {
  title: "商品マスタ機能",
  summary: "商品の基本情報（名称、単価、単位）および税率区分（10%/8%/軽減税率/不課税）を一元管理する機能。請求書発行、仕入管理など全システムから参照される基盤マスタ。",
  category: "master",
  updated_at: new Date().toISOString(),
};

// system_requirements の新規作成内容
const systemRequirements = [
  {
    id: "SR-AR-0002-001",
    task_id: "BT-AR-0001",
    title: "商品基本情報管理",
    summary: "商品コード、名称、カナ、単位、単価の登録・更新・削除を行う。商品コードは一意である必要がある。",
    category: "function",
    concept_ids: [] as string[],
    impacts: ["請求書発行", "仕入請求書取込"],
    acceptance_criteria: [
      "商品コード、名称、単価、単位を登録できる",
      "既存商品情報を更新できる",
      "商品を削除（または無効化）できる",
      "商品コードの重複を防ぐバリデーションがある"
    ],
    acceptance_criteria_json: [
      {
        given: "商品マスタ管理画面を開いている",
        when: "商品コード、名称、単価、単位を入力して登録ボタンを押す",
        "then": "新しい商品が登録される",
        verification_method: "手動確認"
      },
      {
        given: "既存商品の詳細画面を開いている",
        when: "商品情報を変更して保存ボタンを押す",
        "then": "商品情報が更新される",
        verification_method: "手動確認"
      },
      {
        given: "商品詳細画面を開いている",
        when: "削除ボタン（または無効化ボタン）を押す",
        "then": "商品が削除（または無効化）される",
        verification_method: "手動確認"
      },
      {
        given: "商品登録画面を開いている",
        when: "既存の商品コードと同じコードを入力して登録しようとする",
        "then": "バリデーションエラーが表示され登録できない",
        verification_method: "手動確認"
      }
    ],
    sort_order: 1,
    srf_ids: [] as string[],
  },
  {
    id: "SR-AR-0002-002",
    task_id: "BT-AR-0001",
    title: "税率区分管理",
    summary: "各商品の税率区分（10%標準税率、8%軽減税率、不課税）を設定する。適格請求書発行に必須。",
    category: "function",
    concept_ids: [] as string[],
    impacts: ["請求書発行", "適格請求書対応"],
    acceptance_criteria: [
      "商品ごとに税率区分を設定できる",
      "税率区分は10%/8%/軽減税率/不課税から選択できる",
      "税率区分未設定の商品は警告表示される",
      "税率区分は履歴管理される"
    ],
    acceptance_criteria_json: [
      {
        given: "商品編集画面を開いている",
        when: "税率区分（10%/8%/軽減税率/不課税）を選択して保存する",
        "then": "商品の税率区分が設定される",
        verification_method: "手動確認"
      },
      {
        given: "税率区分未設定の商品が存在する状態で",
        when: "商品一覧画面を開く",
        "then": "税率区分未設定の商品に警告アイコンが表示される",
        verification_method: "手動確認"
      },
      {
        given: "商品の税率区分を変更して",
        when: "保存する",
        "then": "変更履歴が記録される",
        verification_method: "手動確認"
      }
    ],
    sort_order: 2,
    srf_ids: [] as string[],
  },
  {
    id: "SR-AR-0002-003",
    task_id: "BT-AR-0001",
    title: "商品検索・一覧",
    summary: "商品の検索、フィルタリング、ページネーション付き一覧表示を提供する。",
    category: "function",
    concept_ids: [] as string[],
    impacts: [],
    acceptance_criteria: [
      "商品名・コードで検索できる",
      "税率区分でフィルタリングできる",
      "有効/無効でフィルタリングできる",
      "一覧はページネーションされる"
    ],
    acceptance_criteria_json: [
      {
        given: "商品一覧画面を開いている",
        when: "検索欄に商品名またはコードを入力する",
        "then": "一致する商品のみが一覧に表示される",
        verification_method: "手動確認"
      },
      {
        given: "商品一覧画面を開いている",
        when: "税率区分フィルタで「10%」を選択する",
        "then": "10%税率の商品のみが一覧に表示される",
        verification_method: "手動確認"
      },
      {
        given: "商品一覧画面を開いている",
        when: "有効/無効フィルタを切り替える",
        "then": "指定されたステータスの商品のみが表示される",
        verification_method: "手動確認"
      },
      {
        given: "商品が多数登録されている状態で",
        when: "商品一覧画面を開く",
        "then": "ページネーションが表示され、1ページあたりの表示件数が制限される",
        verification_method: "手動確認"
      }
    ],
    sort_order: 3,
    srf_ids: [] as string[],
  },
  {
    id: "SR-AR-0002-004",
    task_id: "BT-AR-0001",
    title: "商品履歴管理",
    summary: "商品情報の変更履歴を保持し、監査対応を行う。誰がいつ何を変更したかを追跡可能にする。",
    category: "function",
    concept_ids: [] as string[],
    impacts: ["監査対応"],
    acceptance_criteria: [
      "商品情報の変更履歴が自動記録される",
      "変更者・変更日時・変更内容が追跡できる",
      "履歴からの変更差分を確認できる"
    ],
    acceptance_criteria_json: [
      {
        given: "商品情報を変更して",
        when: "保存する",
        "then": "変更履歴が自動的に記録される",
        verification_method: "手動確認"
      },
      {
        given: "商品の履歴画面を開いている",
        when: "履歴一覧を確認する",
        "then": "変更者・変更日時・変更内容が表示される",
        verification_method: "手動確認"
      },
      {
        given: "商品の履歴画面を開いている",
        when: "2つの履歴バージョンを選択して比較する",
        "then": "変更差分がハイライト表示される",
        verification_method: "手動確認"
      }
    ],
    sort_order: 4,
    srf_ids: [] as string[],
  },
];

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--execute");

  console.log("🚀 SF-AR-0002 商品マスタ機能 再定義用Seed");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "EXECUTE"}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // ============================================================
  // Step 1: system_functions（SF-AR-0002）の更新
  // ============================================================
  console.log("=".repeat(60));
  console.log("📋 Step 1: system_functions（SF-AR-0002）を更新");
  console.log("=".repeat(60));

  console.log("\n🔍 Fetching current SF-AR-0002...");
  const { data: currentSF, error: fetchErrorSF } = await supabase
    .from("system_functions")
    .select("id, title, summary, category")
    .eq("id", "SF-AR-0002")
    .eq("project_id", PROJECT_ID)
    .single();

  if (fetchErrorSF) {
    console.error(`❌ Failed to fetch SF-AR-0002: ${fetchErrorSF.message}`);
    process.exit(1);
  }

  if (!currentSF) {
    console.error("❌ SF-AR-0002 not found");
    process.exit(1);
  }

  console.log(`✅ Found: ${currentSF.title}`);
  console.log(`   Current summary: ${currentSF.summary?.slice(0, 60)}...`);
  console.log(`   Current category: ${currentSF.category}`);

  if (dryRun) {
    console.log("\n🏃 DRY RUN - Skipping actual update");
    console.log("\n📊 Changes:");
    console.log(`   title: ${currentSF.title} → ${systemFunctionUpdate.title}`);
    console.log(`   category: ${currentSF.category} → ${systemFunctionUpdate.category}`);
    console.log(`   summary: (更新)`);
  } else {
    console.log("\n🚀 EXECUTING UPDATE...");

    const { error: updateError } = await supabase
      .from("system_functions")
      .update(systemFunctionUpdate)
      .eq("id", "SF-AR-0002")
      .eq("project_id", PROJECT_ID);

    if (updateError) {
      console.error(`❌ Update failed: ${updateError.message}`);
      process.exit(1);
    }

    console.log("✅ SF-AR-0002 updated successfully!");
  }

  // ============================================================
  // Step 2: system_requirements（4件）の作成または更新
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 Step 2: system_requirements（4件）を作成または更新");
  console.log("=".repeat(60));

  for (const sr of systemRequirements) {
    console.log(`\n${"-".repeat(60)}`);
    console.log(`Processing: ${sr.id} - ${sr.title}`);
    console.log("-".repeat(60));

    // 既存チェック
    console.log("\n🔍 Checking if already exists...");
    const { data: existingSR, error: checkError } = await supabase
      .from("system_requirements")
      .select("id, title, concept_ids, srf_ids")
      .eq("id", sr.id)
      .eq("project_id", PROJECT_ID)
      .maybeSingle();

    if (checkError) {
      console.error(`❌ Error checking ${sr.id}: ${checkError.message}`);
      continue;
    }

    const isUpdate = !!existingSR;
    console.log(isUpdate ? `⚠️  ${sr.id} already exists, will update` : `✅ Not exists, will insert`);

    if (dryRun) {
      console.log("\n🏃 DRY RUN - Skipping actual operation");
      console.log("\n📊 Data:");
      console.log(`   title: ${sr.title}`);
      console.log(`   concept_ids: [] (空)`);
      console.log(`   srf_ids: [] (空)`);
      console.log(`   acceptance_criteria_json: ${sr.acceptance_criteria_json?.length || 0} items (GWT形式)`);
    } else {
      console.log(isUpdate ? "\n🚀 EXECUTING UPDATE..." : "\n🚀 EXECUTING INSERT...");

      const data = {
        project_id: PROJECT_ID,
        task_id: sr.task_id,
        title: sr.title,
        summary: sr.summary,
        category: sr.category,
        concept_ids: sr.concept_ids,
        impacts: sr.impacts,
        acceptance_criteria: sr.acceptance_criteria,
        acceptance_criteria_json: sr.acceptance_criteria_json,
        sort_order: sr.sort_order,
        srf_ids: sr.srf_ids,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (isUpdate) {
        const result = await supabase
          .from("system_requirements")
          .update(data)
          .eq("id", sr.id)
          .eq("project_id", PROJECT_ID);
        error = result.error;
      } else {
        const result = await supabase.from("system_requirements").insert({
          ...data,
          id: sr.id,
          created_at: new Date().toISOString(),
        });
        error = result.error;
      }

      if (error) {
        console.error(`❌ Operation failed: ${error.message}`);
        continue;
      }

      console.log(isUpdate ? "✅ Update successful!" : "✅ Insert successful!");
    }
  }

  // ============================================================
  // Step 3: design_documents（DD-SF-AR-0002-001）の名称更新
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 Step 3: DD-SF-AR-0002-001（商品マスタ管理画面）の名称更新");
  console.log("=".repeat(60));

  console.log("\n🔍 Fetching current DD-SF-AR-0002-001...");
  const { data: currentDD, error: fetchErrorDD } = await supabase
    .from("design_documents")
    .select("id, name, summary")
    .eq("id", "DD-SF-AR-0002-001")
    .eq("project_id", PROJECT_ID)
    .single();

  if (fetchErrorDD) {
    console.error(`❌ Failed to fetch DD-SF-AR-0002-001: ${fetchErrorDD.message}`);
  } else if (!currentDD) {
    console.log("⚠️  DD-SF-AR-0002-001 not found, skipping");
  } else {
    console.log(`✅ Found: ${currentDD.name}`);
    console.log(`   Summary: ${currentDD.summary?.slice(0, 60)}...`);

    const newDDName = "商品マスタ管理画面";
    const newDDSummary = "商品の基本情報（名称、単価、単位）および税率区分（10%/8%/軽減税率/不課税）を設定・変更する画面。";

    if (dryRun) {
      console.log("\n🏃 DRY RUN - Skipping actual update");
      console.log("\n📊 Changes:");
      console.log(`   name: ${currentDD.name} → ${newDDName}`);
      console.log(`   summary: (更新)`);
    } else {
      console.log("\n🚀 EXECUTING UPDATE...");

      const { error: updateDDError } = await supabase
        .from("design_documents")
        .update({
          name: newDDName,
          summary: newDDSummary,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "DD-SF-AR-0002-001")
        .eq("project_id", PROJECT_ID);

      if (updateDDError) {
        console.error(`❌ Update failed: ${updateDDError.message}`);
      } else {
        console.log("✅ DD-SF-AR-0002-001 updated successfully!");
      }
    }
  }

  // ============================================================
  // Summary
  // ============================================================
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "EXECUTED"}`);
  console.log("");
  console.log("Actions:");
  console.log(`  1. ✅ Updated system_functions (SF-AR-0002)`);
  console.log(`     - title: 商品マスタ機能`);
  console.log(`     - category: master`);
  console.log(`  2. ✅ Created system_requirements (4 items)`);
  systemRequirements.forEach((sr) => {
    console.log(`     - ${sr.id}: ${sr.title}`);
  });
  console.log(`  3. ✅ Updated DD-SF-AR-0002-001 name`);
  console.log(`     - 商品マスタ税率区分管理画面 → 商品マスタ管理画面`);

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
