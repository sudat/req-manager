/**
 * 7章形式エクスポート生成ロジック
 *
 * PRD 7.2〜7.7の仕様に従い、各ファイルを生成する。
 * 戻り値は Map<relativePath, content> で、呼び出し側がZIPにまとめる。
 */

import { listBusinessRequirements } from "@/lib/data/business-requirements";
import { listBusinesses } from "@/lib/data/businesses";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listSystemDomains } from "@/lib/data/system-domains";
import { listSystemRequirements } from "@/lib/data/system-requirements";
import { listTasks } from "@/lib/data/tasks";
import { listDesignDocuments } from "@/lib/data/design-documents";
import { listConcepts } from "@/lib/data/concepts";
import { getProductRequirementByProjectId } from "@/lib/data/product-requirements";
import { listRequirementLinksByProjectId } from "@/lib/data/requirement-links";

// ────────────────────────────────────────
// ヘルパー
// ────────────────────────────────────────

/** YAML安全エスケープ（シンプル版：引用符で囲む） */
const yamlStr = (value: string | null | undefined): string => {
  const s = value ?? "";
  if (s.includes("\n") || s.includes(":") || s.includes("#")) {
    return `|\n${s.split("\n").map((line) => `  ${line}`).join("\n")}`;
  }
  return `"${s.replace(/"/g, '\\"')}"`;
};

/** 配列→YAML リスト */
const yamlList = (items: string[]): string =>
  items.length === 0 ? "[]" : items.map((i) => `  - ${yamlStr(i)}`).join("\n");

// ────────────────────────────────────────
// INDEX.md（ルーティング表）
// ────────────────────────────────────────
function generateIndex(businessAreas: string[], systemDomainIds: string[]): string {
  const lines = [
    "# Requirements Export - INDEX",
    "",
    "生成日: " + new Date().toISOString(),
    "",
    "## ファイル構造",
    "",
    "| パス | 説明 |",
    "|------|------|",
    "| `INDEX.md` | このファイル（ルーティング表） |",
    "| `product-requirement.yml` | プロダクト要件 |",
    "| `concept-dictionary.yml` | 概念辞書 |",
    "| `graph/requirements-links.json` | 要件リンクグラフ |",
    "| `VERSION.md` | バージョン情報 |",
  ];

  for (const area of businessAreas) {
    lines.push(`| \`business/${area}/_index.md\` | 業務領域 ${area} インデックス |`);
    lines.push(`| \`business/${area}/*.md\` | 業務タスク + 業務要件 |`);
  }
  for (const sdId of systemDomainIds) {
    lines.push(`| \`system/${sdId}/_index.md\` | システム領域 ${sdId} インデックス |`);
    lines.push(`| \`system/${sdId}/*.md\` | システム機能 + システム要件 |`);
  }

  return lines.join("\n") + "\n";
}

// ────────────────────────────────────────
// product-requirement.yml
// ────────────────────────────────────────
function generateProductRequirementYaml(pr: {
  targetUsers: string;
  experienceGoals: string;
  qualityGoals: string;
  designSystem: string;
  uxGuidelines: string;
  techStackProfile: string;
  codingConventions: string | null;
  forbiddenChoices: string | null;
}): string {
  return [
    "# プロダクト要件",
    `target_users: ${yamlStr(pr.targetUsers)}`,
    `experience_goals: ${yamlStr(pr.experienceGoals)}`,
    `quality_goals: ${yamlStr(pr.qualityGoals)}`,
    `design_system: ${yamlStr(pr.designSystem)}`,
    `ux_guidelines: ${yamlStr(pr.uxGuidelines)}`,
    `tech_stack_profile: ${yamlStr(pr.techStackProfile)}`,
    `coding_conventions: ${yamlStr(pr.codingConventions)}`,
    `forbidden_choices: ${yamlStr(pr.forbiddenChoices)}`,
    "",
  ].join("\n");
}

// ────────────────────────────────────────
// concept-dictionary.yml
// ────────────────────────────────────────
function generateConceptDictionaryYaml(concepts: Array<{ id: string; name: string; definition: string; synonyms: string[]; areas: string[] }>): string {
  const lines = ["# 概念辞書", "concepts:"];
  for (const c of concepts) {
    lines.push(`  - id: ${c.id}`);
    lines.push(`    name: ${yamlStr(c.name)}`);
    lines.push(`    definition: ${yamlStr(c.definition)}`);
    lines.push(`    synonyms:`);
    if (c.synonyms.length === 0) {
      lines.push(`      []`);
    } else {
      c.synonyms.forEach((s) => lines.push(`      - ${yamlStr(s)}`));
    }
    lines.push(`    areas:`);
    if (c.areas.length === 0) {
      lines.push(`      []`);
    } else {
      c.areas.forEach((a) => lines.push(`      - ${a}`));
    }
  }
  return lines.join("\n") + "\n";
}

// ────────────────────────────────────────
// business/{bdArea}/_index.md
// ────────────────────────────────────────
function generateBusinessIndex(area: string, tasks: Array<{ id: string; name: string; summary: string }>): string {
  const lines = [
    `# 業務領域: ${area}`,
    "",
    "| BT ID | 業務タスク名 | 概要 |",
    "|-------|-------------|------|",
  ];
  for (const t of tasks) {
    lines.push(`| ${t.id} | ${t.name} | ${t.summary} |`);
  }
  return lines.join("\n") + "\n";
}

// ────────────────────────────────────────
// business/{bdArea}/{btId}.md
// ────────────────────────────────────────
function generateBusinessTaskMd(task: { id: string; name: string; summary: string }, brs: Array<{ id: string; title: string; goal: string }>): string {
  const lines = [
    `# ${task.name}`,
    "",
    `**BT ID**: ${task.id}`,
    "",
    `## 概要`,
    "",
    task.summary,
    "",
    `## 業務要件`,
    "",
    "| BR ID | タイトル | ゴール |",
    "|-------|---------|--------|",
  ];
  for (const br of brs) {
    lines.push(`| ${br.id} | ${br.title} | ${br.goal} |`);
  }
  return lines.join("\n") + "\n";
}

// ────────────────────────────────────────
// system/{sdId}/_index.md
// ────────────────────────────────────────
function generateSystemIndex(sdId: string, sfs: Array<{ id: string; title: string; summary: string }>): string {
  const lines = [
    `# システム領域: ${sdId}`,
    "",
    "| SF ID | 機能名 | 説明 |",
    "|-------|--------|------|",
  ];
  for (const sf of sfs) {
    lines.push(`| ${sf.id} | ${sf.title} | ${sf.summary} |`);
  }
  return lines.join("\n") + "\n";
}

// ────────────────────────────────────────
// system/{sdId}/{sfId}.md
// ────────────────────────────────────────
function generateSystemFunctionMd(
  sf: { id: string; title: string; summary: string; entryPoints?: Array<{ path: string; type: string | null; responsibility: string | null }> },
  srs: Array<{ id: string; title: string; summary: string; acceptanceCriteria: string[] }>
): string {
  const lines = [
    `# ${sf.title}`,
    "",
    `**SF ID**: ${sf.id}`,
    "",
    `## 説明`,
    "",
    sf.summary,
  ];

  // Entry Points
  if (sf.entryPoints && sf.entryPoints.length > 0) {
    lines.push("", `## エントリポイント`, "");
    lines.push("| パス | タイプ | 責任 |");
    lines.push("|------|--------|------|");
    for (const ep of sf.entryPoints) {
      lines.push(`| ${ep.path} | ${ep.type ?? "-"} | ${ep.responsibility ?? "-"} |`);
    }
  }

  // システム要件
  lines.push("", `## システム要件`, "");
  lines.push("| SR ID | タイトル | 概要 |");
  lines.push("|-------|---------|------|");
  for (const sr of srs) {
    lines.push(`| ${sr.id} | ${sr.title} | ${sr.summary} |`);
  }

  return lines.join("\n") + "\n";
}

// ────────────────────────────────────────
// graph/requirements-links.json
// ────────────────────────────────────────
function generateLinksJson(links: Array<{
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  linkType: string;
  suspect: boolean;
  suspectReason: string | null;
}>): string {
  const edges = links.map((l) => ({
    id: l.id,
    source: { type: l.sourceType, id: l.sourceId },
    target: { type: l.targetType, id: l.targetId },
    linkType: l.linkType,
    suspect: l.suspect,
    suspectReason: l.suspectReason,
  }));
  return JSON.stringify({ edges }, null, 2);
}

// ────────────────────────────────────────
// VERSION.md
// ────────────────────────────────────────
function generateVersionMd(): string {
  return [
    "# バージョン情報",
    "",
    `生成日時: ${new Date().toISOString()}`,
    `エクスポート形式: 7章形式 v1.0`,
    "",
  ].join("\n");
}

// ────────────────────────────────────────
// メインエクスポート関数
// ────────────────────────────────────────
export type RequirementsExportData = {
  productRequirement: {
    targetUsers: string;
    experienceGoals: string;
    qualityGoals: string;
    designSystem: string;
    uxGuidelines: string;
    techStackProfile: string;
    codingConventions: string | null;
    forbiddenChoices: string | null;
  } | null;
  businesses: Array<{ area: string; sortOrder?: number | null }>;
  tasks: Array<{
    id: string;
    name: string;
    summary: string;
    businessArea?: string | null;
    sortOrder?: number | null;
  }>;
  businessRequirements: Array<{ id: string; taskId: string; title: string; goal: string }>;
  systemDomains: Array<{ id: string; sortOrder?: number | null }>;
  systemFunctions: Array<{
    id: string;
    systemDomainId?: string | null;
    title: string;
    summary: string;
    sortOrder?: number | null;
    entryPoints?: Array<{ path: string; type: string | null; responsibility: string | null }>;
  }>;
  systemRequirements: Array<{
    id: string;
    title: string;
    summary: string;
    acceptanceCriteria: string[];
    srfIds?: string[] | null;
  }>;
  concepts: Array<{ id: string; name: string; definition: string; synonyms: string[]; areas: string[] }>;
  links: Array<{
    id: string;
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    linkType: string;
    suspect: boolean;
    suspectReason: string | null;
  }>;
};

export function buildRequirementsExportFiles(data: RequirementsExportData): Map<string, string> {
  const files = new Map<string, string>();

  const {
    productRequirement,
    businesses,
    tasks,
    businessRequirements: brs,
    systemDomains,
    systemFunctions: sfs,
    systemRequirements: srs,
    concepts,
    links,
  } = data;

  // ── business/ グループing ──
  // BTを正として業務領域別にグループ化し、BT名/概要を推測しない
  const taskBrMap = new Map<string, typeof brs>(); // taskId → BR[]
  for (const br of brs) {
    const list = taskBrMap.get(br.taskId) ?? [];
    list.push(br);
    taskBrMap.set(br.taskId, list);
  }

  const tasksByArea = new Map<string, typeof tasks>(); // area → BT[]
  for (const task of tasks) {
    const area = task.businessArea?.trim() || "UNKNOWN";
    const list = tasksByArea.get(area) ?? [];
    list.push(task);
    tasksByArea.set(area, list);
  }

  const businessOrder = new Map(businesses.map((b) => [b.area, b.sortOrder] as const));
  const businessAreaSet = new Set<string>([
    ...businesses.map((b) => b.area),
    ...Array.from(tasksByArea.keys()),
  ]);
  const businessAreas = Array.from(businessAreaSet).sort((a, b) => {
    const orderA = businessOrder.get(a) ?? Number.POSITIVE_INFINITY;
    const orderB = businessOrder.get(b) ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });

  for (const area of businessAreas) {
    const tasksInArea = tasksByArea.get(area) ?? [];
    tasksInArea.sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id.localeCompare(b.id)
    );

    // _index.md
    const tasksForIndex = tasksInArea.map((task) => ({
      id: task.id,
      name: task.name,
      summary: task.summary,
    }));
    files.set(`business/${area}/_index.md`, generateBusinessIndex(area, tasksForIndex));

    // 各BT .md
    for (const task of tasksInArea) {
      const brsByTask = taskBrMap.get(task.id) ?? [];
      files.set(
        `business/${area}/${task.id}.md`,
        generateBusinessTaskMd(
          { id: task.id, name: task.name, summary: task.summary },
          brsByTask.map((br) => ({ id: br.id, title: br.title, goal: br.goal }))
        )
      );
    }
  }

  // ── system/ グループing ──
  const sdSfMap = new Map<string, typeof sfs>(); // sdId → SF[]
  for (const sf of sfs) {
    const sdId = sf.systemDomainId ?? "UNKNOWN";
    const list = sdSfMap.get(sdId) ?? [];
    list.push(sf);
    sdSfMap.set(sdId, list);
  }

  const domainOrder = new Map(systemDomains.map((d) => [d.id, d.sortOrder] as const));
  const systemDomainIdSet = new Set<string>([
    ...systemDomains.map((d) => d.id),
    ...Array.from(sdSfMap.keys()),
  ]);
  const systemDomainIds = Array.from(systemDomainIdSet).sort((a, b) => {
    const orderA = domainOrder.get(a) ?? Number.POSITIVE_INFINITY;
    const orderB = domainOrder.get(b) ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });

  // SRをSFIDで引けるようにMAP
  const sfSrMap = new Map<string, typeof srs>(); // sfId → SR[]
  for (const sr of srs) {
    for (const sfId of sr.srfIds ?? []) {
      const list = sfSrMap.get(sfId) ?? [];
      list.push(sr);
      sfSrMap.set(sfId, list);
    }
  }

  for (const sdId of systemDomainIds) {
    const sfsInDomain = sdSfMap.get(sdId) ?? [];
    sfsInDomain.sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id.localeCompare(b.id)
    );

    // _index.md
    files.set(
      `system/${sdId}/_index.md`,
      generateSystemIndex(
        sdId,
        sfsInDomain.map((sf) => ({ id: sf.id, title: sf.title, summary: sf.summary }))
      )
    );

    // 各SF .md
    for (const sf of sfsInDomain) {
      const srsForSf = sfSrMap.get(sf.id) ?? [];
      const entryPoints = sf.entryPoints ?? [];
      files.set(
        `system/${sdId}/${sf.id}.md`,
        generateSystemFunctionMd(
          { id: sf.id, title: sf.title, summary: sf.summary, entryPoints },
          srsForSf.map((sr) => ({
            id: sr.id,
            title: sr.title,
            summary: sr.summary,
            acceptanceCriteria: sr.acceptanceCriteria,
          }))
        )
      );
    }
  }

  // ── その他ファイル ──
  files.set("INDEX.md", generateIndex(businessAreas, systemDomainIds));

  if (productRequirement) {
    files.set("product-requirement.yml", generateProductRequirementYaml(productRequirement));
  }

  files.set(
    "concept-dictionary.yml",
    generateConceptDictionaryYaml(
      concepts.map((c) => ({
        id: c.id,
        name: c.name,
        definition: c.definition,
        synonyms: c.synonyms,
        areas: c.areas,
      }))
    )
  );

  files.set("graph/requirements-links.json", generateLinksJson(links));
  files.set("VERSION.md", generateVersionMd());

  return files;
}

export async function generateRequirementsExport(projectId: string): Promise<Map<string, string>> {
  const [
    prResult,
    bdResult,
    btResult,
    brResult,
    sdResult,
    sfResult,
    srResult,
    _ddResult,
    conceptResult,
    linkResult,
  ] = await Promise.all([
    getProductRequirementByProjectId(projectId),
    listBusinesses(projectId),
    listTasks(projectId),
    listBusinessRequirements(projectId),
    listSystemDomains(projectId),
    listSystemFunctions(projectId),
    listSystemRequirements(projectId),
    listDesignDocuments(projectId),
    listConcepts(projectId),
    listRequirementLinksByProjectId(projectId),
  ]);

  return buildRequirementsExportFiles({
    productRequirement: prResult.data ?? null,
    businesses: bdResult.data ?? [],
    tasks: btResult.data ?? [],
    businessRequirements: brResult.data ?? [],
    systemDomains: sdResult.data ?? [],
    systemFunctions: sfResult.data ?? [],
    systemRequirements: srResult.data ?? [],
    concepts: conceptResult.data ?? [],
    links: linkResult.data ?? [],
  });
}
