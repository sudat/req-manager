import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextRequest } from "next/server";

const getProductRequirementByProjectIdMock = mock(async () => ({
  data: {
    id: "PR-001",
    projectId: "project-1",
    targetUsers: "経理担当",
    experienceGoals: "高速",
    qualityGoals: "安定",
    designSystem: "shadcn",
    uxGuidelines: "簡潔",
    techStackProfile: "{}",
    codingConventions: null,
    forbiddenChoices: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  error: null,
}));

const listTasksMock = mock(async () => ({
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
      processSteps: "",
      person: "",
      input: "",
      output: "",
      conceptIdsYaml: "",
      concepts: [],
      businessReqCount: 0,
      systemReqCount: 0,
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const getTaskByIdMock = mock(async () => ({
  data: {
    id: "BT-AR-0001",
    name: "請求書発行",
    summary: "請求書を作る",
    businessArea: "AR",
    triggerDescription: "",
    triggerTaskIds: [],
    frequency: "monthly",
    frequencyDescription: "",
    processSteps: "",
    person: "",
    input: "",
    output: "",
    conceptIdsYaml: "",
    concepts: [],
    businessReqCount: 0,
    systemReqCount: 0,
    sortOrder: 0,
    createdAt: "",
    updatedAt: "",
  },
  error: null,
}));

const listBusinessRequirementsMock = mock(async () => ({
  data: [
    {
      id: "BR-AR-0001-001",
      taskId: "BT-AR-0001",
      title: "請求書を出力できる",
      summary: "PDFで出力",
      goal: "PDF出力",
      constraints: "",
      owner: "",
      conceptIds: [],
      srfIds: ["SF-AR-0001"],
      impacts: [],
      acceptanceCriteriaJson: [],
      acceptanceCriteria: [],
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const listBusinessRequirementsByTaskIdMock = mock(async () => ({
  data: [
    {
      id: "BR-AR-0001-001",
      taskId: "BT-AR-0001",
      title: "請求書を出力できる",
      summary: "PDFで出力",
      goal: "PDF出力",
      constraints: "",
      owner: "",
      conceptIds: [],
      srfIds: ["SF-AR-0001"],
      impacts: [],
      acceptanceCriteriaJson: [],
      acceptanceCriteria: [],
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const listBusinessRequirementsByIdsMock = mock(async () => ({
  data: [
    {
      id: "BR-AR-0001-001",
      taskId: "BT-AR-0001",
      title: "請求書を出力できる",
      summary: "PDFで出力",
      goal: "PDF出力",
      constraints: "",
      owner: "",
      conceptIds: [],
      srfIds: ["SF-AR-0001"],
      impacts: [],
      acceptanceCriteriaJson: [],
      acceptanceCriteria: [],
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const getSystemFunctionByIdMock = mock(async () => ({
  data: {
    id: "SF-AR-0001",
    systemDomainId: "SD-AR",
    category: "api",
    title: "請求管理API",
    summary: "請求を扱う",
    designPolicy: "",
    status: "draft",
    relatedTaskIds: ["BT-AR-0001"],
    requirementIds: ["SR-AR-0001-001"],
    systemDesign: [],
    entryPoints: [{ path: "src/api/invoice.ts", type: "api", responsibility: "請求" }],
    deliverables: [],
    codeRefs: [],
    sortOrder: 0,
    createdAt: "",
    updatedAt: "",
  },
  error: null,
}));

const listSystemFunctionsMock = mock(async () => ({
  data: [
    {
      id: "SF-AR-0001",
      systemDomainId: "SD-AR",
      category: "api",
      title: "請求管理API",
      summary: "請求を扱う",
      designPolicy: "",
      status: "draft",
      relatedTaskIds: ["BT-AR-0001"],
      requirementIds: ["SR-AR-0001-001"],
      systemDesign: [],
      entryPoints: [{ path: "src/api/invoice.ts", type: "api", responsibility: "請求" }],
      deliverables: [],
      codeRefs: [],
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const listSystemRequirementsMock = mock(async () => ({
  data: [
    {
      id: "SR-AR-0001-001",
      taskId: "BT-AR-0001",
      srfIds: ["SF-AR-0001"],
      title: "登録番号を出力する",
      summary: "インボイス対応",
      conceptIds: [],
      impacts: [],
      category: "function",
      categoryRaw: "function",
      businessRequirementIds: ["BR-AR-0001-001"],
      acceptanceCriteriaJson: [],
      acceptanceCriteria: [],
      systemDomainIds: ["SD-AR"],
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const listSystemRequirementsByIdsMock = mock(async () => ({
  data: [
    {
      id: "SR-AR-0001-001",
      taskId: "BT-AR-0001",
      srfIds: ["SF-AR-0001"],
      title: "登録番号を出力する",
      summary: "インボイス対応",
      conceptIds: [],
      impacts: [],
      category: "function",
      categoryRaw: "function",
      businessRequirementIds: ["BR-AR-0001-001"],
      acceptanceCriteriaJson: [],
      acceptanceCriteria: [],
      systemDomainIds: ["SD-AR"],
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

mock.module("@/lib/data/product-requirements", () => ({
  getProductRequirementByProjectId: getProductRequirementByProjectIdMock,
}));

mock.module("@/lib/data/tasks", () => ({
  listTasks: listTasksMock,
  getTaskById: getTaskByIdMock,
}));

mock.module("@/lib/data/business-requirements", () => ({
  listBusinessRequirements: listBusinessRequirementsMock,
  listBusinessRequirementsByTaskId: listBusinessRequirementsByTaskIdMock,
  listBusinessRequirementsByIds: listBusinessRequirementsByIdsMock,
}));

mock.module("@/lib/data/system-functions", () => ({
  getSystemFunctionById: getSystemFunctionByIdMock,
  listSystemFunctions: listSystemFunctionsMock,
}));

mock.module("@/lib/data/system-requirements", () => ({
  listSystemRequirements: listSystemRequirementsMock,
  listSystemRequirementsByIds: listSystemRequirementsByIdsMock,
}));

let GET: () => Promise<Response>;
let POST: (request: NextRequest) => Promise<Response>;

beforeAll(async () => {
  const route = await import("@/app/api/mcp/route");
  GET = route.GET;
  POST = route.POST;
});

beforeEach(() => {
  getProductRequirementByProjectIdMock.mockClear();
  listTasksMock.mockClear();
  getTaskByIdMock.mockClear();
  listBusinessRequirementsMock.mockClear();
  listBusinessRequirementsByTaskIdMock.mockClear();
  listBusinessRequirementsByIdsMock.mockClear();
  getSystemFunctionByIdMock.mockClear();
  listSystemFunctionsMock.mockClear();
  listSystemRequirementsMock.mockClear();
  listSystemRequirementsByIdsMock.mockClear();
});

const createRequest = (body: unknown, headers?: Record<string, string>) =>
  new Request("http://localhost/api/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(headers ?? {}),
    },
    body: JSON.stringify(body),
  }) as NextRequest;

describe("/api/mcp", () => {
  it("GET でツール一覧を返す", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.server).toBe("req-manager-mcp");
    expect(Array.isArray(json.tools)).toBe(true);
    expect(json.tools.length).toBe(4);
  });

  it("simple call: project_id ヘッダがない場合は 401", async () => {
    const response = await POST(
      createRequest({ tool: "get_product_requirement", args: {} })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "project_id header is required",
      },
    });
  });

  it("simple call: get_product_requirement が成功する", async () => {
    const response = await POST(
      createRequest(
        { tool: "get_product_requirement", args: {} },
        { project_id: "project-1" }
      )
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.result.id).toBe("PR-001");
    expect(getProductRequirementByProjectIdMock).toHaveBeenCalledWith("project-1");
  });

  it("json-rpc: tools/list が成功する", async () => {
    const response = await POST(
      createRequest({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.jsonrpc).toBe("2.0");
    expect(json.id).toBe(1);
    expect(Array.isArray(json.result.tools)).toBe(true);
    expect(json.result.tools.length).toBe(4);
  });

  it("json-rpc: tools/call search_requirements が成功する", async () => {
    const response = await POST(
      createRequest(
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "search_requirements",
            arguments: {
              query: "請求",
              types: ["bt"],
            },
          },
        },
        { project_id: "project-1" }
      )
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.jsonrpc).toBe("2.0");
    expect(json.id).toBe(2);
    expect(json.result.content[0].json.count).toBe(1);
  });

  it("json-rpc: tools/call でID未検出時はエラーを返す", async () => {
    listBusinessRequirementsByIdsMock.mockResolvedValueOnce({ data: [], error: null });

    const response = await POST(
      createRequest(
        {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "get_requirement",
            arguments: {
              id: "BR-AR-9999-999",
            },
          },
        },
        { project_id: "project-1" }
      )
    );

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error.message).toBe("requirement not found");
  });
});
