import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextRequest } from "next/server";
import {
  registerSharedDataModuleMocks,
  sharedDataModuleMocks,
} from "./shared-data-module-mocks";

let currentProjectCookie: string | undefined = "project-1";

const listImpactScopesByChangeRequestIdMock =
  sharedDataModuleMocks.listImpactScopesByChangeRequestIdMock;

const listRequirementLinksBySourceIdsMock =
  sharedDataModuleMocks.listRequirementLinksBySourceIdsMock;
const listSuspectLinksMock = sharedDataModuleMocks.listSuspectLinksMock;

const listSystemFunctionsMock = sharedDataModuleMocks.listSystemFunctionsMock;
const listDesignDocumentsMock = sharedDataModuleMocks.listDesignDocumentsMock;

const listAcceptanceCriteriaBySystemRequirementIdsMock = mock(async () => ({
  data: [
    {
      id: "AC-1",
      systemRequirementId: "SR-1",
      description: "請求登録が成功する",
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "AC-2",
      systemRequirementId: "SR-2",
      description: "承認処理が成功する",
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const createInvestigationResultMock = mock(async () => ({
  data: { id: "inv-1" },
  error: null,
}));

const updateChangeRequestStatusMock = sharedDataModuleMocks.updateChangeRequestStatusMock;

const createDesignDecisionLogsMock = mock(async () => ({
  data: true,
  error: null,
}));

const getProjectByIdMock = mock(async () => ({
  data: { id: "project-1", githubUrl: null },
  error: null,
}));

const getProjectInvestigationSettingsMock = mock(async () => ({
  data: null,
  error: null,
}));

const analyzeRepositoryBottomUpImpactMock = mock(async () => ({
  repositoryUrl: null,
  error: "projects.github_url が未設定のため、コード依存（ボトムアップ）解析を実行できません",
  explorationMetadata: {
    totalFilesScanned: 0,
    totalDependenciesFound: 0,
    maxDepthReached: 0,
    truncated: false,
    truncationReason: null,
  },
  affectedFiles: [],
}));

let POST: (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => Promise<Response>;

beforeAll(async () => {
  mock.module("next/headers", () => ({
    cookies: async () => ({
      get: (name: string) =>
        name === "current-project-id" && currentProjectCookie
          ? { value: currentProjectCookie }
          : undefined,
    }),
  }));
  registerSharedDataModuleMocks();
  mock.module("@/lib/data/acceptance-criteria", () => ({
    listAcceptanceCriteriaBySystemRequirementIds: listAcceptanceCriteriaBySystemRequirementIdsMock,
  }));
  mock.module("@/lib/data/investigation-results", () => ({
    createInvestigationResult: createInvestigationResultMock,
  }));
  mock.module("@/lib/data/design-decision-logs", () => ({
    createDesignDecisionLogs: createDesignDecisionLogsMock,
  }));
  mock.module("@/lib/data/projects", () => ({
    getProjectById: getProjectByIdMock,
  }));
  mock.module("@/lib/data/project-settings", () => ({
    getProjectInvestigationSettings: getProjectInvestigationSettingsMock,
  }));
  mock.module("@/lib/analysis/dependency-analysis", () => ({
    analyzeRepositoryBottomUpImpact: analyzeRepositoryBottomUpImpactMock,
  }));

  const route = await import("@/app/api/tickets/[id]/investigate/route");
  POST = route.POST;
});

beforeEach(() => {
  currentProjectCookie = "project-1";
  listImpactScopesByChangeRequestIdMock.mockReset();
  listRequirementLinksBySourceIdsMock.mockReset();
  listSuspectLinksMock.mockReset();
  listSystemFunctionsMock.mockReset();
  listDesignDocumentsMock.mockReset();
  listAcceptanceCriteriaBySystemRequirementIdsMock.mockClear();
  createInvestigationResultMock.mockClear();
  updateChangeRequestStatusMock.mockReset();
  createDesignDecisionLogsMock.mockClear();
  getProjectByIdMock.mockClear();
  getProjectInvestigationSettingsMock.mockClear();
  analyzeRepositoryBottomUpImpactMock.mockClear();

  listImpactScopesByChangeRequestIdMock.mockResolvedValue({
    data: [
      {
        id: "scope-1",
        changeRequestId: "cr-1",
        targetType: "business_requirement",
        targetId: "BR-1",
        targetTitle: "請求関連を改善する",
        rationale: "",
        confirmed: false,
        confirmedBy: null,
        confirmedAt: null,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "scope-2",
        changeRequestId: "cr-1",
        targetType: "business_requirement",
        targetId: "BR-2",
        targetTitle: "承認フローを改善する",
        rationale: "",
        confirmed: false,
        confirmedBy: null,
        confirmedAt: null,
        createdAt: "",
        updatedAt: "",
      },
    ],
    error: null,
  });
  listRequirementLinksBySourceIdsMock.mockResolvedValue({
    data: [
      {
        id: "link-1",
        projectId: "project-1",
        sourceType: "br",
        sourceId: "BR-1",
        targetType: "sf",
        targetId: "SF-1",
        linkType: "realizes",
        metadata: null,
        suspect: false,
        suspectReason: null,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "link-2",
        projectId: "project-1",
        sourceType: "br",
        sourceId: "BR-2",
        targetType: "sf",
        targetId: "SF-2",
        linkType: "realizes",
        metadata: null,
        suspect: false,
        suspectReason: null,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "link-ignore",
        projectId: "project-1",
        sourceType: "br",
        sourceId: "BR-1",
        targetType: "sr",
        targetId: "SR-X",
        linkType: "derived_from",
        metadata: null,
        suspect: false,
        suspectReason: null,
        createdAt: "",
        updatedAt: "",
      },
    ],
    error: null,
  });
  listSuspectLinksMock.mockResolvedValue([]);
  updateChangeRequestStatusMock.mockResolvedValue({
    data: { id: "cr-1", status: "review" },
    error: null,
  });

  listSystemFunctionsMock.mockResolvedValue({
    data: [
      {
        id: "SF-1",
        systemDomainId: "SD-1",
        category: "api",
        title: "請求API",
        summary: "",
        designPolicy: "",
        status: "draft",
        relatedTaskIds: [],
        requirementIds: ["SR-1"],
        systemDesign: [],
        entryPoints: [],
        deliverables: [],
        codeRefs: [],
        sortOrder: 0,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "SF-2",
        systemDomainId: "SD-1",
        category: "batch",
        title: "承認バッチ",
        summary: "",
        designPolicy: "",
        status: "draft",
        relatedTaskIds: [],
        requirementIds: ["SR-2"],
        systemDesign: [],
        entryPoints: [],
        deliverables: [],
        codeRefs: [],
        sortOrder: 1,
        createdAt: "",
        updatedAt: "",
      },
    ],
    error: null,
  });

  listDesignDocumentsMock.mockResolvedValue({
    data: [
      {
        id: "DD-SF-1-001",
        srfId: "SF-1",
        projectId: "project-1",
        name: "請求登録",
        type: "api",
        summary: "",
        entryPoints: [
          { path: "src/api/invoice/create.ts", type: "api", responsibility: "請求登録" },
          { path: "src/shared/audit.ts", type: "function", responsibility: "監査" },
        ],
        designPolicy: "",
        details: {},
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "DD-SF-2-001",
        srfId: "SF-2",
        projectId: "project-1",
        name: "承認処理",
        type: "batch",
        summary: "",
        entryPoints: [
          { path: "src/batch/approval.ts", type: "batch", responsibility: "承認処理" },
          { path: "src/shared/audit.ts", type: "function", responsibility: "監査" },
        ],
        designPolicy: "",
        details: {},
        createdAt: "",
        updatedAt: "",
      },
    ],
    error: null,
  });
});

afterAll(() => {
  mock.restore();
});

const createRequest = () =>
  new Request("http://localhost/api/tickets/cr-1/investigate", {
    method: "POST",
  }) as NextRequest;

describe("POST /api/tickets/[id]/investigate", () => {
  it("影響範囲取得に失敗したら500を返す", async () => {
    listImpactScopesByChangeRequestIdMock.mockResolvedValueOnce({
      data: null,
      error: "scope failed",
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "影響範囲の取得に失敗しました",
    });
    expect(listRequirementLinksBySourceIdsMock).not.toHaveBeenCalled();
    expect(createInvestigationResultMock).not.toHaveBeenCalled();
    expect(updateChangeRequestStatusMock).not.toHaveBeenCalled();
  });

  it("BR→SFリンクを一括取得し、SF/DDをまとめて解析して保存する", async () => {
    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      success: boolean;
      investigationId: string;
      topDownResult: { affectedBRs: string[]; affectedSFs: string[]; affectedSRs: string[] };
    };

    expect(json.success).toBe(true);
    expect(json.investigationId).toBe("inv-1");
    expect(json.topDownResult.affectedBRs).toEqual(["BR-1", "BR-2"]);
    expect(json.topDownResult.affectedSFs).toEqual(expect.arrayContaining(["SF-1", "SF-2"]));
    expect(json.topDownResult.affectedSRs).toEqual(expect.arrayContaining(["SR-1", "SR-2"]));

    expect(listRequirementLinksBySourceIdsMock).toHaveBeenCalledTimes(1);
    expect(listRequirementLinksBySourceIdsMock).toHaveBeenCalledWith(
      "br",
      ["BR-1", "BR-2"],
      "project-1"
    );
    expect(listSystemFunctionsMock).toHaveBeenCalledTimes(1);
    expect(listDesignDocumentsMock).toHaveBeenCalledTimes(1);

    expect(analyzeRepositoryBottomUpImpactMock).toHaveBeenCalledTimes(1);
    const analyzeArg = analyzeRepositoryBottomUpImpactMock.mock.calls[0]?.[0] as {
      repositoryUrl: string | null;
      entryPoints: string[];
    };
    expect(analyzeArg.repositoryUrl).toBeNull();
    expect(analyzeArg.entryPoints).toEqual(
      expect.arrayContaining([
        "src/api/invoice/create.ts",
        "src/batch/approval.ts",
        "src/shared/audit.ts",
      ])
    );
    expect(new Set(analyzeArg.entryPoints).size).toBe(analyzeArg.entryPoints.length);

    expect(createInvestigationResultMock).toHaveBeenCalledTimes(1);
    const savedArg = createInvestigationResultMock.mock.calls[0]?.[0] as {
      topDownResult: { affectedEntryPoints: Array<{ sfId: string; path: string }> };
    };
    expect(savedArg.topDownResult.affectedEntryPoints.length).toBe(4);

    expect(createDesignDecisionLogsMock).toHaveBeenCalledTimes(1);
    expect(updateChangeRequestStatusMock).toHaveBeenCalledWith("cr-1", "review", "project-1");
  });

  it("BR-SFリンク取得に失敗したら500を返す", async () => {
    listRequirementLinksBySourceIdsMock.mockResolvedValueOnce({
      data: null,
      error: "db failed",
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "BR-SFリンクの取得に失敗しました",
    });
    expect(createInvestigationResultMock).not.toHaveBeenCalled();
    expect(updateChangeRequestStatusMock).not.toHaveBeenCalled();
  });

  it("調査結果保存に失敗したら500を返す", async () => {
    createInvestigationResultMock.mockResolvedValueOnce({
      data: null,
      error: "insert failed",
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "調査結果の保存に失敗しました",
    });
    expect(createDesignDecisionLogsMock).not.toHaveBeenCalled();
    expect(updateChangeRequestStatusMock).not.toHaveBeenCalled();
  });

  it("システム機能取得に失敗したら500を返す", async () => {
    listSystemFunctionsMock.mockResolvedValueOnce({
      data: null,
      error: "sf failed",
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "システム機能の取得に失敗しました",
    });
    expect(createInvestigationResultMock).not.toHaveBeenCalled();
    expect(updateChangeRequestStatusMock).not.toHaveBeenCalled();
  });

  it("設計書取得に失敗したら500を返す", async () => {
    listDesignDocumentsMock.mockResolvedValueOnce({
      data: null,
      error: "dd failed",
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "設計書の取得に失敗しました",
    });
    expect(createInvestigationResultMock).not.toHaveBeenCalled();
    expect(updateChangeRequestStatusMock).not.toHaveBeenCalled();
  });

  it("受入基準取得に失敗したら500を返す", async () => {
    listAcceptanceCriteriaBySystemRequirementIdsMock.mockResolvedValueOnce({
      data: null,
      error: "ac failed",
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "受入基準の取得に失敗しました",
    });
    expect(createInvestigationResultMock).not.toHaveBeenCalled();
    expect(updateChangeRequestStatusMock).not.toHaveBeenCalled();
  });

  it("対象IDに一致するsuspect linkを検出結果へ含める", async () => {
    listSuspectLinksMock.mockResolvedValueOnce([
      {
        id: "suspect-1",
        projectId: "project-1",
        sourceType: "br",
        sourceId: "BR-1",
        targetType: "sr",
        targetId: "SR-1",
        linkType: "derived_from",
        metadata: null,
        suspect: true,
        suspectReason: "manual-check",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "suspect-ignore",
        projectId: "project-1",
        sourceType: "br",
        sourceId: "BR-X",
        targetType: "sr",
        targetId: "SR-X",
        linkType: "derived_from",
        metadata: null,
        suspect: true,
        suspectReason: "out-of-scope",
        createdAt: "",
        updatedAt: "",
      },
    ]);

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      suspectLinksDetected: Array<{ id: string; suspectReason: string | null }>;
    };
    expect(json.suspectLinksDetected).toEqual([
      {
        id: "suspect-1",
        sourceType: "br",
        sourceId: "BR-1",
        targetType: "sr",
        targetId: "SR-1",
        linkType: "derived_from",
        suspectReason: "manual-check",
      },
    ]);

    const savedArg = createInvestigationResultMock.mock.calls[0]?.[0] as {
      suspectLinksDetected: Array<{ id: string }>;
    };
    expect(savedArg.suspectLinksDetected).toHaveLength(1);
    expect(savedArg.suspectLinksDetected[0]?.id).toBe("suspect-1");
  });
});
