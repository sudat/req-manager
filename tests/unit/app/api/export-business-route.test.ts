import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  registerSharedDataModuleMocks,
  sharedDataModuleMocks,
} from "./shared-data-module-mocks";

let currentProjectCookie: string | undefined = "project-1";

const listBusinessesMock = mock(async (_projectId: string) => ({
  data: [
    {
      id: "bd-1",
      area: "AR",
      name: "売上管理",
      description: "",
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const listTasksByBusinessAreaMock = sharedDataModuleMocks.listTasksByBusinessAreaMock;
const listBusinessRequirementsByTaskIdsMock =
  sharedDataModuleMocks.listBusinessRequirementsByTaskIdsMock;

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
  mock.module("@/lib/data/businesses", () => ({
    listBusinesses: listBusinessesMock,
  }));
  registerSharedDataModuleMocks();

  const route = await import("@/app/api/export/business/route");
  GET = route.GET;
});

beforeEach(() => {
  currentProjectCookie = "project-1";
  listBusinessesMock.mockClear();
  listTasksByBusinessAreaMock.mockReset();
  listBusinessRequirementsByTaskIdsMock.mockReset();

  listTasksByBusinessAreaMock.mockResolvedValue({
    data: [
      {
        id: "BT-AR-0001",
        name: "請求書発行",
        summary: "請求書を作る",
        businessArea: "AR",
        triggerDescription: "",
        triggerTaskIds: [],
        frequency: "monthly",
        frequencyDescription: "",
        processSteps: [],
        person: "",
        input: null,
        output: null,
        conceptIds: [],
        concepts: [],
        businessReqCount: 0,
        systemReqCount: 0,
        sortOrder: 0,
        createdAt: "",
        updatedAt: "",
      },
    ],
    error: null,
  });
  listBusinessRequirementsByTaskIdsMock.mockResolvedValue({
    data: [
      {
        id: "BR-AR-0001-0001",
        taskId: "BT-AR-0001",
        title: "請求書を出力できる",
        summary: "",
        goal: "",
        constraints: "",
        owner: "",
        conceptIds: [],
        srfIds: [],
        impacts: [],
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

describe("GET /api/export/business", () => {
  it("cookieの current-project-id をデータ層に渡す", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(listBusinessesMock).toHaveBeenCalledWith("project-1");
    expect(listTasksByBusinessAreaMock).toHaveBeenCalledWith("AR", "project-1");
    expect(listBusinessRequirementsByTaskIdsMock).toHaveBeenCalledWith(["BT-AR-0001"], "project-1");
  });

  it("cookieが無い場合はデフォルトプロジェクトを使う", async () => {
    currentProjectCookie = undefined;
    const response = await GET();
    expect(response.status).toBe(200);
    expect(listBusinessesMock).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000001");
  });
});
