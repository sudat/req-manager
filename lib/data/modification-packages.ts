import type { ModificationPackage } from "@/lib/domain/value-objects";
import { getChangeRequestById } from "@/lib/data/change-requests";
import { getInvestigationResultByChangeRequestId } from "@/lib/data/investigation-results";
import { listBusinessRequirementsByIds } from "@/lib/data/business-requirements";
import { listSystemRequirementsByIds } from "@/lib/data/system-requirements";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listDesignDocumentsBySrfId } from "@/lib/data/design-documents";
import { listAcceptanceConfirmationsByChangeRequestId } from "@/lib/data/acceptance-confirmations";
import { listSuspectLinks } from "@/lib/data/requirement-links";
import { getProductRequirementByProjectId } from "@/lib/data/product-requirements";
import { getProjectById } from "@/lib/data/projects";

const unique = <T>(items: T[]): T[] => Array.from(new Set(items));

const compactTextLines = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[-*]\s+/, ""));
};

const toMarkdownList = (items: string[]): string =>
  items.length === 0 ? "- なし" : items.map((item) => `- ${item}`).join("\n");

export const buildModificationPackage = async (
  changeRequestId: string,
  projectId: string
): Promise<{ data: ModificationPackage | null; error: string | null }> => {
  const { data: changeRequest, error: crError } = await getChangeRequestById(changeRequestId, projectId);
  if (crError || !changeRequest) {
    return { data: null, error: "変更要求の取得に失敗しました" };
  }
  if (changeRequest.status === "open") {
    return { data: null, error: "影響調査が未完了です。先に調査を実行してください" };
  }

  const { data: investigationResult, error: investigationError } =
    await getInvestigationResultByChangeRequestId(changeRequestId, projectId);
  if (investigationError || !investigationResult) {
    return { data: null, error: "影響調査結果が見つかりません" };
  }

  const relatedRequirementIds = new Set<string>([
    ...investigationResult.topDownResult.affectedBRs,
    ...investigationResult.topDownResult.affectedSFs,
    ...investigationResult.topDownResult.affectedSRs,
    ...investigationResult.topDownResult.affectedACs,
  ]);

  const currentSuspects = await listSuspectLinks(projectId);
  const unresolvedSuspects = currentSuspects.filter(
    (link) => relatedRequirementIds.has(link.sourceId) || relatedRequirementIds.has(link.targetId)
  );
  if (unresolvedSuspects.length > 0) {
    return { data: null, error: "疑義リンクが未解消のため改修指示パッケージを生成できません" };
  }

  const [projectResult, prResult, brResult, srResult, sfResult, acResult] = await Promise.all([
    getProjectById(projectId),
    getProductRequirementByProjectId(projectId),
    listBusinessRequirementsByIds(investigationResult.topDownResult.affectedBRs, projectId),
    listSystemRequirementsByIds(investigationResult.topDownResult.affectedSRs, projectId),
    listSystemFunctions(projectId),
    listAcceptanceConfirmationsByChangeRequestId(changeRequestId),
  ]);

  const affectedSystemFunctions = (sfResult.data ?? []).filter((sf) =>
    investigationResult.topDownResult.affectedSFs.includes(sf.id)
  );

  const designDocumentLists = await Promise.all(
    affectedSystemFunctions.map((sf) => listDesignDocumentsBySrfId(sf.id, projectId))
  );
  const designDocuments = designDocumentLists.flatMap((result) => result.data ?? []);

  const affectedEntryPoints = unique(
    investigationResult.topDownResult.affectedEntryPoints.map((entryPoint) => entryPoint.path)
  );

  const fallbackEntryPoints = unique(
    designDocuments.flatMap((document) => document.entryPoints.map((entryPoint) => entryPoint.path))
  );

  const allowPaths = affectedEntryPoints.length > 0 ? affectedEntryPoints : fallbackEntryPoints;
  const acceptanceCriteriaIds = unique((acResult.data ?? []).map((item) => item.acceptanceCriterionId));

  const implementationUnits: ModificationPackage["implementationUnits"] = designDocuments.map((document) => ({
    ddId: document.id,
    type: document.type,
    name: document.name,
    entryPoint: document.entryPoints[0]?.path ?? "",
    designDetails: document.details,
  }));

  const ddByEntryPoint = new Map<string, typeof designDocuments[number]>();
  for (const document of designDocuments) {
    for (const entryPoint of document.entryPoints) {
      ddByEntryPoint.set(entryPoint.path, document);
    }
  }

  const targets: ModificationPackage["targets"] = allowPaths.map((entryPointPath) => {
    const dd = ddByEntryPoint.get(entryPointPath);
    const relatedRequirements = dd
      ? unique(
          (srResult.data ?? [])
            .filter((requirement) => requirement.srfIds.includes(dd.srfId))
            .map((requirement) => requirement.id)
        )
      : investigationResult.topDownResult.affectedSRs;

    return {
      ddId: dd?.id ?? "N/A",
      entryPoint: entryPointPath,
      description: dd?.summary || changeRequest.description || changeRequest.title,
      relatedRequirements,
    };
  });

  const prohibitionCandidates = [
    ...(prResult.data ? compactTextLines(prResult.data.forbiddenChoices) : []),
    "allow_pathsに含まれないファイルは変更しない",
  ];

  const residualRisks: ModificationPackage["residualRisks"] = [];
  if (allowPaths.length === 0) {
    residualRisks.push({
      riskType: "missing_allow_paths",
      description: "entry_pointが特定できずallow_pathsが空です",
      severity: "high",
      mitigation: "影響調査結果のentry_pointを見直してください",
    });
  }

  const taskId = `task-${changeRequest.id}`;
  const packageData: ModificationPackage = {
    taskId,
    crId: changeRequest.id,
    projectId,
    repositoryUrl: projectResult.data?.githubUrl ?? "",
    baseBranch: "main",
    execution: {
      workingBranch: `agent/${taskId}`,
      allowPaths,
      maxRuntimeSec: 1800,
      idempotencyKey: taskId,
    },
    productRequirement: prResult.data
      ? {
          targetUsers: prResult.data.targetUsers,
          experienceGoals: prResult.data.experienceGoals,
          qualityGoals: prResult.data.qualityGoals,
          designSystem: prResult.data.designSystem,
          uxGuidelines: prResult.data.uxGuidelines,
          techStackProfile: prResult.data.techStackProfile,
          codingConventions: prResult.data.codingConventions,
          forbiddenChoices: prResult.data.forbiddenChoices,
        }
      : null,
    businessTask: brResult.data?.[0]?.taskId ?? changeRequest.ticketId,
    businessRequirements: unique((brResult.data ?? []).map((item) => item.id)),
    systemFunctions: unique(affectedSystemFunctions.map((item) => item.id)),
    systemRequirements: unique((srResult.data ?? []).map((item) => item.id)),
    acceptanceCriteria: acceptanceCriteriaIds,
    investigationRefs: {
      investigationId: investigationResult.id,
      investigationResultSummary: [
        `BR:${investigationResult.topDownResult.affectedBRs.length}`,
        `SF:${investigationResult.topDownResult.affectedSFs.length}`,
        `SR:${investigationResult.topDownResult.affectedSRs.length}`,
        `AC:${investigationResult.topDownResult.affectedACs.length}`,
      ].join(", "),
    },
    implementationUnits,
    modificationSummary: changeRequest.title,
    modificationDetails: [
      changeRequest.description ?? "",
      changeRequest.background ?? "",
      changeRequest.expectedBenefit ?? "",
    ]
      .filter((value) => value.length > 0)
      .join("\n\n"),
    targets,
    constraints: [
      "受入基準を満たすこと",
      "影響調査結果に含まれる要件と整合すること",
    ],
    prohibitions: unique(prohibitionCandidates),
    codingGuidelines: prResult.data?.codingConventions ?? "",
    testCommands: ["bunx tsc --noEmit"],
    residualRisks,
  };

  return { data: packageData, error: null };
};

export const renderModificationPackageMarkdown = (pkg: ModificationPackage): string => {
  const lines = [
    "# 改修指示パッケージ",
    "",
    "## メタ情報",
    `- task_id: ${pkg.taskId}`,
    `- cr_id: ${pkg.crId}`,
    `- project_id: ${pkg.projectId}`,
    `- repository_url: ${pkg.repositoryUrl || "(未設定)"}`,
    `- base_branch: ${pkg.baseBranch}`,
    `- working_branch: ${pkg.execution.workingBranch}`,
    "",
    "## allow_paths",
    toMarkdownList(pkg.execution.allowPaths),
    "",
    "## 参照要件ID",
    "- 業務要件",
    toMarkdownList(pkg.businessRequirements),
    "- システム機能",
    toMarkdownList(pkg.systemFunctions),
    "- システム要件",
    toMarkdownList(pkg.systemRequirements),
    "- 受入基準",
    toMarkdownList(pkg.acceptanceCriteria),
    "",
    "## 改修内容",
    `- summary: ${pkg.modificationSummary}`,
    "- details:",
    pkg.modificationDetails || "(未設定)",
    "",
    "## targets",
    ...pkg.targets.flatMap((target, index) => [
      `### ${index + 1}. ${target.entryPoint}`,
      `- dd_id: ${target.ddId}`,
      `- description: ${target.description}`,
      "- related_requirements:",
      toMarkdownList(target.relatedRequirements),
      "",
    ]),
    "## constraints",
    toMarkdownList(pkg.constraints),
    "",
    "## prohibitions",
    toMarkdownList(pkg.prohibitions),
    "",
    "## test_commands",
    toMarkdownList(pkg.testCommands),
    "",
    "## residual_risks",
    pkg.residualRisks && pkg.residualRisks.length > 0
      ? pkg.residualRisks
          .map(
            (risk) =>
              `- [${risk.severity}] ${risk.riskType}: ${risk.description} (mitigation: ${risk.mitigation})`
          )
          .join("\n")
      : "- なし",
    "",
  ];

  return lines.join("\n");
};
