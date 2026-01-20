import { renderToString } from "react-dom/server";
import type { AcceptanceCriterionJson } from "../lib/data/structured";
import { HealthScoreCard } from "../components/health-score/health-score-card";
import { buildHealthScoreSummary } from "../lib/health-score";

const buildCriteria = (description: string): AcceptanceCriterionJson[] => [
  {
    id: "AC-001",
    description,
    verification_method: null,
  },
];

const summary = buildHealthScoreSummary({
  businessRequirements: [
    {
      id: "BR-001",
      title: "請求書発行を行う",
      summary: "請求書を発行する",
      conceptIds: [],
      impacts: [],
      relatedSystemRequirementIds: [],
      acceptanceCriteriaJson: buildCriteria("使いやすいこと"),
    },
  ],
  systemRequirements: [
    {
      id: "SR-001",
      title: "請求書PDFを出力する",
      summary: "PDF生成を行う",
      conceptIds: [],
      impacts: [],
      businessRequirementIds: [],
      categoryRaw: null,
      acceptanceCriteriaJson: buildCriteria("PDFが出力されること"),
    },
  ],
  systemFunctions: [
    {
      id: "SRF-001",
      title: "請求書出力",
      entryPoints: [],
    },
    {
      id: "SRF-002",
      title: "請求書保存",
      entryPoints: [],
    },
  ],
  concepts: [],
});

if (!summary.issues.some((issue) => issue.id === "acceptance_criteria_lint_warning")) {
  throw new Error("Lint警告が検出されていません。");
}

if (!summary.warnings.some((warning) => warning.id === "entry_point_coverage_low")) {
  throw new Error("低スコア警告（エントリポイント不足）が検出されていません。");
}

const html = renderToString(
  <HealthScoreCard summary={summary} title="ヘルススコア" />
);

if (!html.includes("ヘルススコア")) {
  throw new Error("ヘルススコアのレンダリングに失敗しました。");
}

console.log("Health score smoke ok:", summary.score);
