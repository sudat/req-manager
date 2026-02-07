import { z } from "zod";

export const performanceSchema = z.object({
  responseTime: z
    .object({
      p95: z.string(),
      p99: z.string().optional(),
      condition: z.string().optional(),
    })
    .optional(),
  throughput: z
    .object({
      rps: z.number(),
      condition: z.string().optional(),
    })
    .optional(),
  concurrency: z
    .object({
      maxUsers: z.number(),
      condition: z.string().optional(),
    })
    .optional(),
});

export const availabilitySchema = z.object({
  uptime: z.string(),
  monthlyDowntime: z.string(),
  rto: z.string().optional(),
  rpo: z.string().optional(),
});

export const securitySchema = z.object({
  auth: z
    .object({
      method: z.enum(["oauth2", "oidc", "api_key", "mfa"]),
      sessionTimeout: z.string().optional(),
    })
    .optional(),
  encryption: z
    .object({
      inTransit: z.enum(["tls1.2", "tls1.3"]),
      atRest: z.enum(["aes256", "chacha20"]),
    })
    .optional(),
  compliance: z
    .array(z.enum(["gdpr", "pii", "pci_dss", "iso27001"]))
    .optional(),
});

export const observabilitySchema = z.object({
  logging: z
    .object({
      format: z.enum(["json", "structured"]),
      retention: z.string(),
      includeFields: z.array(z.string()),
    })
    .optional(),
  metrics: z
    .object({
      collection: z.enum(["prometheus", "cloudwatch", "datadog"]),
      scrapeInterval: z.string(),
    })
    .optional(),
  tracing: z
    .object({
      enabled: z.boolean(),
      samplingRate: z.number(),
    })
    .optional(),
  alerting: z
    .object({
      channels: z.array(z.enum(["email", "slack", "pagerduty"])),
      responseTime: z.string(),
    })
    .optional(),
});

export const structuredNonFunctionalSchema = z.object({
  performance: performanceSchema.optional(),
  availability: availabilitySchema.optional(),
  security: securitySchema.optional(),
  observability: observabilitySchema.optional(),
});
