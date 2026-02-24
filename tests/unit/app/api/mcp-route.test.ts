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

const searchTasksMock = mock(async () => ({
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

const searchBusinessRequirementsMock = mock(async () => ({
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

const searchSystemFunctionsMock = mock(async () => ({
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

const searchSystemRequirementsMock = mock(async () => ({
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

const searchConceptsMock = mock(async () => ({
  data: [
    {
      id: "C-00001",
      name: "インボイス制度",
      synonyms: ["適格請求書"],
      areas: ["AR"],
      definition: "請求関連の制度",
      relatedDocs: [],
      requirementCount: 2,
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const listRequirementLinksByNodeIdMock = mock(async () => ({
  data: [
    {
      id: "link-1",
      projectId: "project-1",
      sourceType: "br",
      sourceId: "BR-AR-0001-001",
      targetType: "sr",
      targetId: "SR-AR-0001-001",
      linkType: "derived_from",
      metadata: null,
      suspect: false,
      suspectReason: null,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const getChangeRequestByIdMock = mock(async () => ({
  data: {
    id: "cr-1",
    ticketId: "CR-001",
    title: "インボイス対応",
    description: null,
    background: null,
    expectedBenefit: null,
    status: "review",
    priority: "high",
    requestedBy: null,
    createdAt: "",
    updatedAt: "",
  },
  error: null,
}));

const deleteImpactScopesByChangeRequestIdMock = mock(async () => ({
  data: true,
  error: null,
}));

const createImpactScopesMock = mock(async () => ({
  data: [
    {
      id: "scope-1",
      changeRequestId: "cr-1",
      targetType: "system_function",
      targetId: "SF-AR-0001",
      targetTitle: "請求管理API",
      rationale: "reason: 影響あり",
      confirmed: false,
      confirmedBy: null,
      confirmedAt: null,
      createdAt: "",
      updatedAt: "",
    },
  ],
  error: null,
}));

const createMcpAuditLogMock = mock(async () => ({
  data: true,
  error: null,
}));

mock.module("@/lib/data/product-requirements", () => ({
  getProductRequirementByProjectId: getProductRequirementByProjectIdMock,
}));

mock.module("@/lib/data/tasks", () => ({
  searchTasks: searchTasksMock,
  getTaskById: getTaskByIdMock,
}));

mock.module("@/lib/data/business-requirements", () => ({
  searchBusinessRequirements: searchBusinessRequirementsMock,
  listBusinessRequirementsByTaskId: listBusinessRequirementsByTaskIdMock,
  listBusinessRequirementsByIds: listBusinessRequirementsByIdsMock,
}));

mock.module("@/lib/data/system-functions", () => ({
  getSystemFunctionById: getSystemFunctionByIdMock,
  searchSystemFunctions: searchSystemFunctionsMock,
}));

mock.module("@/lib/data/system-requirements", () => ({
  searchSystemRequirements: searchSystemRequirementsMock,
  listSystemRequirementsByIds: listSystemRequirementsByIdsMock,
}));

mock.module("@/lib/data/concepts", () => ({
  searchConcepts: searchConceptsMock,
}));

mock.module("@/lib/data/requirement-links", () => ({
  listRequirementLinksByNodeId: listRequirementLinksByNodeIdMock,
}));

mock.module("@/lib/data/change-requests", () => ({
  getChangeRequestById: getChangeRequestByIdMock,
}));

mock.module("@/lib/data/impact-scopes", () => ({
  deleteImpactScopesByChangeRequestId: deleteImpactScopesByChangeRequestIdMock,
  createImpactScopes: createImpactScopesMock,
}));

mock.module("@/lib/data/mcp-audit-logs", () => ({
  createMcpAuditLog: createMcpAuditLogMock,
}));

let GET: () => Promise<Response>;
let POST: (request: NextRequest) => Promise<Response>;

beforeAll(async () => {
  const route = await import("@/app/api/mcp/route");
  GET = route.GET;
  POST = route.POST;
});

beforeEach(() => {
  process.env.MCP_GUARD_MODE = "observe";
  delete process.env.MCP_API_KEY;
  delete process.env.MCP_API_KEYS;
  delete process.env.MCP_RATE_LIMIT_WINDOW_MS;
  delete process.env.MCP_RATE_LIMIT_MAX_REQUESTS;

  getProductRequirementByProjectIdMock.mockClear();
  searchTasksMock.mockClear();
  getTaskByIdMock.mockClear();
  searchBusinessRequirementsMock.mockClear();
  listBusinessRequirementsByTaskIdMock.mockClear();
  listBusinessRequirementsByIdsMock.mockClear();
  getSystemFunctionByIdMock.mockClear();
  searchSystemFunctionsMock.mockClear();
  searchSystemRequirementsMock.mockClear();
  listSystemRequirementsByIdsMock.mockClear();
  searchConceptsMock.mockClear();
  listRequirementLinksByNodeIdMock.mockClear();
  getChangeRequestByIdMock.mockClear();
  deleteImpactScopesByChangeRequestIdMock.mockClear();
  createImpactScopesMock.mockClear();
  createMcpAuditLogMock.mockClear();
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
    expect(json.tools.length).toBe(7);
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
    expect(createMcpAuditLogMock).toHaveBeenCalled();
  });

  it("enforceモード: APIキーなしは401で拒否される", async () => {
    process.env.MCP_GUARD_MODE = "enforce";
    process.env.MCP_API_KEY = "secret-key";

    const response = await POST(
      createRequest(
        { tool: "get_product_requirement", args: {} },
        { project_id: "project-1" }
      )
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "AUTH_FAILED",
        message: "invalid or missing MCP API key",
      },
    });
  });

  it("enforceモード: APIキーありは通過する", async () => {
    process.env.MCP_GUARD_MODE = "enforce";
    process.env.MCP_API_KEY = "secret-key";

    const response = await POST(
      createRequest(
        { tool: "get_product_requirement", args: {} },
        { project_id: "project-1", "x-mcp-api-key": "secret-key" }
      )
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.result.id).toBe("PR-001");
  });

  it("enforceモード: レート制限超過で429になる", async () => {
    process.env.MCP_GUARD_MODE = "enforce";
    process.env.MCP_API_KEY = "secret-key";
    process.env.MCP_RATE_LIMIT_MAX_REQUESTS = "1";
    process.env.MCP_RATE_LIMIT_WINDOW_MS = "60000";

    const headers = {
      project_id: "project-rate-limit",
      "x-mcp-api-key": "secret-key",
      "x-forwarded-for": "10.0.0.1",
    };

    const first = await POST(
      createRequest({ tool: "get_product_requirement", args: {} }, headers)
    );
    expect(first.status).toBe(200);

    const second = await POST(
      createRequest({ tool: "get_product_requirement", args: {} }, headers)
    );
    expect(second.status).toBe(429);
    await expect(second.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "rate limit exceeded",
      },
    });
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
    expect(json.result.tools.length).toBe(7);
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

  it("json-rpc: tools/call search_concepts が成功する", async () => {
    const response = await POST(
      createRequest(
        {
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: {
            name: "search_concepts",
            arguments: {
              query: "インボイス",
            },
          },
        },
        { project_id: "project-1" }
      )
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.result.content[0].json.count).toBe(1);
    expect(json.result.content[0].json.concepts[0].id).toBe("C-00001");
  });

  it("json-rpc: tools/call get_links が成功する", async () => {
    const response = await POST(
      createRequest(
        {
          jsonrpc: "2.0",
          id: 5,
          method: "tools/call",
          params: {
            name: "get_links",
            arguments: {
              source_id: "BR-AR-0001-001",
              direction: "from",
            },
          },
        },
        { project_id: "project-1" }
      )
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.result.content[0].json.count).toBe(1);
    expect(json.result.content[0].json.links[0].id).toBe("link-1");
  });

  it("json-rpc: tools/call submit_impact_proposal が成功する", async () => {
    const response = await POST(
      createRequest(
        {
          jsonrpc: "2.0",
          id: 6,
          method: "tools/call",
          params: {
            name: "submit_impact_proposal",
            arguments: {
              proposal: {
                change_request_id: "cr-1",
                summary: "影響候補",
                affected_items: [
                  {
                    id: "SF-AR-0001",
                    type: "system_function",
                    name: "請求管理API",
                    confidence: "high",
                    evidence: {
                      reason: "依存あり",
                      matched_concepts: ["C-00001"],
                    },
                  },
                ],
              },
            },
          },
        },
        { project_id: "project-1" }
      )
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.result.content[0].json.insertedCount).toBe(1);
    expect(deleteImpactScopesByChangeRequestIdMock).toHaveBeenCalledWith("cr-1", "project-1");
    expect(createImpactScopesMock).toHaveBeenCalledWith(expect.any(Array), "project-1");
  });
});
