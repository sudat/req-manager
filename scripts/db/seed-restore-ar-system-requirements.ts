#!/usr/bin/env -S bun run
/**
 * AR領域のシステム要件サンプルデータ復旧スクリプト
 *
 * 目的:
 * - AR領域の system_requirements が欠損した際に、既存データと関連データを元に復旧する
 * - 対象IDは system_functions.requirement_ids と requirement_links(sr -> br) から収集する
 *
 * Usage:
 *   bun scripts/db/seed-restore-ar-system-requirements.ts
 *   bun scripts/db/seed-restore-ar-system-requirements.ts --execute
 *   bun scripts/db/seed-restore-ar-system-requirements.ts --execute --replace
 *   bun scripts/db/seed-restore-ar-system-requirements.ts --execute --project-id=xxxx
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

type CliArgs = {
  execute: boolean;
  replace: boolean;
  projectId: string;
};

type SystemFunctionRow = {
  id: string;
  title: string;
  related_task_ids: string[] | null;
  requirement_ids: string[] | null;
};

type SystemRequirementRow = {
  id: string;
  task_id: string;
  srf_ids: string[] | null;
  title: string;
  summary: string;
  concept_ids: string[] | null;
  impacts: string[] | null;
  category: string | null;
  acceptance_criteria_json: unknown[] | null;
  acceptance_criteria: string[] | null;
  system_domain_ids: string[] | null;
  sort_order: number | null;
  created_at: string;
};

type DesignDocumentRow = {
  id: string;
  srf_id: string;
  name: string;
};

type RequirementLinkRow = {
  source_id: string;
};

type SystemRequirementPayload = {
  id: string;
  project_id: string;
  task_id: string;
  srf_ids: string[];
  title: string;
  summary: string;
  concept_ids: string[];
  impacts: string[];
  category: string;
  acceptance_criteria_json: unknown[];
  acceptance_criteria: string[];
  system_domain_ids: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001";
const SR_ID_PATTERN = /^SR-AR-(\d{4})-(\d{4})$/;

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);
  const projectIdArg = args.find((arg) => arg.startsWith("--project-id="));
  const projectId = projectIdArg ? projectIdArg.split("=")[1] : process.env.PROJECT_ID ?? DEFAULT_PROJECT_ID;

  return {
    execute: args.includes("--execute"),
    replace: args.includes("--replace"),
    projectId,
  };
};

const ensureEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const parseSrfIdFromSrId = (srId: string): string | null => {
  const match = SR_ID_PATTERN.exec(srId);
  if (!match) return null;
  return `SF-AR-${match[1]}`;
};

const parseSortOrderFromSrId = (srId: string): number => {
  const match = SR_ID_PATTERN.exec(srId);
  if (!match) return 1;
  return Number.parseInt(match[2], 10);
};

const unique = <T>(values: T[]): T[] => {
  return [...new Set(values)];
};

const summarize = (text: string, limit = 80): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}...`;
};

const buildFallbackTitle = (sfTitle: string, sortOrder: number): string => {
  return `${sfTitle} 要件${String(sortOrder).padStart(2, "0")}`;
};

const buildFallbackSummary = (sfTitle: string, title: string): string => {
  return `${sfTitle}における「${title}」を実現するためのAR領域サンプルシステム要件。`;
};

const main = async () => {
  config({ path: ".env.local" });
  config();

  const { execute, replace, projectId } = parseArgs();
  const now = new Date().toISOString();

  const supabase = createClient(
    ensureEnv("NEXT_PUBLIC_SUPABASE_URL"),
    ensureEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  console.log("=".repeat(72));
  console.log("AR領域 システム要件サンプルデータ復旧");
  console.log("=".repeat(72));
  console.log(`mode: ${execute ? "EXECUTE" : "DRY-RUN"}`);
  console.log(`replace: ${replace}`);
  console.log(`project: ${projectId}`);

  const [
    { data: systemFunctions, error: sfError },
    { data: existingRequirements, error: srError },
    { data: designDocuments, error: ddError },
    { data: requirementLinks, error: linkError },
  ] = await Promise.all([
    supabase
      .from("system_functions")
      .select("id,title,related_task_ids,requirement_ids")
      .eq("project_id", projectId)
      .eq("system_domain_id", "AR")
      .order("id"),
    supabase
      .from("system_requirements")
      .select(
        "id,task_id,srf_ids,title,summary,concept_ids,impacts,category,acceptance_criteria_json,acceptance_criteria,system_domain_ids,sort_order,created_at"
      )
      .eq("project_id", projectId)
      .ilike("id", "SR-AR-%")
      .order("id"),
    supabase
      .from("design_documents")
      .select("id,srf_id,name")
      .eq("project_id", projectId)
      .ilike("srf_id", "SF-AR-%")
      .order("srf_id")
      .order("id"),
    supabase
      .from("requirement_links")
      .select("source_id")
      .eq("project_id", projectId)
      .eq("source_type", "sr")
      .eq("target_type", "br")
      .eq("link_type", "derived_from")
      .ilike("source_id", "SR-AR-%"),
  ]);

  if (sfError) throw new Error(`system_functions取得失敗: ${sfError.message}`);
  if (srError) throw new Error(`system_requirements取得失敗: ${srError.message}`);
  if (ddError) throw new Error(`design_documents取得失敗: ${ddError.message}`);
  if (linkError) throw new Error(`requirement_links取得失敗: ${linkError.message}`);

  const sfRows = (systemFunctions ?? []) as SystemFunctionRow[];
  const srRows = (existingRequirements ?? []) as SystemRequirementRow[];
  const ddRows = (designDocuments ?? []) as DesignDocumentRow[];
  const linkRows = (requirementLinks ?? []) as RequirementLinkRow[];

  const sfById = new Map(sfRows.map((row) => [row.id, row]));
  const existingById = new Map(srRows.map((row) => [row.id, row]));
  const ddNameMap = new Map<string, string[]>();

  for (const doc of ddRows) {
    const list = ddNameMap.get(doc.srf_id);
    if (list) {
      list.push(doc.name);
    } else {
      ddNameMap.set(doc.srf_id, [doc.name]);
    }
  }

  const candidateIds = new Set<string>();

  for (const sf of sfRows) {
    for (const requirementId of sf.requirement_ids ?? []) {
      if (SR_ID_PATTERN.test(requirementId)) {
        candidateIds.add(requirementId);
      }
    }
  }

  for (const link of linkRows) {
    if (SR_ID_PATTERN.test(link.source_id)) {
      candidateIds.add(link.source_id);
    }
  }

  if (replace) {
    for (const existing of srRows) {
      if (SR_ID_PATTERN.test(existing.id)) {
        candidateIds.add(existing.id);
      }
    }
  }

  const sortedCandidateIds = [...candidateIds].sort();
  const missingIds = sortedCandidateIds.filter((id) => !existingById.has(id));
  const updateTargetIds = replace ? sortedCandidateIds : missingIds;

  console.log(`\nAR SF count: ${sfRows.length}`);
  console.log(`AR SR existing count: ${srRows.length}`);
  console.log(`SR candidate ids: ${sortedCandidateIds.length}`);
  console.log(`SR missing ids: ${missingIds.length}`);
  console.log(`SR target ids (${replace ? "replace" : "insert-only"}): ${updateTargetIds.length}`);

  const payloads: SystemRequirementPayload[] = [];
  const skipped: string[] = [];

  for (const srId of updateTargetIds) {
    const srfId = parseSrfIdFromSrId(srId);
    if (!srfId) {
      skipped.push(`${srId} (SR ID形式外)`);
      continue;
    }

    const sf = sfById.get(srfId);
    if (!sf) {
      skipped.push(`${srId} (対応SFなし: ${srfId})`);
      continue;
    }

    const existing = existingById.get(srId);
    const sortOrder = existing?.sort_order ?? parseSortOrderFromSrId(srId);
    const taskId = existing?.task_id ?? sf.related_task_ids?.[0];

    if (!taskId) {
      skipped.push(`${srId} (task_idを決定できない)`);
      continue;
    }

    const ddTitles = ddNameMap.get(srfId) ?? [];
    const titleFromDd = ddTitles[sortOrder - 1] ?? ddTitles[0];
    const fallbackTitle = buildFallbackTitle(sf.title, sortOrder);
    const title = existing?.title?.trim() ? existing.title : (titleFromDd ?? fallbackTitle);
    const summary = existing?.summary?.trim()
      ? existing.summary
      : buildFallbackSummary(sf.title, title);

    payloads.push({
      id: srId,
      project_id: projectId,
      task_id: taskId,
      srf_ids: unique([...(existing?.srf_ids ?? []), srfId]),
      title,
      summary,
      concept_ids: existing?.concept_ids ?? [],
      impacts: existing?.impacts ?? (sf.title ? [sf.title] : []),
      category: existing?.category ?? "function",
      acceptance_criteria_json: existing?.acceptance_criteria_json ?? [],
      acceptance_criteria: existing?.acceptance_criteria ?? [],
      system_domain_ids: existing?.system_domain_ids ?? [],
      sort_order: sortOrder,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    });
  }

  console.log("\n登録対象（先頭20件）:");
  for (const item of payloads.slice(0, 20)) {
    const state = existingById.has(item.id) ? (replace ? "update" : "skip-existing") : "insert";
    console.log(
      `- [${state}] ${item.id} | srf=${item.srf_ids.join(",")} | task=${item.task_id} | title=${summarize(item.title, 40)}`
    );
  }
  if (payloads.length > 20) {
    console.log(`... and ${payloads.length - 20} more`);
  }

  if (skipped.length > 0) {
    console.log("\nスキップ対象:");
    for (const reason of skipped) {
      console.log(`- ${reason}`);
    }
  }

  if (!execute) {
    console.log("\n[dry-run] 実行する場合は --execute を付けてください。");
    return;
  }

  if (payloads.length === 0) {
    console.log("\n実行対象がないため終了します。");
    return;
  }

  if (replace) {
    const { error } = await supabase
      .from("system_requirements")
      .upsert(payloads, { onConflict: "project_id,id" });
    if (error) throw new Error(`upsert失敗: ${error.message}`);
    console.log(`\nupsert完了: ${payloads.length}件`);
  } else {
    const insertTargets = payloads.filter((payload) => !existingById.has(payload.id));
    if (insertTargets.length === 0) {
      console.log("\n挿入対象（不足分）は0件でした。");
    } else {
      const { error } = await supabase.from("system_requirements").insert(insertTargets);
      if (error) throw new Error(`insert失敗: ${error.message}`);
      console.log(`\ninsert完了: ${insertTargets.length}件`);
    }
  }

  const { data: verifyRows, error: verifyError } = await supabase
    .from("system_requirements")
    .select("id,srf_ids")
    .eq("project_id", projectId)
    .ilike("id", "SR-AR-%")
    .order("id");

  if (verifyError) throw new Error(`検証取得失敗: ${verifyError.message}`);

  const grouped = new Map<string, number>();
  for (const row of verifyRows ?? []) {
    for (const srfId of row.srf_ids ?? []) {
      if (!srfId.startsWith("SF-AR-")) continue;
      grouped.set(srfId, (grouped.get(srfId) ?? 0) + 1);
    }
  }

  console.log("\n検証結果:");
  console.log(`- AR SR total: ${(verifyRows ?? []).length}`);
  for (const sfId of [...sfById.keys()].sort()) {
    console.log(`- ${sfId}: ${grouped.get(sfId) ?? 0}`);
  }
};

await main().catch((error) => {
  console.error("\n❌ エラー:", error);
  process.exit(1);
});
