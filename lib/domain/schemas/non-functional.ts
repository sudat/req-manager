import { z } from "zod";

// 簡略化された非機能要件スキーマ（必要最小限の3項目のみ）
export const structuredNonFunctionalSchema = z.object({
  responseTimeP95: z.string().optional(), // 例: "200ms"
  uptime: z.string().optional(),           // 例: "99.9%"
  authMethod: z.enum(["oauth2", "oidc", "api_key", "mfa"]).optional(),
});
