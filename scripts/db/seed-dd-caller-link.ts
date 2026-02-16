#!/usr/bin/env -S bun run
/**
 * DDの呼び出し元リンクをseedする共通スクリプト。
 *
 * Usage examples:
 *   # dry-run（system caller）
 *   bun scripts/db/seed-dd-caller-link.ts \
 *     --project-id=00000000-0000-0000-0000-000000000001 \
 *     --caller-type=system \
 *     --source-dd-id=DD-SF-AR-0001-002 \
 *     --target-dd-id=DD-SF-AR-0001-003 \
 *     --call-type=calls_async
 *
 *   # execute（既存callerを対象DD単位で置換）
 *   bun scripts/db/seed-dd-caller-link.ts \
 *     --execute --replace \
 *     --project-id=00000000-0000-0000-0000-000000000001 \
 *     --caller-type=user \
 *     --target-dd-id=DD-SF-AR-0001-001
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

type CallerType = "user" | "system";
type CallType = "calls_sync" | "calls_async";

type CliArgs = {
  execute: boolean;
  replace: boolean;
  projectId: string;
  callerType: CallerType;
  sourceDdId?: string;
  targetDdId: string;
  callType: CallType;
};

const CALLER_LINK_TYPES = ["called_by_user", "calls_sync", "calls_async"] as const;
const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

const ensureEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const parseArgs = (): CliArgs => {
  const raw = process.argv.slice(2);
  const map = new Map<string, string>();
  for (const arg of raw) {
    if (!arg.startsWith("--")) continue;
    const [k, v] = arg.split("=");
    map.set(k, v ?? "");
  }

  const execute = raw.includes("--execute");
  const replace = raw.includes("--replace");
  const projectId = map.get("--project-id") || process.env.PROJECT_ID || DEFAULT_PROJECT_ID;
  const callerType = (map.get("--caller-type") || "system") as CallerType;
  const sourceDdId = map.get("--source-dd-id") || undefined;
  const targetDdId = map.get("--target-dd-id") || "";
  const callType = (map.get("--call-type") || "calls_async") as CallType;

  if (callerType !== "user" && callerType !== "system") {
    throw new Error("--caller-type は user または system を指定してください");
  }
  if (callType !== "calls_sync" && callType !== "calls_async") {
    throw new Error("--call-type は calls_sync または calls_async を指定してください");
  }
  if (!targetDdId) {
    throw new Error("--target-dd-id は必須です");
  }
  if (callerType === "system" && !sourceDdId) {
    throw new Error("--caller-type=system の場合、--source-dd-id は必須です");
  }

  return {
    execute,
    replace,
    projectId,
    callerType,
    sourceDdId,
    targetDdId,
    callType,
  };
};

const main = async () => {
  config({ path: ".env.local" });
  config();
  const args = parseArgs();
  const mode = args.execute ? "EXECUTE" : "DRY-RUN";

  const supabase = createClient(
    ensureEnv("NEXT_PUBLIC_SUPABASE_URL"),
    ensureEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );

  const desiredLinkType = args.callerType === "user" ? "called_by_user" : args.callType;
  const desiredSourceId = args.callerType === "user" ? "" : (args.sourceDdId as string);

  console.log(`==> mode: ${mode}`);
  console.log(`==> project: ${args.projectId}`);
  console.log(`==> target: ${args.targetDdId}`);
  console.log(`==> desired caller: ${args.callerType}:${desiredSourceId || "(empty)"} (${desiredLinkType})`);
  if (args.replace) {
    console.log("==> replace mode: target DDの既存callerリンクを全削除して再作成");
  }

  const { data: existingRows, error: listError } = await supabase
    .from("requirement_links")
    .select("id, source_type, source_id, target_type, target_id, link_type")
    .eq("project_id", args.projectId)
    .eq("target_type", "dd")
    .eq("target_id", args.targetDdId)
    .in("link_type", [...CALLER_LINK_TYPES]);

  if (listError) throw new Error(`既存リンク取得失敗: ${listError.message}`);

  const existing = existingRows ?? [];
  const alreadyExists = existing.some(
    (row) =>
      row.source_type === "dd" &&
      row.source_id === desiredSourceId &&
      row.target_type === "dd" &&
      row.target_id === args.targetDdId &&
      row.link_type === desiredLinkType
  );

  console.log(`==> existing caller links: ${existing.length}`);
  for (const row of existing) {
    console.log(
      `   - ${row.link_type}: ${row.source_type}:${row.source_id || "(empty)"} -> ${row.target_type}:${row.target_id}`
    );
  }

  if (!args.execute) {
    if (alreadyExists && !args.replace) {
      console.log("==> [dry-run] 既に期待リンクが存在するため変更なし");
      return;
    }
    console.log("==> [dry-run] 実行時は必要な更新を適用します");
    return;
  }

  if (args.replace && existing.length > 0) {
    const idsToDelete = existing.map((row) => row.id);
    const { error: deleteError } = await supabase
      .from("requirement_links")
      .delete()
      .in("id", idsToDelete);
    if (deleteError) throw new Error(`既存リンク削除失敗: ${deleteError.message}`);
    console.log(`==> deleted ${idsToDelete.length} link(s)`);
  }

  if (!alreadyExists || args.replace) {
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from("requirement_links").insert({
      project_id: args.projectId,
      source_type: "dd",
      source_id: desiredSourceId,
      target_type: "dd",
      target_id: args.targetDdId,
      link_type: desiredLinkType,
      suspect: false,
      created_at: now,
      updated_at: now,
    });
    if (insertError) throw new Error(`リンク作成失敗: ${insertError.message}`);
    console.log("==> inserted 1 link");
  } else {
    console.log("==> 既に期待リンクが存在するため変更なし");
  }

  const { data: verifyRows, error: verifyError } = await supabase
    .from("requirement_links")
    .select("source_id, target_id, link_type")
    .eq("project_id", args.projectId)
    .eq("target_type", "dd")
    .eq("target_id", args.targetDdId)
    .in("link_type", [...CALLER_LINK_TYPES])
    .order("created_at", { ascending: true });
  if (verifyError) throw new Error(`検証取得失敗: ${verifyError.message}`);

  console.log("==> verification:");
  for (const row of verifyRows ?? []) {
    console.log(`   - ${row.link_type}: ${row.source_id || "(empty)"} -> ${row.target_id}`);
  }
};

await main();
