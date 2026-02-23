import { NextRequest, NextResponse } from "next/server";
import { getProductRequirementByProjectId } from "@/lib/data/product-requirements";
import { listTasks, getTaskById } from "@/lib/data/tasks";
import {
  listBusinessRequirements,
  listBusinessRequirementsByTaskId,
  listBusinessRequirementsByIds,
} from "@/lib/data/business-requirements";
import { getSystemFunctionById, listSystemFunctions } from "@/lib/data/system-functions";
import { listSystemRequirements, listSystemRequirementsByIds } from "@/lib/data/system-requirements";

type McpToolName =
  | "get_product_requirement"
  | "search_requirements"
  | "get_requirement"
  | "get_system_function";

type SearchType = "bt" | "br" | "sf" | "sr";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
};

type JsonRpcError = {
  code: number;
  message: string;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
};

const TOOL_DEFS = [
  {
    name: "get_product_requirement",
    description: "プロダクト要件（PR）を取得",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "search_requirements",
    description: "要件を検索（業務/システム）",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        types: {
          type: "array",
          items: {
            type: "string",
            enum: ["bt", "br", "sf", "sr"],
          },
        },
        limit: { type: "number", minimum: 1, maximum: 50 },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_requirement",
    description: "要件の詳細を取得（BT/BR/SR/SF）",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "get_system_function",
    description: "システム機能（エントリポイント含む）を取得",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readProjectIdFromHeader = (request: NextRequest): string | null => {
  const fromHeader =
    request.headers.get("project_id") ?? request.headers.get("x-project-id") ?? null;
  if (!fromHeader) return null;
  const trimmed = fromHeader.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeTypes = (value: unknown): SearchType[] | null => {
  if (value === undefined) return ["bt", "br", "sf", "sr"];
  if (!Array.isArray(value)) return null;

  const normalized = value
    .map((item) => (typeof item === "string" ? item.toLowerCase() : ""))
    .filter((item): item is SearchType =>
      item === "bt" || item === "br" || item === "sf" || item === "sr"
    );

  if (normalized.length !== value.length) return null;
  return normalized.length > 0 ? normalized : ["bt", "br", "sf", "sr"];
};

const toLower = (value: string) => value.toLowerCase();

const limitResults = <T>(items: T[], limit: number) => items.slice(0, Math.max(1, Math.min(limit, 50)));

const searchRequirements = async (
  projectId: string,
  args: Record<string, unknown>
): Promise<{ data: unknown; error: string | null; status?: number }> => {
  const query = typeof args.query === "string" ? args.query.trim() : "";
  if (!query) {
    return { data: null, error: "query is required", status: 400 };
  }

  const types = normalizeTypes(args.types);
  if (!types) {
    return { data: null, error: "types must be bt|br|sf|sr array", status: 400 };
  }

  const limitRaw = typeof args.limit === "number" ? args.limit : 10;
  const limit = Math.max(1, Math.min(Math.floor(limitRaw), 50));
  const q = toLower(query);

  const results: Array<Record<string, unknown>> = [];

  if (types.includes("bt")) {
    const { data, error } = await listTasks(projectId);
    if (error) return { data: null, error, status: 500 };

    const matched = (data ?? []).filter(
      (item) =>
        toLower(item.id).startsWith(q) ||
        toLower(item.name).includes(q) ||
        toLower(item.summary).includes(q)
    );

    results.push(
      ...limitResults(matched, limit).map((item) => ({
        resultType: "bt",
        id: item.id,
        name: item.name,
        description: item.summary,
        businessArea: item.businessArea,
      }))
    );
  }

  if (types.includes("br")) {
    const { data, error } = await listBusinessRequirements(projectId);
    if (error) return { data: null, error, status: 500 };

    const matched = (data ?? []).filter(
      (item) =>
        toLower(item.id).startsWith(q) ||
        toLower(item.title).includes(q) ||
        toLower(item.goal).includes(q) ||
        toLower(item.summary).includes(q)
    );

    results.push(
      ...limitResults(matched, limit).map((item) => ({
        resultType: "br",
        id: item.id,
        requirement: item.title,
        rationale: item.goal,
        taskId: item.taskId,
      }))
    );
  }

  if (types.includes("sf")) {
    const { data, error } = await listSystemFunctions(projectId);
    if (error) return { data: null, error, status: 500 };

    const matched = (data ?? []).filter(
      (item) =>
        toLower(item.id).startsWith(q) ||
        toLower(item.title).includes(q) ||
        toLower(item.summary).includes(q)
    );

    results.push(
      ...limitResults(matched, limit).map((item) => ({
        resultType: "sf",
        id: item.id,
        name: item.title,
        description: item.summary,
        systemDomainId: item.systemDomainId,
      }))
    );
  }

  if (types.includes("sr")) {
    const { data, error } = await listSystemRequirements(projectId);
    if (error) return { data: null, error, status: 500 };

    const matched = (data ?? []).filter(
      (item) =>
        toLower(item.id).startsWith(q) ||
        toLower(item.title).includes(q) ||
        toLower(item.summary).includes(q)
    );

    results.push(
      ...limitResults(matched, limit).map((item) => ({
        resultType: "sr",
        id: item.id,
        title: item.title,
        summary: item.summary,
        category: item.category,
        systemFunctionIds: item.srfIds,
      }))
    );
  }

  return {
    data: {
      count: results.length,
      results,
    },
    error: null,
  };
};

const getRequirement = async (
  projectId: string,
  args: Record<string, unknown>
): Promise<{ data: unknown; error: string | null; status?: number }> => {
  const id = typeof args.id === "string" ? args.id.trim() : "";
  if (!id) {
    return { data: null, error: "id is required", status: 400 };
  }

  const normalized = id.toUpperCase();

  if (normalized.startsWith("BT-")) {
    const [taskResult, brResult] = await Promise.all([
      getTaskById(normalized, projectId),
      listBusinessRequirementsByTaskId(normalized, projectId),
    ]);

    if (taskResult.error) return { data: null, error: taskResult.error, status: 500 };
    if (brResult.error) return { data: null, error: brResult.error, status: 500 };
    if (!taskResult.data) return { data: null, error: "requirement not found", status: 404 };

    return {
      data: {
        resultType: "bt",
        requirement: taskResult.data,
        businessRequirements: (brResult.data ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          goal: item.goal,
        })),
      },
      error: null,
    };
  }

  if (normalized.startsWith("BR-")) {
    const result = await listBusinessRequirementsByIds([normalized], projectId);
    if (result.error) return { data: null, error: result.error, status: 500 };
    if (!result.data || result.data.length === 0) {
      return { data: null, error: "requirement not found", status: 404 };
    }

    return {
      data: {
        resultType: "br",
        requirement: result.data[0],
      },
      error: null,
    };
  }

  if (normalized.startsWith("SR-")) {
    const result = await listSystemRequirementsByIds([normalized], projectId);
    if (result.error) return { data: null, error: result.error, status: 500 };
    if (!result.data || result.data.length === 0) {
      return { data: null, error: "requirement not found", status: 404 };
    }

    return {
      data: {
        resultType: "sr",
        requirement: result.data[0],
      },
      error: null,
    };
  }

  if (normalized.startsWith("SF-")) {
    const result = await getSystemFunctionById(normalized, projectId);
    if (result.error) return { data: null, error: result.error, status: 500 };
    if (!result.data) return { data: null, error: "requirement not found", status: 404 };

    return {
      data: {
        resultType: "sf",
        requirement: result.data,
      },
      error: null,
    };
  }

  return { data: null, error: "unsupported requirement id format", status: 400 };
};

const getProductRequirement = async (projectId: string) => {
  const result = await getProductRequirementByProjectId(projectId);
  if (result.error) return { data: null, error: result.error, status: 500 };
  if (!result.data) return { data: null, error: "product requirement not found", status: 404 };
  return { data: result.data, error: null };
};

const getSystemFunction = async (projectId: string, args: Record<string, unknown>) => {
  const id = typeof args.id === "string" ? args.id.trim() : "";
  if (!id) {
    return { data: null, error: "id is required", status: 400 };
  }

  const result = await getSystemFunctionById(id.toUpperCase(), projectId);
  if (result.error) return { data: null, error: result.error, status: 500 };
  if (!result.data) return { data: null, error: "system function not found", status: 404 };
  return { data: result.data, error: null };
};

const callTool = async (
  projectId: string,
  toolName: McpToolName,
  args: Record<string, unknown>
): Promise<{ data: unknown; error: string | null; status?: number }> => {
  switch (toolName) {
    case "get_product_requirement":
      return getProductRequirement(projectId);
    case "search_requirements":
      return searchRequirements(projectId, args);
    case "get_requirement":
      return getRequirement(projectId, args);
    case "get_system_function":
      return getSystemFunction(projectId, args);
    default:
      return { data: null, error: "unknown tool", status: 400 };
  }
};

const jsonRpcResult = (id: string | number | null | undefined, result: unknown): JsonRpcResponse => ({
  jsonrpc: "2.0",
  id: id ?? null,
  result,
});

const jsonRpcError = (
  id: string | number | null | undefined,
  code: number,
  message: string
): JsonRpcResponse => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
});

const handleJsonRpc = async (request: NextRequest, body: JsonRpcRequest): Promise<Response> => {
  if (!body.method || typeof body.method !== "string") {
    return NextResponse.json(jsonRpcError(body.id, -32600, "Invalid Request"), { status: 400 });
  }

  if (body.method === "initialize") {
    return NextResponse.json(
      jsonRpcResult(body.id, {
        protocolVersion: "2024-11-05",
        serverInfo: {
          name: "req-manager-mcp",
          version: "0.1.0",
        },
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
      })
    );
  }

  if (body.method === "tools/list") {
    return NextResponse.json(jsonRpcResult(body.id, { tools: TOOL_DEFS }));
  }

  if (body.method === "tools/call") {
    const projectId = readProjectIdFromHeader(request);
    if (!projectId) {
      return NextResponse.json(jsonRpcError(body.id, -32001, "project_id header is required"), {
        status: 401,
      });
    }

    if (!isRecord(body.params)) {
      return NextResponse.json(jsonRpcError(body.id, -32602, "params must be object"), {
        status: 400,
      });
    }

    const name = body.params.name;
    const args = isRecord(body.params.arguments) ? body.params.arguments : {};

    if (typeof name !== "string") {
      return NextResponse.json(jsonRpcError(body.id, -32602, "tool name is required"), {
        status: 400,
      });
    }

    const toolName = name as McpToolName;
    const result = await callTool(projectId, toolName, args);

    if (result.error) {
      const code = result.status === 404 ? -32004 : result.status === 400 ? -32602 : -32000;
      return NextResponse.json(jsonRpcError(body.id, code, result.error), {
        status: result.status ?? 500,
      });
    }

    return NextResponse.json(jsonRpcResult(body.id, {
      content: [
        {
          type: "json",
          json: result.data,
        },
      ],
    }));
  }

  return NextResponse.json(jsonRpcError(body.id, -32601, "Method not found"), { status: 404 });
};

export async function GET() {
  return NextResponse.json({
    server: "req-manager-mcp",
    version: "0.1.0",
    tools: TOOL_DEFS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (isRecord(body) && typeof body.method === "string") {
      return handleJsonRpc(request, body as JsonRpcRequest);
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_REQUEST",
            message: "request body must be object",
          },
        },
        { status: 400 }
      );
    }

    const projectId = readProjectIdFromHeader(request);
    if (!projectId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "project_id header is required",
          },
        },
        { status: 401 }
      );
    }

    const tool = body.tool;
    const args = isRecord(body.args) ? body.args : {};

    if (typeof tool !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_REQUEST",
            message: "tool is required",
          },
        },
        { status: 400 }
      );
    }

    const result = await callTool(projectId, tool as McpToolName, args);

    if (result.error) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "TOOL_ERROR",
            message: result.error,
          },
        },
        { status: result.status ?? 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      result: result.data,
    });
  } catch (error) {
    console.error("[MCP API] Failed to handle request:", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "failed to handle MCP request",
        },
      },
      { status: 500 }
    );
  }
}
