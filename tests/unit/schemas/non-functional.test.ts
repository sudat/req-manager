import { describe, expect, it } from "vitest";
import {
  structuredNonFunctionalSchema,
  type StructuredNonFunctional,
} from "@/lib/domain/schemas/non-functional";

describe("non-functional schema", () => {
  describe("structuredNonFunctionalSchema", () => {
    it("空オブジェクトでパースできる", () => {
      const data: StructuredNonFunctional = {};
      expect(() => structuredNonFunctionalSchema.parse(data)).not.toThrow();
    });

    it("responseTimeP95のみ", () => {
      const data: StructuredNonFunctional = {
        responseTimeP95: "200ms",
      };
      const result = structuredNonFunctionalSchema.parse(data);
      expect(result.responseTimeP95).toBe("200ms");
    });

    it("uptimeのみ", () => {
      const data: StructuredNonFunctional = {
        uptime: "99.9%",
      };
      const result = structuredNonFunctionalSchema.parse(data);
      expect(result.uptime).toBe("99.9%");
    });

    it("authMethodのみ", () => {
      const data: StructuredNonFunctional = {
        authMethod: "oauth2",
      };
      const result = structuredNonFunctionalSchema.parse(data);
      expect(result.authMethod).toBe("oauth2");
    });

    it("authorizationBoundaryのみ", () => {
      const data: StructuredNonFunctional = {
        authorizationBoundary: "billing:invoice:issue権限が必要",
      };
      const result = structuredNonFunctionalSchema.parse(data);
      expect(result.authorizationBoundary).toBe("billing:invoice:issue権限が必要");
    });

    it("全フィールドを含むデータをパースできる", () => {
      const data: StructuredNonFunctional = {
        responseTimeP95: "1s",
        uptime: "99.99%",
        authMethod: "oidc",
        authorizationBoundary: "admin権限が必要",
      };
      expect(() => structuredNonFunctionalSchema.parse(data)).not.toThrow();
    });

    it("有効なauthMethod値", () => {
      const validMethods = ["oauth2", "oidc", "api_key", "mfa"] as const;
      validMethods.forEach((method) => {
        const data: StructuredNonFunctional = { authMethod: method };
        expect(() => structuredNonFunctionalSchema.parse(data)).not.toThrow();
      });
    });

    it("無効なauthMethodはエラー", () => {
      const data: StructuredNonFunctional = {
        authMethod: "invalid" as any,
      };
      expect(() => structuredNonFunctionalSchema.parse(data)).toThrow();
    });
  });

  describe("現実的なユースケース", () => {
    it("APIエンドポイントの非機能要件", () => {
      const data: StructuredNonFunctional = {
        responseTimeP95: "200ms",
        uptime: "99.9%",
        authMethod: "api_key",
        authorizationBoundary: "APIキーが必要",
      };
      expect(() => structuredNonFunctionalSchema.parse(data)).not.toThrow();
    });

    it("バッチ処理の非機能要件", () => {
      const data: StructuredNonFunctional = {
        responseTimeP95: "30s",
        uptime: "99%",
      };
      expect(() => structuredNonFunctionalSchema.parse(data)).not.toThrow();
    });

    it("認証付き画面の非機能要件", () => {
      const data: StructuredNonFunctional = {
        responseTimeP95: "500ms",
        authMethod: "mfa",
        authorizationBoundary: "2要素認証済みユーザーのみアクセス可能",
      };
      expect(() => structuredNonFunctionalSchema.parse(data)).not.toThrow();
    });
  });
});
