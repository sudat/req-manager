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
  legacyDetails: Record<string, unknown>;
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
  const maybeWrappedSpec = normalized.structuredSpec;

  if (maybeWrappedSpec === undefined) {
    const flatParsed = structuredDesignDocumentSpecSchema.safeParse(normalized);
    if (flatParsed.success) {
      return {
        structuredSpec: flatParsed.data,
        legacyDetails: normalized,
      };
    }

    const maybeStructuredHint =
      "ioType" in normalized ||
      "inputFields" in normalized ||
      "outputFields" in normalized ||
      "boundaries" in normalized;

    return {
      structuredSpec: undefined,
      legacyDetails: normalized,
      parseError: maybeStructuredHint
        ? flatParsed.error.issues
            .map((issue) => `${summarizeZodIssuePath(issue.path)}: ${issue.message}`)
            .join(", ")
        : undefined,
    };
  }

  const parsed = structuredDesignDocumentSpecSchema.safeParse(maybeWrappedSpec);

  if (!parsed.success) {
    const parseError = parsed.error.issues
      .map((issue) => `${summarizeZodIssuePath(issue.path)}: ${issue.message}`)
      .join(", ");
    return {
      structuredSpec: undefined,
      legacyDetails: normalized,
      parseError,
    };
  }

  return {
    structuredSpec: parsed.data,
    legacyDetails: normalized,
  };
}

export function composeStructuredDetails(params: {
  structuredSpec?: StructuredDesignDocumentSpec;
  legacyDetails?: Record<string, unknown>;
}): Record<string, unknown> {
  const { structuredSpec, legacyDetails } = params;
  const normalizedLegacy = isRecord(legacyDetails) ? legacyDetails : {};

  if (!structuredSpec) {
    return normalizedLegacy;
  }

  return structuredSpec;
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
  const synced: StructuredDesignDocumentSpec = {
    ...spec,
    ioType: nextIoType,
    typeDetail: undefined,
  };

  if (isCoreIoType(nextIoType)) {
    const empty = createEmptyStructuredDesignDocumentSpec(nextIoType);
    if (!synced.inputSchema) synced.inputSchema = empty.inputSchema;
    if (!synced.outputSchema) synced.outputSchema = empty.outputSchema;
    return synced;
  }

  synced.inputSchema = undefined;
  synced.outputSchema = undefined;
  return synced;
}
