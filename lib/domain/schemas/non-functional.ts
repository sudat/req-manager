import { z } from "zod";

// 簡略化された非機能要件スキーマ（必要最小限の3項目のみ）
export const structuredNonFunctionalSchema = z
  .object({
    responseTimeP95: z
      .string()
      .optional()
      .describe(
        "95パーセンタイルレスポンス時間の目標値（例: '200ms', '1s', '500ms'）。処理時間の95%がこの時間内に完了することを保証。パフォーマンス要件として定義"
      ),
    uptime: z
      .string()
      .optional()
      .describe(
        "稼働率（可用性）の目標値（例: '99.9%', '99.99%'）。99.9%は月約43分、99.99%は月約4.3分のダウンタイム許容。SLA（サービス品質保証）として定義"
      ),
    authMethod: z
      .enum(["oauth2", "oidc", "api_key", "mfa"])
      .optional()
      .describe(
        "認証方式。oauth2はOAuth 2.0トークン認証、oidcはOpenID Connect、api_keyはAPIキー、mfaは多要素認証。セキュリティ要件として定義"
      ),
    authorizationBoundary: z
      .string()
      .optional()
      .describe("認可境界。必要な権限やロール（例: 'billing:invoice:issue権限が必要'）"),
  })
  .describe(
    "非機能要件定義。機能要件「何をするか」に対して、品質属性「どのように」を定義。パフォーマンス、可用性、セキュリティ、拡張性、運用性等の非機能要件を記述"
  );
