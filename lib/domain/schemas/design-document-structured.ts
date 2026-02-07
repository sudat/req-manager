import { z } from "zod";
import type { DdType } from "../enums";
import { structuredExceptionSchema } from "./exceptions";
import { fieldArraySchema } from "./fields";
import {
  apiInputSchema,
  apiOutputSchema,
  batchInputSchema,
  type BatchInput,
  type BatchOutput,
  batchOutputSchema,
  jobInputSchema,
  type JobInput,
  type JobOutput,
  jobOutputSchema,
  screenInputSchema,
  type ScreenInput,
  type ScreenOutput,
  screenOutputSchema,
  type ApiInput,
  type ApiOutput,
} from "./io-schemas";
import { structuredNonFunctionalSchema } from "./non-functional";
import { sideEffectSchema } from "./side-effects";

export const structuredDesignDocumentIoTypeSchema = z.enum([
  "api",
  "screen",
  "batch",
  "job",
  "external_if",
  "model",
  "report",
]);
export type StructuredDesignDocumentIoType = z.infer<
  typeof structuredDesignDocumentIoTypeSchema
>;

export const invariantSchema = z.object({
  name: z.string().min(1, "不変条件名は必須です"),
  description: z.string().min(1, "不変条件の説明は必須です"),
  expression: z.string().optional(),
});
export type StructuredInvariant = z.infer<typeof invariantSchema>;

const transactionBoundarySchema = z.object({
  begin: z.string().optional(),
  commit: z.string().optional(),
  rollback: z.string().optional(),
});

const authorizationBoundarySchema = z.object({
  checkPoint: z.string().optional(),
  requiredRoles: z.array(z.string()).optional(),
  onFailure: z.string().optional(),
});

const idempotencyBoundarySchema = z.object({
  keySource: z.string().optional(),
  deduplicationRule: z.string().optional(),
  onDuplicate: z.string().optional(),
});

export const ddBoundariesSchema = z.object({
  transaction: transactionBoundarySchema.optional(),
  authorization: authorizationBoundarySchema.optional(),
  idempotency: idempotencyBoundarySchema.optional(),
  allowPaths: z.array(z.string().min(1)).default([]),
  denyPaths: z.array(z.string().min(1)).default([]),
});
export type DdBoundaries = z.infer<typeof ddBoundariesSchema>;

const typeDetailSchema = z.discriminatedUnion("ioType", [
  z.object({
    ioType: z.literal("api"),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional(),
    path: z.string().optional(),
  }),
  z.object({
    ioType: z.literal("screen"),
    route: z.string().optional(),
    trigger: z.enum(["click", "input", "load", "select"]).optional(),
  }),
  z.object({
    ioType: z.literal("batch"),
    schedule: z.string().optional(),
    source: z.string().optional(),
  }),
  z.object({
    ioType: z.literal("job"),
    event: z.string().optional(),
  }),
  z.object({
    ioType: z.literal("external_if"),
    protocol: z.string().optional(),
    endpoint: z.string().optional(),
  }),
  z.object({
    ioType: z.literal("model"),
    entity: z.string().optional(),
    table: z.string().optional(),
  }),
  z.object({
    ioType: z.literal("report"),
    format: z.enum(["pdf", "csv", "xlsx", "json"]).optional(),
    outputPath: z.string().optional(),
  }),
]);
export type StructuredTypeDetail = z.infer<typeof typeDetailSchema>;

export const structuredDesignDocumentSpecSchema = z
  .object({
    version: z.literal("1").default("1"),
    ioType: structuredDesignDocumentIoTypeSchema,
    typeDetail: typeDetailSchema.optional(),
    inputSchema: z
      .union([apiInputSchema, screenInputSchema, batchInputSchema, jobInputSchema])
      .optional(),
    outputSchema: z
      .union([apiOutputSchema, screenOutputSchema, batchOutputSchema, jobOutputSchema])
      .optional(),
    inputFields: fieldArraySchema.default([]),
    outputFields: fieldArraySchema.default([]),
    sideEffects: sideEffectSchema.default({
      description: "副作用なし",
    }),
    invariants: z.array(invariantSchema).default([]),
    exceptions: z.array(structuredExceptionSchema).default([]),
    nonFunctional: structuredNonFunctionalSchema.default({}),
    boundaries: ddBoundariesSchema.default({
      allowPaths: [],
      denyPaths: [],
    }),
  })
  .superRefine((value, ctx) => {
    if (value.typeDetail && value.typeDetail.ioType !== value.ioType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["typeDetail", "ioType"],
        message: "typeDetail.ioType は ioType と一致させてください",
      });
    }

    if (value.ioType === "api") {
      if (value.inputSchema && !("method" in value.inputSchema)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["inputSchema"],
          message: "api の inputSchema は API形式で入力してください",
        });
      }
      if (value.outputSchema && !("success" in value.outputSchema)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["outputSchema"],
          message: "api の outputSchema は API形式で入力してください",
        });
      }
    }
  });
export type StructuredDesignDocumentSpec = z.infer<
  typeof structuredDesignDocumentSpecSchema
>;

const createDefaultInputByIoType = (
  ioType: "api" | "screen" | "batch" | "job"
): ApiInput | ScreenInput | BatchInput | JobInput => {
  switch (ioType) {
    case "api":
      return { method: "POST", path: "/", query: [], body: [] };
    case "screen":
      return { trigger: "click", elements: [] };
    case "batch":
      return { schedule: "", source: "", parameters: [] };
    case "job":
      return { event: "", payload: [] };
  }
};

const createDefaultOutputByIoType = (
  ioType: "api" | "screen" | "batch" | "job"
): ApiOutput | ScreenOutput | BatchOutput | JobOutput => {
  switch (ioType) {
    case "api":
      return { success: { status: 200, fields: [] }, error: [] };
    case "screen":
      return { transition: "", messages: [] };
    case "batch":
      return {
        summary: { processedCount: 0, successCount: 0, errorCount: 0, status: "completed" },
        nextBatch: "",
      };
    case "job":
      return { result: "", nextEvent: "" };
  }
};

const DD_TYPE_TO_IO_TYPE: Record<DdType, StructuredDesignDocumentIoType> = {
  screen: "screen",
  api: "api",
  batch: "batch",
  external_if: "external_if",
  model: "model",
  report: "report",
  job: "job",
};

export function ddTypeToStructuredIoType(ddType: DdType): StructuredDesignDocumentIoType {
  return DD_TYPE_TO_IO_TYPE[ddType] ?? "screen";
}

export function createEmptyStructuredDesignDocumentSpec(
  ioType: StructuredDesignDocumentIoType
): StructuredDesignDocumentSpec {
  const spec: StructuredDesignDocumentSpec = {
    version: "1",
    ioType,
    inputFields: [],
    outputFields: [],
    sideEffects: { description: "副作用なし" },
    invariants: [],
    exceptions: [],
    nonFunctional: {},
    boundaries: { allowPaths: [], denyPaths: [] },
  };

  if (ioType === "api" || ioType === "screen" || ioType === "batch" || ioType === "job") {
    spec.inputSchema = createDefaultInputByIoType(ioType);
    spec.outputSchema = createDefaultOutputByIoType(ioType);
  }

  return spec;
}
