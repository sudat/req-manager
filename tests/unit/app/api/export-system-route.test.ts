import { afterEach, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

let currentProjectCookie: string | undefined = "project-1";

mock.module("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name !== "current-project-id") return undefined;
      return currentProjectCookie ? { value: currentProjectCookie } : undefined;
    },
  }),
}));

const listSystemDomainsMock = mock(async (_projectId?: string) => ({
  data: [
    {
      id: "SD-AR-0001",
      name: "請求",
      description: "",
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const listSystemFunctionsByDomainMock = mock(async (_systemDomainId: string, _projectId?: string) => ({
  data: [
    {
      id: "SF-AR-0001",
      systemDomainId: "SD-AR-0001",
      category: "interface",
      title: "請求管理API",
      summary: "請求書を発行する",
      designPolicy: "",
      status: "draft",
      requirementIds: [],
      requirementDetails: [],
      codeRefs: [],
      entryPoints: [],
      deliverables: [],
      tasksYaml: "",
      systemDesign: [],
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const listSystemRequirementsBySrfIdMock = mock(async (_srfId: string, _projectId?: string) => ({
  data: [
    {
      id: "SR-AR-0001-0001",
      systemFunctionId: "SF-AR-0001",
      type: "function",
      category: "api",
      title: "請求書を発行できる",
      summary: "",
      priority: "medium",
      acceptanceCriteriaJson: [],
      acceptanceCriteria: [],
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

mock.module("@/lib/data/system-domains", () => ({
  listSystemDomains: listSystemDomainsMock,
}));

mock.module("@/lib/data/system-functions", () => ({
  listSystemFunctionsByDomain: listSystemFunctionsByDomainMock,
}));

mock.module("@/lib/data/system-requirements", () => ({
  listSystemRequirementsBySrfId: listSystemRequirementsBySrfIdMock,
}));

let GET: () => Promise<Response>;

beforeAll(async () => {
  const route = await import("@/app/api/export/system/route");
  GET = route.GET;
});

beforeEach(() => {
  currentProjectCookie = "project-1";
  listSystemDomainsMock.mockClear();
  listSystemFunctionsByDomainMock.mockClear();
  listSystemRequirementsBySrfIdMock.mockClear();
});

afterEach(() => {
  // 他テストへの mock.module リークに備えて、cookie状態をデフォルトに戻す
  currentProjectCookie = "project-1";
});

describe("GET /api/export/system", () => {
  it("cookieの current-project-id をデータ層に渡す", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(listSystemDomainsMock).toHaveBeenCalledWith("project-1");
    expect(listSystemFunctionsByDomainMock).toHaveBeenCalledWith("SD-AR-0001", "project-1");
    expect(listSystemRequirementsBySrfIdMock).toHaveBeenCalledWith("SF-AR-0001", "project-1");
  });

  it("cookieが無い場合はデフォルトプロジェクトを使う", async () => {
    currentProjectCookie = undefined;
    const response = await GET();
    expect(response.status).toBe(200);
    expect(listSystemDomainsMock).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000001");
  });
});
