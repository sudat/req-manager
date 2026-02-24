import { DEFAULT_PROJECT_ID } from "@/lib/constants/project";

export type Baseline = {
  projectId: string;
  version: string;
  summary: string;
  date: string; // YYYY-MM-DD
  changeRequestIds: string[];
  isLatest: boolean;
};

// NOTE: MVPのためハードコード。将来的にはDBへ移行する想定。
// - projectIdごとに分離する（別プロジェクトへ切替えても混ざらない）
const baselineByProject: Record<string, Baseline[]> = {
  // Default project (reserved UUID). Users may rename it, but ID is stable.
  [DEFAULT_PROJECT_ID]: [
    {
      projectId: DEFAULT_PROJECT_ID,
      version: "v1.2",
      summary: "インボイス制度対応（MVP）",
      date: "2026-01-05",
      changeRequestIds: [],
      isLatest: true,
    },
    {
      projectId: DEFAULT_PROJECT_ID,
      version: "v1.1",
      summary: "疑義リンク運用の導入とUI改善",
      date: "2025-12-15",
      changeRequestIds: [],
      isLatest: false,
    },
    {
      projectId: DEFAULT_PROJECT_ID,
      version: "v1.0",
      summary: "初期セットアップ（要件階層とCR運用の導入）",
      date: "2025-11-01",
      changeRequestIds: [],
      isLatest: false,
    },
  ],
};

export const listBaselinesByProject = (projectId: string): Baseline[] =>
  baselineByProject[projectId] ?? [];

export const getBaselineByVersion = (
  projectId: string,
  version: string
): Baseline | undefined =>
  listBaselinesByProject(projectId).find((b) => b.version === version);

export const getLatestBaseline = (projectId: string): Baseline | undefined =>
  listBaselinesByProject(projectId).find((b) => b.isLatest);
