import { z } from "zod";

export const fieldTypeEnum = z.enum([
  "string",
  "number",
  "boolean",
  "enum",
  "object",
  "array",
]);

export const constraintsSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    format: z
      .enum([
        "email",
        "uuid",
        "url",
        "uri",
        "date",
        "datetime",
        "time",
        "ipv4",
        "ipv6",
        "hostname",
      ])
      .optional(),
    enum: z.array(z.string()).optional(),
    default: z.unknown().optional(),
    unique: z.boolean().optional(),
    errorMessage: z.string().optional(),
  })
  .optional();

export const fieldSchema = z.object({
  name: z.string().min(1, "フィールド名は必須"),
  type: fieldTypeEnum,
  required: z.boolean().default(true),
  description: z.string().optional(),
  constraints: constraintsSchema,
});

export const fieldArraySchema = z.array(fieldSchema);

export type FieldType = z.infer<typeof fieldTypeEnum>;
export type FieldConstraints = z.infer<typeof constraintsSchema>;
export type Field = z.infer<typeof fieldSchema>;
