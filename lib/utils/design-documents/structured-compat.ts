import type { DdType } from "@/lib/domain";
import {
  createEmptyStructuredDesignDocumentSpec,
  ddTypeToStructuredIoType,
  structuredDesignDocumentSpecSchema,
  type StructuredDesignDocumentIoType,
  type StructuredDesignDocumentSpec,
} from "@/lib/domain/schemas/design-document-structured";

type StructuredDetailsParseResult = {
  structuredSpec?: StructuredDesignDocumentSpec;
  parseError?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

export function parseStructuredDetails(
  details: Record<string, unknown> | null | undefined
): StructuredDetailsParseResult {
  const normalized = isRecord(details) ? details : {};
  const parsed = structuredDesignDocumentSpecSchema.safeParse(normalized);

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

export function composeStructuredDetails(
  structuredSpec?: StructuredDesignDocumentSpec
): Record<string, unknown> {
  return structuredSpec ?? {};
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
