import { describe, expect, it } from "vitest";
import { decideAllowPathsFromAffectedFiles } from "@/lib/analysis/allow-paths-decision";
import type { ProjectInvestigationSettings } from "@/lib/domain";

const baseSettings: ProjectInvestigationSettings = {
  exploration: {
    default_max_depth: 5,
    default_include_patterns: [],
    default_exclude_patterns: [],
  },
  allow_paths_rule: {
    base_rule: {
      include_direct_impacts: true,
      include_indirect_impacts: true,
      confidence_threshold: 0.3,
      max_depth: 5,
    },
    shared_module_rule: {
      auto_include: true,
      notify_on_include: true,
      require_confirmation_if_count_exceeds: 10,
    },
    safety_limits: {
      max_total_files: 50,
      max_directories: 10,
      escalate_if_exceeds: true,
    },
  },
  impact_review: {
    auto_trigger_threshold: 50,
    default_aggressiveness: "moderate",
    require_human_confirmation: true,
  },
  shared_module_patterns: [],
};

describe("decideAllowPathsFromAffectedFiles", () => {
  it("max_total_files を超えたら上位だけを採用し、残存リスクと除外理由を残す", () => {
    const settings: ProjectInvestigationSettings = {
      ...baseSettings,
      allow_paths_rule: {
        ...baseSettings.allow_paths_rule,
        safety_limits: { ...baseSettings.allow_paths_rule.safety_limits, max_total_files: 2 },
      },
    };

    const affectedFiles = [
      {
        filePath: "src/entry.ts",
        impactType: "direct",
        depth: 0,
        confidence: 1.0,
        changeLikelihood: "high",
        reason: "entry_point",
        dependencyChain: ["src/entry.ts"],
        dependencyType: "import",
      },
      {
        filePath: "src/b.ts",
        impactType: "indirect",
        depth: 1,
        confidence: 0.8,
        changeLikelihood: "medium",
        reason: "import",
        dependencyChain: ["src/entry.ts", "src/b.ts"],
        dependencyType: "import",
      },
      {
        filePath: "src/c.ts",
        impactType: "indirect",
        depth: 1,
        confidence: 0.7,
        changeLikelihood: "medium",
        reason: "import",
        dependencyChain: ["src/entry.ts", "src/c.ts"],
        dependencyType: "import",
      },
    ] as const;

    const result = decideAllowPathsFromAffectedFiles({ affectedFiles: [...affectedFiles], settings });

    expect(result.allowPaths).toEqual(["src/entry.ts", "src/b.ts"]);
    expect(result.residualRisks.some((r) => r.riskType === "allow_paths_truncated")).toBe(true);
    expect(result.excludedFromScope.some((e) => e.filePath === "src/c.ts")).toBe(true);
  });

  it("shared_module_rule.auto_include=false のとき sharedModule を除外する", () => {
    const settings: ProjectInvestigationSettings = {
      ...baseSettings,
      allow_paths_rule: {
        ...baseSettings.allow_paths_rule,
        shared_module_rule: {
          ...baseSettings.allow_paths_rule.shared_module_rule,
          auto_include: false,
        },
      },
    };

    const affectedFiles = [
      {
        filePath: "src/entry.ts",
        impactType: "direct",
        depth: 0,
        confidence: 1.0,
        changeLikelihood: "high",
        reason: "entry_point",
        dependencyChain: ["src/entry.ts"],
        dependencyType: "import",
      },
      {
        filePath: "src/shared/util.ts",
        impactType: "indirect",
        depth: 1,
        confidence: 0.9,
        changeLikelihood: "medium",
        reason: "import",
        dependencyChain: ["src/entry.ts", "src/shared/util.ts"],
        dependencyType: "import",
        sharedModule: true,
      },
    ] as const;

    const result = decideAllowPathsFromAffectedFiles({ affectedFiles: [...affectedFiles], settings });

    expect(result.allowPaths).toEqual(["src/entry.ts"]);
    expect(result.excludedFromScope.some((e) => e.filePath === "src/shared/util.ts")).toBe(true);
  });

  it("max_directories を超えると residual_risks に警告を積む", () => {
    const settings: ProjectInvestigationSettings = {
      ...baseSettings,
      allow_paths_rule: {
        ...baseSettings.allow_paths_rule,
        safety_limits: { ...baseSettings.allow_paths_rule.safety_limits, max_directories: 1 },
      },
    };

    const affectedFiles = [
      {
        filePath: "src/entry.ts",
        impactType: "direct",
        depth: 0,
        confidence: 1.0,
        changeLikelihood: "high",
        reason: "entry_point",
        dependencyChain: ["src/entry.ts"],
        dependencyType: "import",
      },
      {
        filePath: "lib/x.ts",
        impactType: "indirect",
        depth: 1,
        confidence: 0.9,
        changeLikelihood: "medium",
        reason: "import",
        dependencyChain: ["src/entry.ts", "lib/x.ts"],
        dependencyType: "import",
      },
    ] as const;

    const result = decideAllowPathsFromAffectedFiles({ affectedFiles: [...affectedFiles], settings });

    expect(result.allowPaths).toEqual(["src/entry.ts", "lib/x.ts"]);
    expect(result.residualRisks.some((r) => r.riskType === "allow_paths_too_many_directories")).toBe(true);
  });
});

