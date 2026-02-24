import { supabase } from "@/lib/supabase/client";
import { failIfMissingConfig } from "./crud-factory";
import type {
  DesignDecisionLog,
  DesignDecisionLogCreatedBy,
  DesignDecisionLogRationaleType,
  DesignDecisionLogStatus,
  DesignDecisionLogTargetType,
} from "@/lib/domain/value-objects";

export type DesignDecisionLogInput = {
  changeRequestId: string;
  createdBy?: DesignDecisionLogCreatedBy;
  contextTargetType?: DesignDecisionLogTargetType;
  contextTargetId?: string;
  contextField?: string | null;
  decision: string;
  rationaleType?: DesignDecisionLogRationaleType;
  rationaleReference?: string | null;
  rationaleExplanation: string;
  status?: DesignDecisionLogStatus;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
};

type DesignDecisionLogRow = {
  id: string;
  change_request_id: string;
  created_by: string;
  context_target_type: string;
  context_target_id: string;
  context_field: string | null;
  decision: string;
  rationale_type: string;
  rationale_reference: string | null;
  rationale_explanation: string;
  status: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

const normalizeCreatedBy = (value: unknown): DesignDecisionLogCreatedBy => {
  if (value === "agent" || value === "human") return value;
  return "human";
};

const normalizeContextTargetType = (value: unknown): DesignDecisionLogTargetType => {
  if (
    value === "bt" ||
    value === "br" ||
    value === "sf" ||
    value === "sr" ||
    value === "ac" ||
    value === "impl_unit" ||
    value === "change_request"
  ) {
    return value;
  }
  return "change_request";
};

const normalizeRationaleType = (value: unknown): DesignDecisionLogRationaleType => {
  if (
    value === "pr_reference" ||
    value === "ac_reference" ||
    value === "convention" ||
    value === "inference" ||
    value === "user_input"
  ) {
    return value;
  }
  return "user_input";
};

const normalizeStatus = (value: unknown): DesignDecisionLogStatus => {
  if (value === "proposed" || value === "confirmed" || value === "rejected") return value;
  return "confirmed";
};

const toDesignDecisionLog = (row: DesignDecisionLogRow): DesignDecisionLog => ({
  id: row.id,
  changeRequestId: row.change_request_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: normalizeCreatedBy(row.created_by),
  context: {
    targetType: normalizeContextTargetType(row.context_target_type),
    targetId: row.context_target_id,
    field: row.context_field,
  },
  decision: row.decision,
  rationale: {
    type: normalizeRationaleType(row.rationale_type),
    reference: row.rationale_reference,
    explanation: row.rationale_explanation,
  },
  status: normalizeStatus(row.status),
  confirmedBy: row.confirmed_by,
  confirmedAt: row.confirmed_at,
});

export const listDesignDecisionLogsByChangeRequestId = async (changeRequestId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("design_decision_logs")
    .select("*")
    .eq("change_request_id", changeRequestId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data as DesignDecisionLogRow[]).map(toDesignDecisionLog), error: null };
};

export const createDesignDecisionLog = async (input: DesignDecisionLogInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    change_request_id: input.changeRequestId,
    created_by: normalizeCreatedBy(input.createdBy),
    context_target_type: normalizeContextTargetType(input.contextTargetType),
    context_target_id: input.contextTargetId ?? input.changeRequestId,
    context_field: input.contextField ?? null,
    decision: input.decision,
    rationale_type: normalizeRationaleType(input.rationaleType),
    rationale_reference: input.rationaleReference ?? null,
    rationale_explanation: input.rationaleExplanation,
    status: normalizeStatus(input.status),
    confirmed_by: input.confirmedBy ?? null,
    confirmed_at: input.confirmedAt ?? null,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("design_decision_logs")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toDesignDecisionLog(data as DesignDecisionLogRow), error: null };
};

export const createDesignDecisionLogs = async (inputs: DesignDecisionLogInput[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (inputs.length === 0) return { data: [], error: null };

  const now = new Date().toISOString();
  const payload = inputs.map((input) => ({
    change_request_id: input.changeRequestId,
    created_by: normalizeCreatedBy(input.createdBy),
    context_target_type: normalizeContextTargetType(input.contextTargetType),
    context_target_id: input.contextTargetId ?? input.changeRequestId,
    context_field: input.contextField ?? null,
    decision: input.decision,
    rationale_type: normalizeRationaleType(input.rationaleType),
    rationale_reference: input.rationaleReference ?? null,
    rationale_explanation: input.rationaleExplanation,
    status: normalizeStatus(input.status),
    confirmed_by: input.confirmedBy ?? null,
    confirmed_at: input.confirmedAt ?? null,
    created_at: now,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("design_decision_logs")
    .insert(payload)
    .select("*");

  if (error) return { data: null, error: error.message };
  return { data: (data as DesignDecisionLogRow[]).map(toDesignDecisionLog), error: null };
};

export const updateDesignDecisionLogStatus = async (
  id: string,
  status: DesignDecisionLogStatus,
  options?: {
    confirmedBy?: string | null;
    reviewNote?: string | null;
  }
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status: normalizeStatus(status),
    updated_at: now,
  };

  if (status === "confirmed") {
    payload.confirmed_by = options?.confirmedBy ?? null;
    payload.confirmed_at = now;
  } else {
    payload.confirmed_by = null;
    payload.confirmed_at = null;
  }

  if (options?.reviewNote && options.reviewNote.trim().length > 0) {
    const { data: existing, error: fetchError } = await supabase
      .from("design_decision_logs")
      .select("rationale_explanation")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return { data: null, error: fetchError.message };

    const currentRationale =
      existing && typeof existing.rationale_explanation === "string"
        ? existing.rationale_explanation
        : "";
    payload.rationale_explanation = `${currentRationale}\n\n[Review Note]\n${options.reviewNote.trim()}`;
  }

  const { data, error } = await supabase
    .from("design_decision_logs")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toDesignDecisionLog(data as DesignDecisionLogRow), error: null };
};
