import { NextRequest, NextResponse } from "next/server";
import { getProductRequirementByProjectId } from "@/lib/data/product-requirements";
import { searchTasks, getTaskById } from "@/lib/data/tasks";
import { searchConcepts as searchConceptsInData } from "@/lib/data/concepts";
import {
  searchBusinessRequirements,
  listBusinessRequirementsByTaskId,
  listBusinessRequirementsByIds,
} from "@/lib/data/business-requirements";
import { getSystemFunctionById, searchSystemFunctions } from "@/lib/data/system-functions";
import { searchSystemRequirements, listSystemRequirementsByIds } from "@/lib/data/system-requirements";
import { listRequirementLinksByNodeId } from "@/lib/data/requirement-links";
import { getChangeRequestById } from "@/lib/data/change-requests";
import { createImpactScopes, deleteImpactScopesByChangeRequestId } from "@/lib/data/impact-scopes";
import { createMcpAuditLog } from "@/lib/data/mcp-audit-logs";

type McpToolName =
  | "get_product_requirement"
  | "search_requirements"
  | "get_requirement"
  | "get_system_function"
  | "search_concepts"
  | "get_links"
  | "submit_impact_proposal";

type SearchType = "bt" | "br" | "sf" | "sr";
type McpGuardMode = "off" | "observe" | "enforce";
type AuditAuthResult = "pass" | "fail" | "skipped";
type AuditRateLimitResult = "pass" | "fail" | "skipped";

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
  {
    name: "search_concepts",
    description: "概念辞書を検索",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 50 },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_links",
    description: "要件間リンクを取得",
    inputSchema: {
      type: "object",
      properties: {
        source_id: { type: "string" },
        direction: {
          type: "string",
          enum: ["from", "to", "both"],
        },
      },
      required: ["source_id"],
      additionalProperties: false,
    },
  },
  {
    name: "submit_impact_proposal",
    description: "影響範囲候補を保存",
    inputSchema: {
      type: "object",
      properties: {
        proposal: {
          type: "object",
          properties: {
            change_request_id: { type: "string" },
            summary: { type: "string" },
            affected_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: {
                    type: "string",
                    enum: ["business_requirement", "system_requirement", "system_function", "file"],
                  },
                  name: { type: "string" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                  evidence: {
                    type: "object",
                    properties: {
                      reason: { type: "string" },
                      matched_concepts: { type: "array", items: { type: "string" } },
                      source_references: { type: "array", items: { type: "string" } },
                    },
                    additionalProperties: true,
                  },
                },
                required: ["id", "type", "name"],
                additionalProperties: true,
              },
            },
          },
          required: ["change_request_id", "affected_items"],
          additionalProperties: true,
        },
      },
      required: ["proposal"],
      additionalProperties: false,
    },
  },
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const rateLimitStore = new Map<string, { windowStart: number; count: number }>();

const parseIntWithDefault = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readRequestId = (request: NextRequest): string => {
  const fromHeader = request.headers.get("x-request-id");
  if (fromHeader && fromHeader.trim().length > 0) return fromHeader.trim();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getGuardMode = (): McpGuardMode => {
  const raw = process.env.MCP_GUARD_MODE?.toLowerCase();
  if (raw === "off" || raw === "observe" || raw === "enforce") return raw;
  return "observe";
};

const getApiKeys = (): string[] => {
  const list = process.env.MCP_API_KEYS ?? process.env.MCP_API_KEY ?? "";
  return list
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const readApiKeyFromHeader = (request: NextRequest): string | null => {
  const direct = request.headers.get("x-mcp-api-key");
  if (direct && direct.trim().length > 0) return direct.trim();

  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return match[1].trim();
};

const getClientIdentifier = (request: NextRequest): string => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) return realIp.trim();
  return "unknown";
};

const checkRateLimit = (key: string): { ok: boolean; detail: string } => {
  const windowMs = parseIntWithDefault(process.env.MCP_RATE_LIMIT_WINDOW_MS, 60_000);
  const maxRequests = parseIntWithDefault(process.env.MCP_RATE_LIMIT_MAX_REQUESTS, 60);
  const now = Date.now();

  for (const [storeKey, value] of rateLimitStore.entries()) {
    if (now - value.windowStart > windowMs) {
      rateLimitStore.delete(storeKey);
    }
  }

  const current = rateLimitStore.get(key);
  if (!current || now - current.windowStart > windowMs) {
    rateLimitStore.set(key, { windowStart: now, count: 1 });
    return { ok: true, detail: `count=1/${maxRequests}` };
  }

  if (current.count >= maxRequests) {
    return { ok: false, detail: `count=${current.count}/${maxRequests}` };
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return { ok: true, detail: `count=${current.count}/${maxRequests}` };
};

const evaluateGuards = (
  request: NextRequest,
  projectId: string
): {
  allowed: boolean;
  status?: number;
  code?: "AUTH_FAILED" | "RATE_LIMITED";
  message?: string;
  wouldBlock: boolean;
  authResult: AuditAuthResult;
  rateLimitResult: AuditRateLimitResult;
} => {
  const mode = getGuardMode();
  if (mode === "off") {
    return { allowed: true, wouldBlock: false, authResult: "skipped", rateLimitResult: "skipped" };
  }

  const configuredKeys = getApiKeys();
  const providedKey = readApiKeyFromHeader(request);
  const keyValid = configuredKeys.length > 0 && !!providedKey && configuredKeys.includes(providedKey);
  const authFailed = !keyValid;

  const clientId = getClientIdentifier(request);
  const rateResult = checkRateLimit(`${projectId}:${clientId}`);
  const rateFailed = !rateResult.ok;

  if (mode === "observe") {
    if (authFailed || rateFailed) {
      console.warn("[MCP Guard][observe] would block request", {
        authFailed,
        rateFailed,
        rateDetail: rateResult.detail,
      });
    }
    return {
      allowed: true,
      wouldBlock: authFailed || rateFailed,
      authResult: authFailed ? "fail" : "pass",
      rateLimitResult: rateFailed ? "fail" : "pass",
    };
  }

  if (authFailed) {
    return {
      allowed: false,
      status: 401,
      code: "AUTH_FAILED",
      message: "invalid or missing MCP API key",
      wouldBlock: true,
      authResult: "fail",
      rateLimitResult: rateFailed ? "fail" : "pass",
    };
  }

  if (rateFailed) {
    return {
      allowed: false,
      status: 429,
      code: "RATE_LIMITED",
      message: "rate limit exceeded",
      wouldBlock: true,
      authResult: "pass",
      rateLimitResult: "fail",
    };
  }

  return { allowed: true, wouldBlock: false, authResult: "pass", rateLimitResult: "pass" };
};

const emitMcpAuditLog = async (payload: {
  requestId: string;
  projectId: string;
  toolName: string;
  transport: "jsonrpc" | "simple";
  guardMode: McpGuardMode;
  authResult: AuditAuthResult;
  rateLimitResult: AuditRateLimitResult;
  statusCode: number;
  durationMs: number;
  blocked: boolean;
  argKeys?: string[];
  errorCode?: string;
}) => {
  try {
    const auditBody = {
      event: "mcp_audit",
      timestamp: new Date().toISOString(),
      request_id: payload.requestId,
      project_id: payload.projectId,
      tool_name: payload.toolName,
      transport: payload.transport,
      guard_mode: payload.guardMode,
      auth_result: payload.authResult,
      rate_limit_result: payload.rateLimitResult,
      status_code: payload.statusCode,
      duration_ms: payload.durationMs,
      blocked: payload.blocked,
      arg_keys: payload.argKeys ?? [],
      error_code: payload.errorCode ?? null,
    };

    console.info("[MCP_AUDIT]", auditBody);

    const persistResult = await createMcpAuditLog({
      requestId: payload.requestId,
      projectId: payload.projectId,
      toolName: payload.toolName,
      transport: payload.transport,
      guardMode: payload.guardMode,
      authResult: payload.authResult,
      rateLimitResult: payload.rateLimitResult,
      statusCode: payload.statusCode,
      durationMs: payload.durationMs,
      blocked: payload.blocked,
      argKeys: payload.argKeys ?? [],
      errorCode: payload.errorCode ?? null,
    });

    if (persistResult.error) {
      console.warn("[MCP_AUDIT] failed to persist audit log", {
        message: persistResult.error,
      });
    }
  } catch (error) {
    console.warn("[MCP_AUDIT] failed to emit audit log", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

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

  const results: Array<Record<string, unknown>> = [];

  if (types.includes("bt")) {
    const { data, error } = await searchTasks(query, projectId, limit);
    if (error) return { data: null, error, status: 500 };

    results.push(
      ...(data ?? []).map((item) => ({
        resultType: "bt",
        id: item.id,
        name: item.name,
        description: item.summary,
        businessArea: item.businessArea,
      }))
    );
  }

  if (types.includes("br")) {
    const { data, error } = await searchBusinessRequirements(query, projectId, limit);
    if (error) return { data: null, error, status: 500 };

    results.push(
      ...(data ?? []).map((item) => ({
        resultType: "br",
        id: item.id,
        requirement: item.title,
        rationale: item.goal,
        taskId: item.taskId,
      }))
    );
  }

  if (types.includes("sf")) {
    const { data, error } = await searchSystemFunctions(query, projectId, limit);
    if (error) return { data: null, error, status: 500 };

    results.push(
      ...(data ?? []).map((item) => ({
        resultType: "sf",
        id: item.id,
        name: item.title,
        description: item.summary,
        systemDomainId: item.systemDomainId,
      }))
    );
  }

  if (types.includes("sr")) {
    const { data, error } = await searchSystemRequirements(query, projectId, limit);
    if (error) return { data: null, error, status: 500 };

    results.push(
      ...(data ?? []).map((item) => ({
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

const searchConcepts = async (projectId: string, args: Record<string, unknown>) => {
  const query = typeof args.query === "string" ? args.query.trim() : "";
  if (!query) return { data: null, error: "query is required", status: 400 };

  const limitRaw = typeof args.limit === "number" ? args.limit : 10;
  const limit = Math.max(1, Math.min(Math.floor(limitRaw), 50));

  const result = await searchConceptsInData(query, projectId, limit);
  if (result.error) return { data: null, error: result.error, status: 500 };

  const concepts = (result.data ?? []).map((concept) => ({
    id: concept.id,
    name: concept.name,
    definition: concept.definition,
    synonyms: concept.synonyms,
    areas: concept.areas,
  }));

  return {
    data: {
      count: concepts.length,
      concepts,
    },
    error: null,
  };
};

const getLinks = async (projectId: string, args: Record<string, unknown>) => {
  const sourceId = typeof args.source_id === "string" ? args.source_id.trim() : "";
  if (!sourceId) return { data: null, error: "source_id is required", status: 400 };

  const directionRaw = typeof args.direction === "string" ? args.direction : "both";
  const direction = directionRaw === "from" || directionRaw === "to" || directionRaw === "both"
    ? directionRaw
    : null;
  if (!direction) return { data: null, error: "direction must be from|to|both", status: 400 };

  const result = await listRequirementLinksByNodeId(sourceId, direction, projectId);
  if (result.error) return { data: null, error: result.error, status: 500 };

  const links = result.data ?? [];

  return {
    data: {
      count: links.length,
      links,
    },
    error: null,
  };
};

type ProposalAffectedItem = {
  id?: unknown;
  type?: unknown;
  name?: unknown;
  confidence?: unknown;
  evidence?: unknown;
};

type ImpactProposal = {
  change_request_id?: unknown;
  summary?: unknown;
  affected_items?: unknown;
};

const submitImpactProposal = async (projectId: string, args: Record<string, unknown>) => {
  const proposal = isRecord(args.proposal) ? (args.proposal as ImpactProposal) : null;
  if (!proposal) return { data: null, error: "proposal is required", status: 400 };

  const changeRequestId =
    typeof proposal.change_request_id === "string" ? proposal.change_request_id.trim() : "";
  if (!changeRequestId) {
    return { data: null, error: "proposal.change_request_id is required", status: 400 };
  }

  if (!Array.isArray(proposal.affected_items)) {
    return { data: null, error: "proposal.affected_items must be array", status: 400 };
  }

  const crResult = await getChangeRequestById(changeRequestId, projectId);
  if (crResult.error) return { data: null, error: crResult.error, status: 500 };
  if (!crResult.data) return { data: null, error: "change request not found", status: 404 };

  const allowedTypes = new Set(["business_requirement", "system_requirement", "system_function", "file"]);
  const mappedItems = proposal.affected_items
    .filter(isRecord)
    .map((raw) => raw as ProposalAffectedItem)
    .filter((item) => {
      const id = typeof item.id === "string" ? item.id.trim() : "";
      const type = typeof item.type === "string" ? item.type : "";
      const name = typeof item.name === "string" ? item.name.trim() : "";
      return id.length > 0 && name.length > 0 && allowedTypes.has(type);
    })
    .map((item) => {
      const confidence = typeof item.confidence === "string" ? item.confidence : "medium";
      const evidence = isRecord(item.evidence) ? item.evidence : {};
      const reason = typeof evidence.reason === "string" ? evidence.reason : "";
      const matchedConcepts = Array.isArray(evidence.matched_concepts)
        ? evidence.matched_concepts.filter((v): v is string => typeof v === "string")
        : [];
      const sourceReferences = Array.isArray(evidence.source_references)
        ? evidence.source_references.filter((v): v is string => typeof v === "string")
        : [];

      const rationaleParts = [
        reason ? `reason: ${reason}` : "",
        matchedConcepts.length > 0 ? `matched_concepts: ${matchedConcepts.join(", ")}` : "",
        sourceReferences.length > 0 ? `source_references: ${sourceReferences.join(", ")}` : "",
        `confidence: ${confidence}`,
      ].filter(Boolean);

      return {
        changeRequestId,
        targetType: item.type as "business_requirement" | "system_requirement" | "system_function" | "file",
        targetId: item.id as string,
        targetTitle: item.name as string,
        rationale: rationaleParts.join("\n"),
      };
    });

  if (mappedItems.length === 0) {
    return { data: null, error: "proposal.affected_items has no valid items", status: 400 };
  }

  const deleteResult = await deleteImpactScopesByChangeRequestId(changeRequestId, projectId);
  if (deleteResult.error) return { data: null, error: deleteResult.error, status: 500 };

  const createResult = await createImpactScopes(mappedItems, projectId);
  if (createResult.error) return { data: null, error: createResult.error, status: 500 };

  return {
    data: {
      changeRequestId,
      summary: typeof proposal.summary === "string" ? proposal.summary : "",
      insertedCount: createResult.data?.length ?? 0,
    },
    error: null,
  };
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
    case "search_concepts":
      return searchConcepts(projectId, args);
    case "get_links":
      return getLinks(projectId, args);
    case "submit_impact_proposal":
      return submitImpactProposal(projectId, args);
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
    const startedAt = Date.now();
    const requestId = readRequestId(request);
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

    const guardResult = evaluateGuards(request, projectId);
    if (!guardResult.allowed) {
      await emitMcpAuditLog({
        requestId,
        projectId,
        toolName: "(unknown)",
        transport: "jsonrpc",
        guardMode: getGuardMode(),
        authResult: guardResult.authResult,
        rateLimitResult: guardResult.rateLimitResult,
        statusCode: guardResult.status ?? 401,
        durationMs: Date.now() - startedAt,
        blocked: true,
        errorCode: guardResult.code,
      });
      const code = guardResult.status === 429 ? -32029 : -32001;
      return NextResponse.json(
        jsonRpcError(body.id, code, guardResult.message ?? "request blocked"),
        { status: guardResult.status ?? 401 }
      );
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
      await emitMcpAuditLog({
        requestId,
        projectId,
        toolName,
        transport: "jsonrpc",
        guardMode: getGuardMode(),
        authResult: guardResult.authResult,
        rateLimitResult: guardResult.rateLimitResult,
        statusCode: result.status ?? 500,
        durationMs: Date.now() - startedAt,
        blocked: false,
        argKeys: Object.keys(args),
        errorCode: "TOOL_ERROR",
      });
      const code = result.status === 404 ? -32004 : result.status === 400 ? -32602 : -32000;
      return NextResponse.json(jsonRpcError(body.id, code, result.error), {
        status: result.status ?? 500,
      });
    }

    await emitMcpAuditLog({
      requestId,
      projectId,
      toolName,
      transport: "jsonrpc",
      guardMode: getGuardMode(),
      authResult: guardResult.authResult,
      rateLimitResult: guardResult.rateLimitResult,
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      blocked: false,
      argKeys: Object.keys(args),
    });

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

    const startedAt = Date.now();
    const requestId = readRequestId(request);
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

    const guardResult = evaluateGuards(request, projectId);
    if (!guardResult.allowed) {
      await emitMcpAuditLog({
        requestId,
        projectId,
        toolName: "(unknown)",
        transport: "simple",
        guardMode: getGuardMode(),
        authResult: guardResult.authResult,
        rateLimitResult: guardResult.rateLimitResult,
        statusCode: guardResult.status ?? 401,
        durationMs: Date.now() - startedAt,
        blocked: true,
        errorCode: guardResult.code,
      });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: guardResult.code ?? "AUTH_FAILED",
            message: guardResult.message ?? "request blocked",
          },
        },
        { status: guardResult.status ?? 401 }
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
      await emitMcpAuditLog({
        requestId,
        projectId,
        toolName: tool,
        transport: "simple",
        guardMode: getGuardMode(),
        authResult: guardResult.authResult,
        rateLimitResult: guardResult.rateLimitResult,
        statusCode: result.status ?? 500,
        durationMs: Date.now() - startedAt,
        blocked: false,
        argKeys: Object.keys(args),
        errorCode: "TOOL_ERROR",
      });
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

    await emitMcpAuditLog({
      requestId,
      projectId,
      toolName: tool,
      transport: "simple",
      guardMode: getGuardMode(),
      authResult: guardResult.authResult,
      rateLimitResult: guardResult.rateLimitResult,
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      blocked: false,
      argKeys: Object.keys(args),
    });

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
