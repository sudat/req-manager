import { z } from "zod";

export const exceptionTypeSchema = z.enum([
  "validation",
  "state",
  "permission",
  "external",
  "timeout",
  "conflict",
]);

export const recoveryStrategySchema = z.enum([
  "none",
  "retry_immediate",
  "retry_with_backoff",
  "fallback",
  "manual_intervention",
  "circuit_breaker",
]);

export const structuredExceptionSchema = z.object({
  type: exceptionTypeSchema,
  condition: z.string(),
  httpStatus: z.number().optional(),
  errorCode: z.string(),
  message: z.string(),
  userNotification: z.enum(["none", "inline", "toast", "modal", "page"]).optional(),
  logging: z.enum(["none", "structured", "audit", "error"]).optional(),
  recovery: recoveryStrategySchema,
  retryPolicy: z
    .object({
      maxRetries: z.number().default(3),
      backoffMs: z.number().default(1000),
    })
    .optional(),
});
