/**
 * 7章形式エクスポート生成ロジック
 *
 * PRD 7.2〜7.7の仕様に従い、各ファイルを生成する。
 * 戻り値は Map<relativePath, content> で、呼び出し側がZIPにまとめる。
 */

import { listBusinessRequirements } from "@/lib/data/business-requirements";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listSystemRequirements } from "@/lib/data/system-requirements";
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
export async function generateRequirementsExport(projectId: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();

  // 全データ取得
  const [
    prResult,
    brResult,
    sfResult,
    srResult,
    ddResult,
    conceptResult,
    linkResult,
  ] = await Promise.all([
    getProductRequirementByProjectId(projectId),
    listBusinessRequirements(projectId),
    listSystemFunctions(projectId),
    listSystemRequirements(projectId),
    listDesignDocuments(projectId),
    listConcepts(projectId),
    listRequirementLinksByProjectId(projectId),
  ]);

  const brs = brResult.data ?? [];
  const sfs = sfResult.data ?? [];
  const srs = srResult.data ?? [];
  const concepts = conceptResult.data ?? [];
  const links = linkResult.data ?? [];

  // ── business/ グループing ──
  // BRからタスクIDを収集し、業務領域別にグループ化
  // BRのタスクIDは "BT-{AREA}-{NNNN}" 形式から AREA を抽出
  const taskAreaMap = new Map<string, string>(); // taskId → area
  const taskBrMap = new Map<string, typeof brs>(); // taskId → BR[]
  for (const br of brs) {
    const parts = br.taskId?.split("-");
    const area = parts && parts.length >= 2 ? parts[1] : "UNKNOWN";
    taskAreaMap.set(br.taskId, area);
    const list = taskBrMap.get(br.taskId) ?? [];
    list.push(br);
    taskBrMap.set(br.taskId, list);
  }

  // 業務領域ごとのタスク一覧
  const areaTasksMap = new Map<string, string[]>(); // area → taskId[]
  for (const [taskId, area] of taskAreaMap) {
    const list = areaTasksMap.get(area) ?? [];
    if (!list.includes(taskId)) list.push(taskId);
    areaTasksMap.set(area, list);
  }

  const businessAreas = Array.from(areaTasksMap.keys()).sort();

  for (const area of businessAreas) {
    const taskIds = areaTasksMap.get(area) ?? [];
    // _index.md
    const tasksForIndex = taskIds.map((taskId) => {
      const firstBr = (taskBrMap.get(taskId) ?? [])[0];
      return { id: taskId, name: firstBr?.title ?? taskId, summary: firstBr?.goal ?? "" };
    });
    files.set(`business/${area}/_index.md`, generateBusinessIndex(area, tasksForIndex));

    // 各BT .md
    for (const taskId of taskIds) {
      const brsByTask = taskBrMap.get(taskId) ?? [];
      const task = { id: taskId, name: brsByTask[0]?.title ?? taskId, summary: brsByTask[0]?.goal ?? "" };
      files.set(
        `business/${area}/${taskId}.md`,
        generateBusinessTaskMd(task, brsByTask.map((br) => ({ id: br.id, title: br.title, goal: br.goal })))
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

  const systemDomainIds = Array.from(sdSfMap.keys()).sort();

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
    // _index.md
    files.set(
      `system/${sdId}/_index.md`,
      generateSystemIndex(sdId, sfsInDomain.map((sf) => ({ id: sf.id, title: sf.title, summary: sf.summary })))
    );

    // 各SF .md
    for (const sf of sfsInDomain) {
      const srsForSf = sfSrMap.get(sf.id) ?? [];
      // entry_points: deliverables から収集（あなたの新構造）
      const entryPoints = sf.entryPoints ?? [];
      files.set(
        `system/${sdId}/${sf.id}.md`,
        generateSystemFunctionMd(
          { id: sf.id, title: sf.title, summary: sf.summary, entryPoints },
          srsForSf.map((sr) => ({ id: sr.id, title: sr.title, summary: sr.summary, acceptanceCriteria: sr.acceptanceCriteria }))
        )
      );
    }
  }

  // ── その他ファイル ──
  // INDEX.md
  files.set("INDEX.md", generateIndex(businessAreas, systemDomainIds));

  // product-requirement.yml
  if (prResult.data) {
    files.set("product-requirement.yml", generateProductRequirementYaml(prResult.data));
  }

  // concept-dictionary.yml
  files.set(
    "concept-dictionary.yml",
    generateConceptDictionaryYaml(concepts.map((c) => ({ id: c.id, name: c.name, definition: c.definition, synonyms: c.synonyms, areas: c.areas })))
  );

  // graph/requirements-links.json
  files.set("graph/requirements-links.json", generateLinksJson(links));

  // VERSION.md
  files.set("VERSION.md", generateVersionMd());

  return files;
}
