import { supabase } from "@/lib/supabase/client";
import { failIfMissingConfig, executeListQuery } from "./crud-factory";
import type { RequirementLink, RequirementLinkNodeType } from "@/lib/domain";
import {
  DD_DEPENDENCY_CALL_TYPES,
  DD_DEPENDENCY_CALL_TYPE_LABELS,
  type DdDependencyCallType,
  type DdDependencyLink,
  type DdCallerLink,
} from "@/lib/domain/dd-dependency";

export type RequirementLinkType =
  | "derived_from"
  | "called_by_user"
  | DdDependencyCallType;

const DD_DEPENDENCY_CALL_TYPE_SET = new Set<string>(DD_DEPENDENCY_CALL_TYPES);

export const isDdDependencyLinkType = (
  linkType: string
): linkType is DdDependencyCallType => DD_DEPENDENCY_CALL_TYPE_SET.has(linkType);

/**
 * リンク種別の論理名定義
 */
export const getRequirementLinkTypeLabel = (linkType: RequirementLinkType): string => {
	const labels: Record<RequirementLinkType, string> = {
		derived_from: "BR→SR派生",
    calls_sync: DD_DEPENDENCY_CALL_TYPE_LABELS.calls_sync,
    calls_async: DD_DEPENDENCY_CALL_TYPE_LABELS.calls_async,
    called_by_user: "ユーザー起動",
	};
	return labels[linkType] ?? linkType;
};

export type RequirementLinkInput = {
  sourceType: RequirementLinkNodeType;
  sourceId: string;
  targetType: RequirementLinkNodeType;
  targetId: string;
  linkType: string;
  metadata?: Record<string, unknown> | null;
  suspect?: boolean;
  suspectReason?: string | null;
};

export type RequirementLinkCreateInput = RequirementLinkInput & {
  projectId: string;
};

type RequirementLinkRow = {
  id: string;
  project_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_type: string;
  metadata: unknown | null;
  suspect: boolean | null;
  suspect_reason: string | null;
  created_at: string;
  updated_at: string;
};

const normalizeMetadata = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const normalizeNodeType = (value: unknown): RequirementLinkNodeType => {
  if (typeof value === "string" && value.length > 0) return value;
  return "br";
};

const toRequirementLink = (row: RequirementLinkRow): RequirementLink => ({
  id: row.id,
  projectId: row.project_id,
  sourceType: normalizeNodeType(row.source_type),
  sourceId: row.source_id,
  targetType: normalizeNodeType(row.target_type),
  targetId: row.target_id,
  linkType: row.link_type,
  metadata: normalizeMetadata(row.metadata),
  suspect: row.suspect ?? false,
  suspectReason: row.suspect_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRequirementLinkRowBase = (input: RequirementLinkInput) => ({
  source_type: input.sourceType,
  source_id: input.sourceId,
  target_type: input.targetType,
  target_id: input.targetId,
  link_type: input.linkType,
  metadata: input.metadata ?? null,
  suspect: input.suspect ?? false,
  suspect_reason: input.suspectReason ?? null,
});

const toRequirementLinkRowPartial = (input: Partial<RequirementLinkInput>) => {
  const row: Partial<RequirementLinkRow> = {};
  if (input.sourceType !== undefined) row.source_type = input.sourceType;
  if (input.sourceId !== undefined) row.source_id = input.sourceId;
  if (input.targetType !== undefined) row.target_type = input.targetType;
  if (input.targetId !== undefined) row.target_id = input.targetId;
  if (input.linkType !== undefined) row.link_type = input.linkType;
  if (input.metadata !== undefined) row.metadata = input.metadata;
  if (input.suspect !== undefined) row.suspect = input.suspect;
  if (input.suspectReason !== undefined) row.suspect_reason = input.suspectReason;
  return row;
};


export const listRequirementLinksByProjectId = async (projectId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("requirement_links")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data as RequirementLinkRow[]).map(toRequirementLink), error: null };
};

export const listRequirementLinksByNodeId = async (
  nodeId: string,
  direction: "from" | "to" | "both" = "both",
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const normalizedId = nodeId.trim();
  if (!normalizedId) return { data: [], error: null };

  let query = supabase
    .from("requirement_links")
    .select("*")
    .order("updated_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  if (direction === "from") {
    query = query.eq("source_id", normalizedId);
  } else if (direction === "to") {
    query = query.eq("target_id", normalizedId);
  } else {
    query = query.or(`source_id.eq.${normalizedId},target_id.eq.${normalizedId}`);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as RequirementLinkRow[]).map(toRequirementLink), error: null };
};

export const listRequirementLinksBySource = async (
  sourceType: RequirementLinkNodeType,
  sourceId: string,
  projectId?: string
) => {
  return executeListQuery<RequirementLinkRow, ReturnType<typeof toRequirementLink>>(
    () => supabase
      .from("requirement_links")
      .select("*")
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .order("created_at", { ascending: true }),
    projectId,
    toRequirementLink
  );
};

export const listRequirementLinksBySourceIds = async (
  sourceType: RequirementLinkNodeType,
  sourceIds: string[],
  projectId?: string
) => {
  if (sourceIds.length === 0) return { data: [], error: null };

  return executeListQuery<RequirementLinkRow, ReturnType<typeof toRequirementLink>>(
    () => supabase
      .from("requirement_links")
      .select("*")
      .eq("source_type", sourceType)
      .in("source_id", sourceIds)
      .order("created_at", { ascending: true }),
    projectId,
    toRequirementLink
  );
};

export const listDdDependenciesBySourceIds = async (
  sourceDdIds: string[],
  projectId?: string
): Promise<{ data: DdDependencyLink[] | null; error: string | null }> => {
  const result = await listRequirementLinksBySourceIds("dd", sourceDdIds, projectId);
  if (result.error || !result.data) {
    return { data: null, error: result.error ?? "DD依存リンクの取得に失敗しました" };
  }

  const data = result.data
    .filter(
      (link) =>
        link.targetType === "dd" && isDdDependencyLinkType(link.linkType)
    )
    .map((link) => {
      const metadata = link.metadata ?? {};
      const asyncCompletionRaw =
        typeof metadata.asyncCompletion === "object" &&
        metadata.asyncCompletion !== null &&
        !Array.isArray(metadata.asyncCompletion)
          ? (metadata.asyncCompletion as Record<string, unknown>)
          : undefined;

      return {
        sourceDdId: link.sourceId,
        targetDdId: link.targetId,
        callType: link.linkType as DdDependencyCallType,
        callId:
          typeof metadata.callId === "string" && metadata.callId.length > 0
            ? metadata.callId
            : undefined,
        message:
          typeof metadata.message === "string" && metadata.message.length > 0
            ? metadata.message
            : undefined,
        returnsLabel:
          typeof metadata.returnsLabel === "string" &&
          metadata.returnsLabel.length > 0
            ? metadata.returnsLabel
            : undefined,
        returnSchemaRef:
          typeof metadata.returnSchemaRef === "string" &&
          metadata.returnSchemaRef.length > 0
            ? metadata.returnSchemaRef
            : undefined,
        errorLabel:
          typeof metadata.errorLabel === "string" &&
          metadata.errorLabel.length > 0
            ? metadata.errorLabel
            : undefined,
        errorSchemaRef:
          typeof metadata.errorSchemaRef === "string" &&
          metadata.errorSchemaRef.length > 0
            ? metadata.errorSchemaRef
            : undefined,
        errorExceptionRef:
          typeof metadata.errorExceptionRef === "string" &&
          metadata.errorExceptionRef.length > 0
            ? metadata.errorExceptionRef
            : undefined,
        ruleRef:
          typeof metadata.ruleRef === "string" && metadata.ruleRef.length > 0
            ? metadata.ruleRef
            : undefined,
        asyncCompletion: asyncCompletionRaw
          ? {
              callbackToDdId:
                typeof asyncCompletionRaw.callbackToDdId === "string" &&
                asyncCompletionRaw.callbackToDdId.length > 0
                  ? asyncCompletionRaw.callbackToDdId
                  : undefined,
              message:
                typeof asyncCompletionRaw.message === "string" &&
                asyncCompletionRaw.message.length > 0
                  ? asyncCompletionRaw.message
                  : undefined,
              timeoutMs:
                typeof asyncCompletionRaw.timeoutMs === "number"
                  ? asyncCompletionRaw.timeoutMs
                  : undefined,
              successLabel:
                typeof asyncCompletionRaw.successLabel === "string" &&
                asyncCompletionRaw.successLabel.length > 0
                  ? asyncCompletionRaw.successLabel
                  : undefined,
              successSchemaRef:
                typeof asyncCompletionRaw.successSchemaRef === "string" &&
                asyncCompletionRaw.successSchemaRef.length > 0
                  ? asyncCompletionRaw.successSchemaRef
                  : undefined,
              errorLabel:
                typeof asyncCompletionRaw.errorLabel === "string" &&
                asyncCompletionRaw.errorLabel.length > 0
                  ? asyncCompletionRaw.errorLabel
                  : undefined,
              errorSchemaRef:
                typeof asyncCompletionRaw.errorSchemaRef === "string" &&
                asyncCompletionRaw.errorSchemaRef.length > 0
                  ? asyncCompletionRaw.errorSchemaRef
                  : undefined,
              errorExceptionRef:
                typeof asyncCompletionRaw.errorExceptionRef === "string" &&
                asyncCompletionRaw.errorExceptionRef.length > 0
                  ? asyncCompletionRaw.errorExceptionRef
                  : undefined,
            }
          : undefined,
      };
    });

  return { data, error: null };
};

export const listRequirementLinksByTarget = async (
  targetType: RequirementLinkNodeType,
  targetId: string,
  projectId?: string
) => {
  return executeListQuery<RequirementLinkRow, ReturnType<typeof toRequirementLink>>(
    () => supabase
      .from("requirement_links")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: true }),
    projectId,
    toRequirementLink
  );
};

export const createRequirementLink = async (input: RequirementLinkCreateInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toRequirementLinkRowBase(input),
    project_id: input.projectId,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("requirement_links")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toRequirementLink(data as RequirementLinkRow), error: null };
};

export const createRequirementLinks = async (inputs: RequirementLinkCreateInput[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (inputs.length === 0) return { data: [], error: null };

  const now = new Date().toISOString();
  const payload = inputs.map((input) => ({
    ...toRequirementLinkRowBase(input),
    project_id: input.projectId,
    created_at: now,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("requirement_links")
    .insert(payload)
    .select("*");

  if (error) return { data: null, error: error.message };
  return { data: (data as RequirementLinkRow[]).map(toRequirementLink), error: null };
};

export const updateRequirementLink = async (
  id: string,
  input: Partial<RequirementLinkInput>,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toRequirementLinkRowPartial(input),
    updated_at: now,
  };

  let query = supabase
    .from("requirement_links")
    .update(payload)
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toRequirementLink(data as RequirementLinkRow), error: null };
};

export const deleteRequirementLink = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("requirement_links")
    .delete()
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const deleteRequirementLinksBySource = async (
  sourceType: RequirementLinkNodeType,
  sourceId: string,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("requirement_links")
    .delete()
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const deleteRequirementLinksBySourceIds = async (
  sourceType: RequirementLinkNodeType,
  sourceIds: string[],
  projectId?: string,
  linkType?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (sourceIds.length === 0) return { data: true, error: null };

  let query = supabase
    .from("requirement_links")
    .delete()
    .eq("source_type", sourceType)
    .in("source_id", sourceIds);

  if (linkType) {
    query = query.eq("link_type", linkType);
  }

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const syncDdDependenciesForSrf = async (params: {
  projectId: string;
  sourceDdIdsToReset: string[];
  validDdIds: string[];
  dependencies: DdDependencyLink[];
}): Promise<{ data: true | null; error: string | null }> => {
  const { projectId, sourceDdIdsToReset, validDdIds, dependencies } = params;

  const sourceIds = Array.from(new Set(sourceDdIdsToReset));
  const validDdIdSet = new Set(validDdIds);

  for (const callType of DD_DEPENDENCY_CALL_TYPES) {
    const { error } = await deleteRequirementLinksBySourceIds(
      "dd",
      sourceIds,
      projectId,
      callType
    );
    if (error) {
      return { data: null, error };
    }
  }

  const uniqueMap = new Map<string, DdDependencyLink>();
  for (const dependency of dependencies) {
    if (!isDdDependencyLinkType(dependency.callType)) continue;
    if (!validDdIdSet.has(dependency.sourceDdId)) continue;
    if (!validDdIdSet.has(dependency.targetDdId)) continue;
    if (dependency.sourceDdId === dependency.targetDdId) continue;

    const key = `${dependency.sourceDdId}:${dependency.targetDdId}:${dependency.callType}:${dependency.callId ?? ""}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, dependency);
    }
  }

  const createInputs = Array.from(uniqueMap.values()).map((dependency) => ({
    projectId,
    sourceType: "dd" as const,
    sourceId: dependency.sourceDdId,
    targetType: "dd" as const,
    targetId: dependency.targetDdId,
    linkType: dependency.callType,
    metadata: {
      callId: dependency.callId ?? null,
      message: dependency.message ?? null,
      returnsLabel: dependency.returnsLabel ?? null,
      returnSchemaRef: dependency.returnSchemaRef ?? null,
      errorLabel: dependency.errorLabel ?? null,
      errorSchemaRef: dependency.errorSchemaRef ?? null,
      errorExceptionRef: dependency.errorExceptionRef ?? null,
      ruleRef: dependency.ruleRef ?? null,
      asyncCompletion: dependency.asyncCompletion ?? null,
    },
    suspect: false,
  }));

  if (createInputs.length === 0) {
    return { data: true, error: null };
  }

  const { error: createError } = await createRequirementLinks(createInputs);
  if (createError) {
    return { data: null, error: createError };
  }

  return { data: true, error: null };
};

export const deleteRequirementLinksByTarget = async (
  targetType: RequirementLinkNodeType,
  targetId: string,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("requirement_links")
    .delete()
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

// ========================================
// High-Level Query APIs (Phase 2)
// ========================================

/**
 * SR IDから関連するBR IDsを取得する
 * @param srId - システム要件ID
 * @param projectId - プロジェクトID
 * @returns BR IDの配列（エラー時は空配列）
 */
export const listBrIdsBySrId = async (
  srId: string,
  projectId: string
): Promise<string[]> => {
  const result = await listRequirementLinksBySource("sr", srId, projectId);
  if (result.error || !result.data) {
    console.error(`[listBrIdsBySrId] Error:`, result.error);
    return [];
  }
  return result.data
    .filter((link) => link.targetType === "br" && link.linkType === "derived_from")
    .map((link) => link.targetId);
};

/**
 * BR IDから関連するSR IDsを取得する
 * @param brId - 業務要件ID
 * @param projectId - プロジェクトID
 * @returns SR IDの配列（エラー時は空配列）
 */
export const listSrIdsByBrId = async (
  brId: string,
  projectId: string
): Promise<string[]> => {
  const result = await listRequirementLinksByTarget("br", brId, projectId);
  if (result.error || !result.data) {
    console.error(`[listSrIdsByBrId] Error:`, result.error);
    return [];
  }
  return result.data
    .filter((link) => link.sourceType === "sr" && link.linkType === "derived_from")
    .map((link) => link.sourceId);
};

/**
 * 疑義リンク（suspect=true）の一覧を取得する
 * @param projectId - プロジェクトID
 * @returns 疑義リンクの配列（エラー時は空配列）
 */
/**
 * BR IDから関連するSF IDsを取得する（realizes リンク）
 * top-down分析で BR → SF の辿りに使用
 * @param brId - 業務要件ID
 * @param projectId - プロジェクトID
 * @returns SF IDの配列（エラー時は空配列）
 */
export const listSfIdsByBrId = async (
  brId: string,
  projectId: string
): Promise<string[]> => {
  const result = await listRequirementLinksBySource("br", brId, projectId);
  if (result.error || !result.data) {
    console.error(`[listSfIdsByBrId] Error:`, result.error);
    return [];
  }
  return result.data
    .filter((link) => link.targetType === "sf" && link.linkType === "realizes")
    .map((link) => link.targetId);
};

/**
 * 疑義リンクを解消する（suspect=false に設定）
 * @param id - リンクID
 * @param projectId - プロジェクトID
 */
export const resolveSuspectLink = async (id: string, projectId: string) => {
  return updateRequirementLink(id, { suspect: false, suspectReason: null }, projectId);
};

export const listSuspectLinks = async (
  projectId: string
): Promise<RequirementLink[]> => {
  const configError = failIfMissingConfig();
  if (configError) {
    console.error(`[listSuspectLinks] Config error:`, configError.error);
    return [];
  }

  const { data, error } = await supabase
    .from("requirement_links")
    .select("*")
    .eq("project_id", projectId)
    .eq("suspect", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error(`[listSuspectLinks] Error:`, error.message);
    return [];
  }

  return (data as RequirementLinkRow[]).map(toRequirementLink);
};

// ========================================
// 呼び出し元（受信方向）の管理
// ========================================

/**
 * 指定されたDD IDsに対する呼び出し元リンクを取得する
 * @param targetDdIds - 呼び出される側のDD IDs
 * @param projectId - プロジェクトID
 * @returns 呼び出し元リンクの配列
 */
export const listDdCallersByTargetIds = async (
  targetDdIds: string[],
  projectId?: string
): Promise<{ data: DdCallerLink[] | null; error: string | null }> => {
  if (targetDdIds.length === 0) return { data: [], error: null };

  const result = await executeListQuery<RequirementLinkRow, ReturnType<typeof toRequirementLink>>(
    () => supabase
      .from("requirement_links")
      .select("*")
      .eq("target_type", "dd")
      .in("target_id", targetDdIds)
      .in("link_type", ["called_by_user", ...DD_DEPENDENCY_CALL_TYPES])
      .order("created_at", { ascending: true }),
    projectId,
    toRequirementLink
  );

  if (result.error || !result.data) {
    return { data: null, error: result.error ?? "呼び出し元リンクの取得に失敗しました" };
  }

  // link_type から callerType を判定して DdCallerLink に変換
  const data: DdCallerLink[] = [];
  for (const link of result.data) {
    if (link.linkType === "called_by_user") {
      data.push({
        targetDdId: link.targetId,
        callerType: "user",
      });
      continue;
    }

    if (isDdDependencyLinkType(link.linkType)) {
      // calls_sync / calls_async は「呼び出す側→呼び出される側」の関係
      // ここでは逆方向（呼び出される側から見た呼び出し元）を扱っているため、
      // source が caller、target が被呼び出し側になる
      data.push({
        targetDdId: link.targetId,
        callerType: "system",
        callerDdId: link.sourceId,
        callType: link.linkType,
      });
    }
  }

  return { data, error: null };
};

/**
 * SF配下の全DDに対する呼び出し元リンクを同期する
 * @param params.projectId - プロジェクトID
 * @param params.targetDdIdsToReset - リセット対象のDD IDs
 * @param params.validDdIds - 有効なDD IDsのセット（参照整合性チェック用）
 * @param params.callers - 新しい呼び出し元リンクの配列
 * @returns 成功時は { data: true, error: null }
 */
export const syncDdCallersForSrf = async (params: {
  projectId: string;
  targetDdIdsToReset: string[];
  validDdIds: string[];
  callers: DdCallerLink[];
}): Promise<{ data: true | null; error: string | null }> => {
  const { projectId, targetDdIdsToReset, validDdIds, callers } = params;

  const targetIds = Array.from(new Set(targetDdIdsToReset));
  const validDdIdSet = new Set(validDdIds);

  // 1. 既存の呼び出し元リンクを削除（called_by_user, calls_sync, calls_async）
  const linkTypesToDelete = ["called_by_user", ...DD_DEPENDENCY_CALL_TYPES];
  for (const linkType of linkTypesToDelete) {
    const configError = failIfMissingConfig();
    if (configError) return configError;

    const { error } = await supabase
      .from("requirement_links")
      .delete()
      .eq("project_id", projectId)
      .eq("target_type", "dd")
      .in("target_id", targetIds)
      .eq("link_type", linkType);

    if (error) {
      return { data: null, error: error.message };
    }
  }

  // 2. 新しい呼び出し元リンクを作成
  const uniqueMap = new Map<string, RequirementLinkCreateInput>();
  for (const caller of callers) {
    // targetDdId の存在チェック
    if (!validDdIdSet.has(caller.targetDdId)) continue;

    if (caller.callerType === "user") {
      // ユーザー起動の場合
      const key = `user:${caller.targetDdId}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          projectId,
          sourceType: "dd", // 便宜上 dd としておく（sourceIdは空）
          sourceId: "",
          targetType: "dd",
          targetId: caller.targetDdId,
          linkType: "called_by_user",
          suspect: false,
        });
      }
    } else if (caller.callerType === "system") {
      // システム起動の場合
      if (!caller.callerDdId || !caller.callType) continue;
      if (!validDdIdSet.has(caller.callerDdId)) continue;
      if (!isDdDependencyLinkType(caller.callType)) continue;
      if (caller.callerDdId === caller.targetDdId) continue; // 自己参照を除外

      const key = `${caller.callerDdId}:${caller.targetDdId}:${caller.callType}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          projectId,
          sourceType: "dd",
          sourceId: caller.callerDdId,
          targetType: "dd",
          targetId: caller.targetDdId,
          linkType: caller.callType,
          suspect: false,
        });
      }
    }
  }

  const createInputs = Array.from(uniqueMap.values());

  if (createInputs.length === 0) {
    return { data: true, error: null };
  }

  const { error: createError } = await createRequirementLinks(createInputs);
  if (createError) {
    return { data: null, error: createError };
  }

  return { data: true, error: null };
};
