import type { DdType } from "@/lib/domain";
import {
  createEmptyStructuredDesignDocumentSpec,
  ddTypeToStructuredIoType,
  structuredDesignDocumentSpecSchema,
  type StructuredDesignDocumentIoType,
  type StructuredDesignDocumentSpec,
} from "@/lib/domain/schemas/design-document-structured";
import { isRecord } from "@/lib/utils/type-guards";

type StructuredDetailsParseResult = {
  structuredSpec?: StructuredDesignDocumentSpec;
  parseError?: string;
};

const summarizeZodIssuePath = (path: readonly PropertyKey[]) =>
  path.length === 0
    ? "root"
    : path
        .filter((part): part is string | number => typeof part === "string" || typeof part === "number")
        .map((part) => String(part))
        .join(".");

const isCoreIoType = (
  ioType: StructuredDesignDocumentIoType
): ioType is "api" | "screen" | "batch" | "job" =>
  ioType === "api" || ioType === "screen" || ioType === "batch" || ioType === "job";

const SCREEN_TRIGGER_MAP: Record<string, "click" | "input" | "load" | "select"> = {
  user_action: "click",
  button_click: "click",
  form_input: "input",
  page_load: "load",
  dropdown_select: "select",
};

/**
 * typeDetail.ioType をトップレベル ioType に同期する正規化（Issue ② 対策）
 * Zod discriminatedUnion はキーが必須なので、欠落時にトップレベルから補完
 */
function normalizeTypeDetail(raw: Record<string, unknown>): Record<string, unknown> {
  const result = { ...raw };
  const topLevelIoType = raw.ioType;
  if (typeof topLevelIoType !== "string") return result;

  const typeDetail = raw.typeDetail;
  if (isRecord(typeDetail) && typeDetail.ioType !== topLevelIoType) {
    result.typeDetail = { ...typeDetail, ioType: topLevelIoType };
  }
  return result;
}

function normalizeLegacyScreenTrigger(raw: Record<string, unknown>): Record<string, unknown> {
  const result = { ...raw };
  if (raw.ioType !== "screen" || !isRecord(raw.inputSchema)) return result;

  const trigger = raw.inputSchema.trigger;
  if (typeof trigger !== "string") return result;
  if (trigger === "click" || trigger === "input" || trigger === "load" || trigger === "select") {
    return result;
  }

  result.inputSchema = {
    ...raw.inputSchema,
    trigger: SCREEN_TRIGGER_MAP[trigger] ?? "click",
  };
  return result;
}

export function parseStructuredDetails(
  details: Record<string, unknown> | null | undefined
): StructuredDetailsParseResult {
  const normalized = isRecord(details) ? details : {};

  // typeDetail.ioType 正規化（トップレベル ioType から補完）
  const withTypeDetail = normalizeTypeDetail(normalized);

  // 旧 trigger 値（user_action 等）を現行 enum に正規化
  const withNormalizedTrigger = normalizeLegacyScreenTrigger(withTypeDetail);

  // 後方互換マイグレーション: 旧 inputFields/outputFields を新 dataFields に移行
  const migrated = migrateLegacyFields(withNormalizedTrigger);

  const parsed = structuredDesignDocumentSpecSchema.safeParse(migrated);

  if (!parsed.success) {
    if (Object.keys(normalized).length === 0) {
      return { structuredSpec: undefined, parseError: undefined };
    }
    const parseError = parsed.error.issues
      .map((issue) => `${summarizeZodIssuePath(issue.path)}: ${issue.message}`)
      .join(", ");
    return {
      structuredSpec: undefined,
      parseError,
    };
  }

  return {
    structuredSpec: parsed.data,
  };
}

/**
 * 後方互換マイグレーション: 旧 inputFields/outputFields を inputSchema/outputSchema.dataFields に移行
 * DBマイグレーション不要。保存時に新形式で書き戻される。
 */
function migrateLegacyFields(
  raw: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...raw };

  // 旧 inputFields を inputSchema.dataFields に移行
  if (
    Array.isArray(raw.inputFields) &&
    raw.inputFields.length > 0 &&
    isRecord(raw.inputSchema)
  ) {
    const existingDataFields = Array.isArray(raw.inputSchema.dataFields)
      ? raw.inputSchema.dataFields
      : [];
    result.inputSchema = {
      ...raw.inputSchema,
      dataFields: [...existingDataFields, ...raw.inputFields],
    };
    delete result.inputFields;
  }

  // 旧 outputFields を outputSchema.dataFields に移行
  if (
    Array.isArray(raw.outputFields) &&
    raw.outputFields.length > 0 &&
    isRecord(raw.outputSchema)
  ) {
    const existingDataFields = Array.isArray(raw.outputSchema.dataFields)
      ? raw.outputSchema.dataFields
      : [];
    result.outputSchema = {
      ...raw.outputSchema,
      dataFields: [...existingDataFields, ...raw.outputFields],
    };
    delete result.outputFields;
  }

  return result;
}

export function composeStructuredDetails(
  structuredSpec?: StructuredDesignDocumentSpec
): Record<string, unknown> {
  if (!structuredSpec) return {};

  const withSideEffectIds: StructuredDesignDocumentSpec = {
    ...structuredSpec,
    sideEffects: {
      ...structuredSpec.sideEffects,
      dbOperations: (structuredSpec.sideEffects.dbOperations ?? []).map(
        (operation, index) => ({
          ...operation,
          id: operation.id?.trim() || `db_${index + 1}`,
        })
      ),
      externalApiCalls: (structuredSpec.sideEffects.externalApiCalls ?? []).map(
        (apiCall, index) => ({
          ...apiCall,
          id: apiCall.id?.trim() || `api_${index + 1}`,
        })
      ),
      events: (structuredSpec.sideEffects.events ?? []).map((event, index) => ({
        ...event,
        id: event.id?.trim() || `event_${index + 1}`,
      })),
      fileOutputs: (structuredSpec.sideEffects.fileOutputs ?? []).map(
        (fileOutput, index) => ({
          ...fileOutput,
          id: fileOutput.id?.trim() || `file_${index + 1}`,
        })
      ),
    },
  };

  return withSideEffectIds;
}

export function createStructuredSpecFromDdType(ddType: DdType): StructuredDesignDocumentSpec {
  const ioType = ddTypeToStructuredIoType(ddType);
  return createEmptyStructuredDesignDocumentSpec(ioType);
}

export function syncStructuredSpecToDdType(
  spec: StructuredDesignDocumentSpec,
  ddType: DdType
): StructuredDesignDocumentSpec {
  const nextIoType = ddTypeToStructuredIoType(ddType);

  // 既存のtypeDetailを保存（同じioTypeの場合は復旧する）
  const prevTypeDetail = spec.typeDetail?.ioType === nextIoType ? spec.typeDetail : undefined;

  const synced: StructuredDesignDocumentSpec = {
    ...spec,
    ioType: nextIoType,
    typeDetail: undefined, // 一旦クリア
  };

  if (isCoreIoType(nextIoType)) {
    // コアI/Oタイプ（api/screen/batch/job）の場合
    const empty = createEmptyStructuredDesignDocumentSpec(nextIoType);
    if (!synced.inputSchema) synced.inputSchema = empty.inputSchema;
    if (!synced.outputSchema) synced.outputSchema = empty.outputSchema;
    synced.typeDetail = prevTypeDetail; // 同じioTypeなら復旧
  } else {
    // モデル等の非コアI/Oタイプの場合
    synced.inputSchema = undefined;
    synced.outputSchema = undefined;
    synced.typeDetail = prevTypeDetail; // 同じioTypeなら復旧
  }

  return synced;
}
