#!/usr/bin/env -S bun run
/**
 * DD-SF-AR-0001-003（請求書一括発行バッチ）の呼び出し元リンクをseedする。
 *
 * 期待するリンク:
 *   source(dd): DD-SF-AR-0001-002（請求書発行API）
 *   target(dd): DD-SF-AR-0001-003（請求書一括発行バッチ）
 *   link_type : calls_async
 *
 * Usage:
 *   bun scripts/db/seed-dd-sf-ar-0001-003-caller.ts             # dry-run
 *   bun scripts/db/seed-dd-sf-ar-0001-003-caller.ts --execute   # 反映
 *   bun scripts/db/seed-dd-sf-ar-0001-003-caller.ts --execute --replace
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

type CliArgs = {
  execute: boolean;
  replace: boolean;
};

const PROJECT_ID = process.env.PROJECT_ID ?? "00000000-0000-0000-0000-000000000001";
const SOURCE_DD_ID = "DD-SF-AR-0001-002";
const TARGET_DD_ID = "DD-SF-AR-0001-003";
const LINK_TYPE = "calls_async";
const CALLER_LINK_TYPES = ["called_by_user", "calls_sync", "calls_async"];

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);
  return {
    execute: args.includes("--execute"),
    replace: args.includes("--replace"),
  };
};

const ensureEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const main = async () => {
  config({ path: ".env.local" });
  config();

  const { execute, replace } = parseArgs();
  const mode = execute ? "EXECUTE" : "DRY-RUN";

  const supabase = createClient(
    ensureEnv("NEXT_PUBLIC_SUPABASE_URL"),
    ensureEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );

  console.log(`==> mode: ${mode}`);
  console.log(`==> project: ${PROJECT_ID}`);
  console.log(`==> target: ${TARGET_DD_ID}`);
  console.log(`==> desired caller: ${SOURCE_DD_ID} (${LINK_TYPE})`);

  const { data: targetLinks, error: listError } = await supabase
    .from("requirement_links")
    .select("id, source_type, source_id, target_type, target_id, link_type")
    .eq("project_id", PROJECT_ID)
    .eq("target_type", "dd")
    .eq("target_id", TARGET_DD_ID)
    .in("link_type", CALLER_LINK_TYPES);

  if (listError) throw new Error(`リンク取得失敗: ${listError.message}`);

  const existing = targetLinks ?? [];
  const alreadyExists = existing.some(
    (row) =>
      row.source_type === "dd" &&
      row.source_id === SOURCE_DD_ID &&
      row.target_type === "dd" &&
      row.target_id === TARGET_DD_ID &&
      row.link_type === LINK_TYPE
  );

  console.log(`==> existing caller links for target: ${existing.length}`);
  for (const row of existing) {
    console.log(
      `   - ${row.link_type}: ${row.source_type}:${row.source_id || "(empty)"} -> ${row.target_type}:${row.target_id}`
    );
  }

  if (alreadyExists && !replace) {
    console.log("==> 既に期待リンクが存在するため、変更なし");
    return;
  }

  if (!execute) {
    if (replace) {
      console.log("==> [dry-run] 既存callerリンクを削除して再作成する予定");
    } else {
      console.log("==> [dry-run] 期待リンクを1件追加する予定");
    }
    return;
  }

  if (replace && existing.length > 0) {
    const idsToDelete = existing.map((row) => row.id);
    const { error: deleteError } = await supabase
      .from("requirement_links")
      .delete()
      .in("id", idsToDelete);
    if (deleteError) throw new Error(`既存リンク削除失敗: ${deleteError.message}`);
    console.log(`==> deleted ${idsToDelete.length} link(s)`);
  }

  if (!alreadyExists || replace) {
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from("requirement_links").insert({
      project_id: PROJECT_ID,
      source_type: "dd",
      source_id: SOURCE_DD_ID,
      target_type: "dd",
      target_id: TARGET_DD_ID,
      link_type: LINK_TYPE,
      suspect: false,
      created_at: now,
      updated_at: now,
    });
    if (insertError) throw new Error(`リンク作成失敗: ${insertError.message}`);
    console.log("==> inserted 1 link");
  }

  const { data: verifyRows, error: verifyError } = await supabase
    .from("requirement_links")
    .select("source_id, target_id, link_type")
    .eq("project_id", PROJECT_ID)
    .eq("target_type", "dd")
    .eq("target_id", TARGET_DD_ID)
    .in("link_type", CALLER_LINK_TYPES)
    .order("created_at", { ascending: true });

  if (verifyError) throw new Error(`検証取得失敗: ${verifyError.message}`);

  console.log("==> verification:");
  for (const row of verifyRows ?? []) {
    console.log(`   - ${row.link_type}: ${row.source_id || "(empty)"} -> ${row.target_id}`);
  }
};

await main();
