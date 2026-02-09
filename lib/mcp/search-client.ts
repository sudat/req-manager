import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export type SearchRequirementsParams = {
  projectId: string;
  query: string;
  types?: Array<"bt" | "br" | "sf" | "sr">;
  limit?: number;
};

export type SearchRequirementsResponse = {
  results: Array<Record<string, unknown>>;
  count: number;
};

let clientPromise: Promise<Client> | null = null;
let transport: StreamableHTTPClientTransport | null = null;

const resolveServerUrl = (): string => {
  const url = process.env.MCP_SEARCH_SERVER_URL;
  if (!url) {
    throw new Error("MCP_SEARCH_SERVER_URL is not set");
  }
  return url;
};

const buildHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const raw = process.env.MCP_SEARCH_SERVER_HEADERS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === "string") headers[key] = value;
        }
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return headers;
};

const createClient = async (): Promise<Client> => {
  const url = resolveServerUrl();
  const headers = buildHeaders();

  const client = new Client({
    name: "req-manager-search-client",
    version: "1.0.0",
  });

  transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: {
      headers,
    },
  });

  await client.connect(transport);
  return client;
};

const getClient = async (): Promise<Client> => {
  if (!clientPromise) {
    clientPromise = createClient().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
};

const resetClient = async () => {
  if (transport) {
    try {
      await transport.close();
    } catch {
      // ignore
    }
  }
  transport = null;
  clientPromise = null;
};

const escapeSqlLiteral = (value: string): string => value.replace(/'/g, "''");

const buildSqlArray = (values: Array<"bt" | "br" | "sf" | "sr">): string => {
  if (values.length === 0) return "array['bt','br','sf','sr']";
  const escaped = values.map((item) => `'${item}'`).join(",");
  return `array[${escaped}]`;
};

const isUuid = (value: string): boolean =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );

const normalizeTypes = (
  types?: Array<"bt" | "br" | "sf" | "sr">
): Array<"bt" | "br" | "sf" | "sr"> => {
  const allowed: Array<"bt" | "br" | "sf" | "sr"> = ["bt", "br", "sf", "sr"];
  if (!types || types.length === 0) return allowed;
  return types.filter((item) => allowed.includes(item));
};

const buildSearchSql = (
  params: SearchRequirementsParams,
  limit: number
): string => {
  if (!isUuid(params.projectId)) {
    throw new Error("Invalid projectId format");
  }
  const projectId = escapeSqlLiteral(params.projectId);
  const query = escapeSqlLiteral(params.query);
  const types = normalizeTypes(params.types);
  const typesLiteral = buildSqlArray(types);
  return [
    "select result",
    "from public.search_requirements_v2(",
    `'${projectId}'::uuid,`,
    `'${query}',`,
    `${typesLiteral}::text[],`,
    `${limit}`,
    ")",
  ].join(" ");
};

const extractRows = (payload: unknown): Array<Record<string, unknown>> => {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.filter((row) => row && typeof row === "object") as Array<
      Record<string, unknown>
    >;
  }
  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const candidates = [
      obj.rows,
      obj.data,
      obj.result,
      obj.results,
      obj.value,
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter((row) => row && typeof row === "object") as Array<
          Record<string, unknown>
        >;
      }
    }
  }
  return [];
};

const extractJsonFromUntrustedText = (value: string): unknown | null => {
  const match = value.match(/<untrusted-data-[^>]+>\n([\s\S]*?)\n<\/untrusted-data-[^>]+>/);
  if (!match) return null;
  const raw = match[1]?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const parseTextPayload = (text: string): unknown => {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed === "string") {
      return extractJsonFromUntrustedText(parsed) ?? parsed;
    }
    return parsed;
  } catch {
    return extractJsonFromUntrustedText(text) ?? text;
  }
};

const extractExecuteSqlResult = (result: CallToolResult): Array<Record<string, unknown>> => {
  if (process.env.MCP_SEARCH_DEBUG === "1") {
    // eslint-disable-next-line no-console
    console.log("[MCP search debug] raw result:", JSON.stringify(result, null, 2));
  }
  if (result.isError) return [];
  if (result.structuredContent) {
    if (process.env.MCP_SEARCH_DEBUG === "1") {
      // eslint-disable-next-line no-console
      console.log(
        "[MCP search debug] structuredContent:",
        JSON.stringify(result.structuredContent, null, 2)
      );
    }
    const rows = extractRows(result.structuredContent);
    if (rows.length) return rows;
  }
  const text = result.content?.find((item) => item.type === "text")?.text;
  if (!text) return [];
  const parsed = parseTextPayload(text);
  if (process.env.MCP_SEARCH_DEBUG === "1") {
    // eslint-disable-next-line no-console
    console.log(
      "[MCP search debug] parsed text:",
      JSON.stringify(parsed, null, 2)
    );
  }
  return extractRows(parsed);
};

const resolveToolName = (): string =>
  process.env.MCP_SEARCH_TOOL_NAME ?? "execute_sql";

const callExecuteSql = async (
  client: Client,
  sql: string
): Promise<CallToolResult> => {
  const toolName = resolveToolName();
  const first = (await client.callTool({
    name: toolName,
    arguments: { sql },
  })) as unknown as CallToolResult;
  if (!first.isError) return first;
  const fallback = (await client.callTool({
    name: toolName,
    arguments: { query: sql },
  })) as unknown as CallToolResult;
  return fallback;
};

export const callSearchRequirementsMcp = async (
  params: SearchRequirementsParams
): Promise<SearchRequirementsResponse> => {
  const client = await getClient();
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 50);
  const sql = buildSearchSql(params, limit);
  try {
    const result = await callExecuteSql(client, sql);
    const rows = extractExecuteSqlResult(result);
    if (result.isError) {
      throw new Error("execute_sql failed");
    }
    const results = rows
      .map((row) => {
        const candidate = row.result;
        if (candidate && typeof candidate === "object") {
          return candidate as Record<string, unknown>;
        }
        return row;
      })
      .filter((row) => row && typeof row === "object");
    return {
      results,
      count: results.length,
    };
  } catch (error) {
    await resetClient();
    throw error;
  }
};
