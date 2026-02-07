import { z } from "zod";
import { fieldSchema, fieldArraySchema } from "./fields";

export const apiInputSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  path: z.string().min(1, "パスは必須"),
  query: fieldArraySchema.optional(),
  body: fieldArraySchema.optional(),
});
export type ApiInput = z.infer<typeof apiInputSchema>;

export const apiOutputSchema = z.object({
  success: z.object({
    status: z.number().min(100).max(599),
    fields: fieldArraySchema,
  }),
  error: z
    .array(
      z.object({
        status: z.number().min(100).max(599),
        fields: fieldArraySchema,
        description: z.string().optional(),
      })
    )
    .optional(),
});
export type ApiOutput = z.infer<typeof apiOutputSchema>;

export const screenInputSchema = z.object({
  trigger: z.enum(["click", "input", "load", "select"]),
  elements: fieldArraySchema.optional(),
});
export type ScreenInput = z.infer<typeof screenInputSchema>;

export const screenOutputSchema = z.object({
  transition: z.string().optional(),
  messages: z.array(z.string()).optional(),
});
export type ScreenOutput = z.infer<typeof screenOutputSchema>;

export const batchInputSchema = z.object({
  schedule: z.string(),
  source: z.string(),
  parameters: fieldArraySchema.optional(),
});
export type BatchInput = z.infer<typeof batchInputSchema>;

export const batchOutputSchema = z.object({
  summary: z.object({
    processedCount: z.number().min(0),
    successCount: z.number().min(0),
    errorCount: z.number().min(0),
    status: z.enum(["completed", "partial", "failed"]),
    executionTimeMs: z.number().optional(),
  }),
  nextBatch: z.string().optional(),
});
export type BatchOutput = z.infer<typeof batchOutputSchema>;

export const jobInputSchema = z.object({
  event: z.string(),
  payload: fieldArraySchema.optional(),
});
export type JobInput = z.infer<typeof jobInputSchema>;

export const jobOutputSchema = z.object({
  result: z.string(),
  nextEvent: z.string().optional(),
});
export type JobOutput = z.infer<typeof jobOutputSchema>;

export const structuredInputSchema = z.union([
  apiInputSchema,
  screenInputSchema,
  batchInputSchema,
  jobInputSchema,
]);

export const structuredOutputSchema = z.union([
  apiOutputSchema,
  screenOutputSchema,
  batchOutputSchema,
  jobOutputSchema,
]);

export type StructuredInput = z.infer<typeof structuredInputSchema>;
export type StructuredOutput = z.infer<typeof structuredOutputSchema>;
