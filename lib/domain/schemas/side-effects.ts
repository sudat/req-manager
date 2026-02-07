import { z } from "zod";
import { fieldArraySchema } from "./fields";

export const dbOperationSchema = z.object({
  table: z.string(),
  operation: z.enum(["insert", "update", "delete", "upsert"]),
  condition: z.string().optional(),
  affectedColumns: z.array(z.string()).optional(),
});

export const externalApiCallSchema = z.object({
  endpoint: z.string(),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  payload: fieldArraySchema.optional(),
  retryPolicy: z
    .object({
      maxRetries: z.number().default(3),
      backoffMs: z.number().default(1000),
    })
    .optional(),
});

export const eventPublishSchema = z.object({
  eventType: z.string(),
  payload: fieldArraySchema,
  destination: z.enum(["queue", "topic", "webhook"]),
  delayMs: z.number().optional(),
});

export const fileOutputSchema = z.object({
  path: z.string(),
  format: z.enum(["csv", "json", "xml", "pdf", "txt"]),
  encoding: z.enum(["utf-8", "shift-jis", "euc-jp"]).default("utf-8"),
  append: z.boolean().default(false),
});

export const logOutputSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error", "fatal"]),
  message: z.string(),
  structuredData: fieldArraySchema.optional(),
});

export const sideEffectSchema = z.object({
  description: z.string(),
  dbOperations: z.array(dbOperationSchema).optional(),
  externalApiCalls: z.array(externalApiCallSchema).optional(),
  events: z.array(eventPublishSchema).optional(),
  fileOutputs: z.array(fileOutputSchema).optional(),
  logs: z.array(logOutputSchema).optional(),
});
export type SideEffect = z.infer<typeof sideEffectSchema>;

export const batchSideEffectsSchema = z.object({
  fileOutputs: z.array(fileOutputSchema).min(1),
  dbOperations: z.array(dbOperationSchema).optional(),
  logs: z.array(logOutputSchema).optional(),
});
