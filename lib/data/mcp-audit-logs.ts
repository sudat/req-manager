import { supabase } from "@/lib/supabase/client";
import { failIfMissingConfig } from "./crud-factory";

export type McpAuditLogCreateInput = {
  requestId: string;
  projectId: string;
  toolName: string;
  transport: "jsonrpc" | "simple";
  guardMode: "off" | "observe" | "enforce";
  authResult: "pass" | "fail" | "skipped";
  rateLimitResult: "pass" | "fail" | "skipped";
  statusCode: number;
  durationMs: number;
  blocked: boolean;
  argKeys?: string[];
  errorCode?: string | null;
};

export const createMcpAuditLog = async (input: McpAuditLogCreateInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const payload = {
    request_id: input.requestId,
    project_id: input.projectId,
    tool_name: input.toolName,
    transport: input.transport,
    guard_mode: input.guardMode,
    auth_result: input.authResult,
    rate_limit_result: input.rateLimitResult,
    status_code: input.statusCode,
    duration_ms: input.durationMs,
    blocked: input.blocked,
    arg_keys: input.argKeys ?? [],
    error_code: input.errorCode ?? null,
  };

  const { error } = await supabase.from("mcp_audit_logs").insert(payload);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
