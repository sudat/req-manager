#!/usr/bin/env -S bun run
/**
 * AR領域（売掛金管理）の業務タスク・業務要件サンプルデータを登録するスクリプト
 *
 * 既存のDD seedスクリプトパターンに準拠した安全な実行フローを採用
 *
 * Usage:
 *   bun scripts/db/seed-bt-ar-tasks.ts                      # dry-run
 *   bun scripts/db/seed-bt-ar-tasks.ts --execute           # 登録実行
 *   bun scripts/db/seed-bt-ar-tasks.ts --execute --replace  # 上書き再登録
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { AR_BUSINESS_TASKS_DATA, type BusinessTaskData } from "./seed-bt-ar-data";

type CliArgs = {
  execute: boolean;
  replace: boolean;
};

const PROJECT_ID = process.env.PROJECT_ID ?? "00000000-0000-0000-0000-000000000001";

/**
 * CLI引数の解析
 */
const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);
  return {
    execute: args.includes("--execute"),
    replace: args.includes("--replace"),
  };
};

/**
 * 環境変数の必須チェック
 */
const ensureEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

/**
 * プロセステップをJSONB形式に変換
 */
const formatProcessSteps = (steps: Array<{ when: string; who: string; action: string }>) => {
  return JSON.stringify(steps);
};

/**
 * 入出力をJSONB形式に変換
 */
const formatInputOutput = (items: Array<{ name: string; description?: string; source: string; condition?: string }>) => {
  return JSON.stringify(items.map(item => ({
    name: item.name,
    description: item.description || item.name,
    type: "data",
    source: item.source,
    condition: item.condition
  })));
};

/**
 * メイン処理
 */
const main = async () => {
  config({ path: ".env.local" });
  config();

  const { execute, replace } = parseArgs();
  const mode = execute ? "EXECUTE" : "DRY-RUN";

  const supabase = createClient(
    ensureEnv("NEXT_PUBLIC_SUPABASE_URL"),
    ensureEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );

  console.log("=".repeat(60));
  console.log("AR領域 業務タスク・業務要件 サンプルデータ登録");
  console.log("=".repeat(60));
  console.log(`==> mode: ${mode}`);
  console.log(`==> project: ${PROJECT_ID}`);
  console.log(`==> business_area: AR`);

  // 既存データ確認
  const { data: existingTasks, error: listError } = await supabase
    .from("business_tasks")
    .select("id, name, business_area")
    .eq("project_id", PROJECT_ID)
    .eq("business_area", "AR");

  if (listError) {
    throw new Error(`既存BT取得失敗: ${listError.message}`);
  }

  const existingTaskIds = (existingTasks ?? []).map(t => t.id);
  console.log(`==> existing BT count: ${existingTaskIds.length}`);
  if (existingTaskIds.length > 0) {
    console.log("    existing tasks:", existingTaskIds.join(", "));
  }

  // 既存データがある場合の確認
  if (existingTaskIds.length > 0 && !replace) {
    console.log("\n==> 既存データが存在するため、変更なし（--replaceフラグで上書き可能）");
    return;
  }

  // --replaceの場合は既存データを削除
  if (replace && existingTaskIds.length > 0) {
    console.log(`\n==> 既存BTを削除: ${existingTaskIds.length}件`);
    const { error: deleteTasksError } = await supabase
      .from("business_tasks")
      .delete()
      .in("id", existingTaskIds);

    if (deleteTasksError) {
      throw new Error(`既存BT削除失敗: ${deleteTasksError.message}`);
    }

    // 関連するBRも削除（CASCADEが効かない場合の考慮）
    const { data: existingBRs } = await supabase
      .from("business_requirements")
      .select("id")
      .eq("project_id", PROJECT_ID)
      .in("task_id", existingTaskIds);

    if (existingBRs && existingBRs.length > 0) {
      const brIds = existingBRs.map(br => br.id);
      console.log(`==> 関連BRを削除: ${brIds.length}件`);
      const { error: deleteBRError } = await supabase
        .from("business_requirements")
        .delete()
        .in("id", brIds);

      if (deleteBRError) {
        throw new Error(`既存BR削除失敗: ${deleteBRError.message}`);
      }
    }

    console.log("==> 既存データ削除完了");
  }

  // 登録予定データのサマリー
  console.log("\n==> 登録予定データ:");
  console.log(`    BT: ${AR_BUSINESS_TASKS_DATA.length}件`);
  const totalBRs = AR_BUSINESS_TASKS_DATA.reduce((sum, task) => sum + task.requirements.length, 0);
  console.log(`    BR: ${totalBRs}件`);

  // 各タスクの詳細
  for (const task of AR_BUSINESS_TASKS_DATA) {
    console.log(`\n    ${task.taskId}: ${task.name}`);
    console.log(`        概要: ${task.summary.substring(0, 50)}...`);
    console.log(`        BR数: ${task.requirements.length}件`);
    for (const req of task.requirements) {
      console.log(`          - ${req.requirementId}: ${req.requirement}`);
    }
  }

  if (!execute) {
    console.log("\n==> [dry-run] 上記データを登録します。--executeフラグで実行してください。");
    return;
  }

  // 実行モード：データ登録
  console.log("\n==> データ登録開始...");

  let insertedBTs = 0;
  let insertedBRs = 0;
  const errors: Array<{ task: string; error: string }> = [];

  for (const taskData of AR_BUSINESS_TASKS_DATA) {
    try {
      const now = new Date().toISOString();

      // BT登録
      const { error: btError } = await supabase
        .from("business_tasks")
        .insert({
          id: taskData.taskId,
          project_id: PROJECT_ID,
          business_area: "AR",
          name: taskData.name,
          summary: taskData.summary,
          process_steps: formatProcessSteps(taskData.processSteps),
          input: formatInputOutput(taskData.input),
          output: formatInputOutput(taskData.output),
          concepts: taskData.concepts,
          concept_ids_yaml: JSON.stringify(taskData.concepts),
          sort_order: parseInt(taskData.taskId.split("-")[2] || "0"),
          created_at: now,
          updated_at: now,
        });

      if (btError) {
        errors.push({ task: taskData.taskId, error: `BT登録失敗: ${btError.message}` });
        continue;
      }

      insertedBTs++;

      // BR登録
      for (const req of taskData.requirements) {
        const { error: brError } = await supabase
          .from("business_requirements")
          .insert({
            id: req.requirementId,
            project_id: PROJECT_ID,
            task_id: taskData.taskId,
            title: req.code,
            goal: req.goal,  // requirement を goal に変更（DBスキーマ対応）
            concept_ids: req.conceptIds,
            created_at: now,
            updated_at: now,
          });

        if (brError) {
          errors.push({ task: req.requirementId, error: `BR登録失敗: ${brError.message}` });
        } else {
          insertedBRs++;
        }
      }

    } catch (e) {
      errors.push({ task: taskData.taskId, error: `例外: ${e}` });
    }
  }

  // 結果表示
  console.log("\n" + "=".repeat(60));
  console.log("==> 登録完了");
  console.log(`    BT: ${insertedBTs}/${AR_BUSINESS_TASKS_DATA.length}件`);
  console.log(`    BR: ${insertedBRs}/${totalBRs}件`);

  if (errors.length > 0) {
    console.log(`\n==> エラー発生: ${errors.length}件`);
    for (const err of errors) {
      console.log(`    [${err.task}] ${err.error}`);
    }
  }

  // 検証：登録後のデータ取得
  console.log("\n==> 検証：登録後のデータ取得");
  const { data: verifyTasks, error: verifyError } = await supabase
    .from("business_tasks")
    .select("id, name, business_area, summary")
    .eq("project_id", PROJECT_ID)
    .eq("business_area", "AR")
    .order("id", { ascending: true });

  if (verifyError) {
    console.log(`    検証取得失敗: ${verifyError.message}`);
  } else {
    console.log(`    登録済みBT: ${verifyTasks?.length || 0}件`);
    for (const task of verifyTasks || []) {
      console.log(`      - ${task.id}: ${task.name}`);
    }
  }

  // BR件数確認
  const { count: brCount, error: brCountError } = await supabase
    .from("business_requirements")
    .select("*", { count: "exact", head: false })
    .eq("project_id", PROJECT_ID)
    .in("task_id", AR_BUSINESS_TASKS_DATA.map(t => t.taskId));

  if (brCountError) {
    console.log(`    BR件数取得失敗: ${brCountError.message}`);
  } else {
    console.log(`    登録済みBR: ${brCount || 0}件`);
  }

  console.log("=".repeat(60));

  if (errors.length > 0) {
    process.exit(1);
  }
};

await main();
