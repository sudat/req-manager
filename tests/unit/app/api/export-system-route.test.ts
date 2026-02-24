import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  registerSharedDataModuleMocks,
  sharedDataModuleMocks,
} from "./shared-data-module-mocks";

let currentProjectCookie: string | undefined = "project-1";

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

const listSystemFunctionsByDomainMock = sharedDataModuleMocks.listSystemFunctionsByDomainMock;
const listSystemRequirementsBySrfIdMock = sharedDataModuleMocks.listSystemRequirementsBySrfIdMock;

let GET: () => Promise<Response>;

beforeAll(async () => {
  mock.module("next/headers", () => ({
    cookies: async () => ({
      get: (name: string) => {
        if (name !== "current-project-id") return undefined;
        return currentProjectCookie ? { value: currentProjectCookie } : undefined;
      },
    }),
  }));
  mock.module("@/lib/data/system-domains", () => ({
    listSystemDomains: listSystemDomainsMock,
  }));
  registerSharedDataModuleMocks();

  const route = await import("@/app/api/export/system/route");
  GET = route.GET;
});

beforeEach(() => {
  currentProjectCookie = "project-1";
  listSystemDomainsMock.mockClear();
  listSystemFunctionsByDomainMock.mockReset();
  listSystemRequirementsBySrfIdMock.mockReset();

  listSystemFunctionsByDomainMock.mockResolvedValue({
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
  });

  listSystemRequirementsBySrfIdMock.mockResolvedValue({
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
  });
});

afterEach(() => {
  // 他テストへの mock.module リークに備えて、cookie状態をデフォルトに戻す
  currentProjectCookie = "project-1";
});

afterAll(() => {
  mock.restore();
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
