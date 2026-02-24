import path from "node:path";
import type { ProjectInvestigationSettings } from "@/lib/domain";
import type { InvestigationResult, ModificationPackage } from "@/lib/domain/value-objects";

type AffectedFile = NonNullable<InvestigationResult["bottomUpResult"]>["affectedFiles"][number];

export function decideAllowPathsFromAffectedFiles(args: {
  affectedFiles: AffectedFile[];
  settings: ProjectInvestigationSettings;
}): {
  allowPaths: string[];
  excludedFromScope: NonNullable<ModificationPackage["excludedFromScope"]>;
  residualRisks: NonNullable<ModificationPackage["residualRisks"]>;
  sharedModuleCount: number;
} {
  const rule = args.settings.allow_paths_rule;
  const baseRule = rule.base_rule;
  const sharedRule = rule.shared_module_rule;
  const safety = rule.safety_limits;

  const excludedFromScope: NonNullable<ModificationPackage["excludedFromScope"]> = [];
  const residualRisks: NonNullable<ModificationPackage["residualRisks"]> = [];

  // Base filtering
  const candidates: AffectedFile[] = [];
  let sharedModuleCount = 0;

  for (const file of args.affectedFiles) {
    const isDirect = file.impactType === "direct";
    const isShared = !!file.sharedModule;

    if (isDirect && !baseRule.include_direct_impacts) {
      excludedFromScope.push({
        filePath: file.filePath,
        exclusionReason: "base_rule: direct impacts excluded",
        excludedBy: "auto_rule",
      });
      continue;
    }
    if (!isDirect && !baseRule.include_indirect_impacts) {
      excludedFromScope.push({
        filePath: file.filePath,
        exclusionReason: "base_rule: indirect impacts excluded",
        excludedBy: "auto_rule",
      });
      continue;
    }
    if (file.depth > baseRule.max_depth) {
      excludedFromScope.push({
        filePath: file.filePath,
        exclusionReason: `base_rule: depth ${file.depth} > max_depth ${baseRule.max_depth}`,
        excludedBy: "auto_rule",
      });
      continue;
    }
    if (file.confidence < baseRule.confidence_threshold) {
      excludedFromScope.push({
        filePath: file.filePath,
        exclusionReason: `base_rule: confidence ${file.confidence.toFixed(2)} < threshold ${baseRule.confidence_threshold}`,
        excludedBy: "auto_rule",
      });
      continue;
    }

    if (isShared) {
      if (!sharedRule.auto_include) {
        excludedFromScope.push({
          filePath: file.filePath,
          exclusionReason: "shared_module_rule: auto_include is false",
          excludedBy: "auto_rule",
        });
        continue;
      }
      sharedModuleCount += 1;
    }

    candidates.push(file);
  }

  // Deterministic ordering (safe + stable)
  candidates.sort((a, b) => {
    if (a.impactType !== b.impactType) return a.impactType === "direct" ? -1 : 1;
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.filePath.localeCompare(b.filePath);
  });

  let allowFiles = candidates;

  // Safety: max_total_files
  if (allowFiles.length > safety.max_total_files) {
    const originalCount = allowFiles.length;
    allowFiles = allowFiles.slice(0, safety.max_total_files);
    residualRisks.push({
      riskType: "allow_paths_truncated",
      description: `allow_paths候補が多すぎるため、${originalCount}件 -> ${safety.max_total_files}件に絞り込みました`,
      severity: safety.escalate_if_exceeds ? "high" : "medium",
      mitigation: "影響範囲を絞る（BR選択の見直し/entry_pointの精査）または影響範囲レビュー（AI/人手）を実施してください",
    });

    for (const file of candidates.slice(safety.max_total_files)) {
      excludedFromScope.push({
        filePath: file.filePath,
        exclusionReason: `safety_limits: max_total_files ${safety.max_total_files} exceeded`,
        excludedBy: "auto_rule",
      });
    }
  }

  const allowPaths = Array.from(new Set(allowFiles.map((f) => f.filePath)));

  // Safety: max_directories (best-effort warning, no auto-compression yet)
  const directories = new Set(allowPaths.map((p) => path.posix.dirname(p)));
  if (directories.size > safety.max_directories) {
    residualRisks.push({
      riskType: "allow_paths_too_many_directories",
      description: `allow_pathsのディレクトリ数が上限を超えています: ${directories.size} > ${safety.max_directories}`,
      severity: safety.escalate_if_exceeds ? "high" : "medium",
      mitigation: "影響範囲レビューでディレクトリ数を抑えるか、shared_module_patterns / 閾値設定を調整してください",
    });
  }

  // Shared module warnings
  if (sharedRule.notify_on_include && sharedModuleCount > 0) {
    residualRisks.push({
      riskType: "shared_module_included",
      description: `共通処理（shared module）に該当するファイルを allow_paths に含めました: ${sharedModuleCount}件`,
      severity: "medium",
      mitigation: "共通処理の変更は副作用が大きくなりやすいので、変更理由と影響範囲をレビューしてください",
    });
  }

  if (sharedModuleCount > sharedRule.require_confirmation_if_count_exceeds) {
    residualRisks.push({
      riskType: "shared_module_exceeds_threshold",
      description: `共通処理（shared module）が多すぎます: ${sharedModuleCount} > ${sharedRule.require_confirmation_if_count_exceeds}`,
      severity: "high",
      mitigation: "shared module の必要性を精査し、必要なら影響範囲レビュー（AI/人手）を実施してください",
    });
  }

  return { allowPaths, excludedFromScope, residualRisks, sharedModuleCount };
}

