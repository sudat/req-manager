import { describe, expect, it } from "vitest";
import {
  exceptionTypeSchema,
  recoveryStrategySchema,
  structuredExceptionSchema,
  type StructuredException,
} from "@/lib/domain/schemas/exceptions";

describe("exceptions schema", () => {
  describe("exceptionTypeSchema", () => {
    it("有効な例外タイプ", () => {
      const validTypes = [
        "validation",
        "state",
        "permission",
        "external",
        "timeout",
        "conflict",
      ] as const;
      validTypes.forEach((type) => {
        expect(() => exceptionTypeSchema.parse(type)).not.toThrow();
      });
    });

    it("無効な例外タイプはエラー", () => {
      expect(() => exceptionTypeSchema.parse("invalid")).toThrow();
    });
  });

  describe("recoveryStrategySchema", () => {
    it("有効なリカバリ戦略", () => {
      const validStrategies = [
        "none",
        "retry_immediate",
        "retry_with_backoff",
        "fallback",
        "manual_intervention",
        "circuit_breaker",
      ] as const;
      validStrategies.forEach((strategy) => {
        expect(() => recoveryStrategySchema.parse(strategy)).not.toThrow();
      });
    });

    it("無効なリカバリ戦略はエラー", () => {
      expect(() => recoveryStrategySchema.parse("invalid")).toThrow();
    });
  });

  describe("structuredExceptionSchema", () => {
    it("最小構成でパースできる", () => {
      const data: StructuredException = {
        type: "validation",
        condition: "メールアドレスが既に登録されている",
        errorCode: "EMAIL_ALREADY_EXISTS",
        message: "指定されたメールアドレスは既に登録されています",
        recovery: "none",
      };
      expect(() => structuredExceptionSchema.parse(data)).not.toThrow();
    });

    it("全フィールドを含むデータをパースできる", () => {
      const data: StructuredException = {
        type: "external",
        condition: "外部APIがタイムアウト",
        httpStatus: 503,
        errorCode: "EXTERNAL_API_TIMEOUT",
        message: "外部サービスが一時的に利用できません",
        userNotification: "toast",
        logging: "error",
        recovery: "retry_with_backoff",
        retryPolicy: {
          maxRetries: 5,
          backoffMs: 2000,
        },
      };
      const result = structuredExceptionSchema.parse(data);
      expect(result.httpStatus).toBe(503);
      expect(result.userNotification).toBe("toast");
      expect(result.retryPolicy?.maxRetries).toBe(5);
    });

    it("typeが必須", () => {
      const data = {
        condition: "test",
        errorCode: "TEST",
        message: "test",
        recovery: "none",
      };
      expect(() => structuredExceptionSchema.parse(data)).toThrow();
    });

    it("conditionが必須", () => {
      const data = {
        type: "validation",
        errorCode: "TEST",
        message: "test",
        recovery: "none",
      };
      expect(() => structuredExceptionSchema.parse(data)).toThrow();
    });

    it("errorCodeが必須", () => {
      const data = {
        type: "validation",
        condition: "test",
        message: "test",
        recovery: "none",
      };
      expect(() => structuredExceptionSchema.parse(data)).toThrow();
    });

    it("messageが必須", () => {
      const data = {
        type: "validation",
        condition: "test",
        errorCode: "TEST",
        recovery: "none",
      };
      expect(() => structuredExceptionSchema.parse(data)).toThrow();
    });

    it("recoveryが必須", () => {
      const data = {
        type: "validation",
        condition: "test",
        errorCode: "TEST",
        message: "test",
      };
      expect(() => structuredExceptionSchema.parse(data)).toThrow();
    });

    it("httpStatusはオプション", () => {
      const data: StructuredException = {
        type: "validation",
        condition: "test",
        errorCode: "TEST",
        message: "test",
        recovery: "none",
      };
      const result = structuredExceptionSchema.parse(data);
      expect(result.httpStatus).toBeUndefined();
    });

    it("userNotificationはオプション", () => {
      const data: StructuredException = {
        type: "validation",
        condition: "test",
        errorCode: "TEST",
        message: "test",
        recovery: "none",
      };
      const result = structuredExceptionSchema.parse(data);
      expect(result.userNotification).toBeUndefined();
    });

    it("loggingはオプション", () => {
      const data: StructuredException = {
        type: "validation",
        condition: "test",
        errorCode: "TEST",
        message: "test",
        recovery: "none",
      };
      const result = structuredExceptionSchema.parse(data);
      expect(result.logging).toBeUndefined();
    });

    it("retryPolicyはオプション", () => {
      const data: StructuredException = {
        type: "timeout",
        condition: "test",
        errorCode: "TEST",
        message: "test",
        recovery: "retry_with_backoff",
      };
      const result = structuredExceptionSchema.parse(data);
      expect(result.retryPolicy).toBeUndefined();
    });

    it("retryPolicyのデフォルト値が適用される", () => {
      const data = {
        type: "timeout",
        condition: "test",
        errorCode: "TEST",
        message: "test",
        recovery: "retry_with_backoff",
        retryPolicy: {},
      };
      const result = structuredExceptionSchema.parse(data);
      expect(result.retryPolicy?.maxRetries).toBe(3);
      expect(result.retryPolicy?.backoffMs).toBe(1000);
    });
  });

  describe("現実的なユースケース", () => {
    it("バリデーション例外", () => {
      const data: StructuredException = {
        type: "validation",
        condition: "メールアドレスの形式が不正",
        httpStatus: 400,
        errorCode: "INVALID_EMAIL_FORMAT",
        message: "有効なメールアドレスを入力してください",
        userNotification: "inline",
        logging: "none",
        recovery: "none",
      };
      expect(() => structuredExceptionSchema.parse(data)).not.toThrow();
    });

    it("権限例外", () => {
      const data: StructuredException = {
        type: "permission",
        condition: "ユーザーがリソースへのアクセス権を持たない",
        httpStatus: 403,
        errorCode: "ACCESS_DENIED",
        message: "この操作を実行する権限がありません",
        userNotification: "page",
        logging: "audit",
        recovery: "none",
      };
      expect(() => structuredExceptionSchema.parse(data)).not.toThrow();
    });

    it("外部APIタイムアウト", () => {
      const data: StructuredException = {
        type: "external",
        condition: "外部APIが30秒以内に応答しない",
        httpStatus: 504,
        errorCode: "EXTERNAL_API_TIMEOUT",
        message: "外部サービスが一時的に利用できません",
        userNotification: "modal",
        logging: "error",
        recovery: "retry_with_backoff",
        retryPolicy: {
          maxRetries: 3,
          backoffMs: 5000,
        },
      };
      expect(() => structuredExceptionSchema.parse(data)).not.toThrow();
    });

    it("排他競合", () => {
      const data: StructuredException = {
        type: "conflict",
        condition: "同じリソースが同時に更新されている",
        httpStatus: 409,
        errorCode: "CONCURRENT_UPDATE",
        message: "他のユーザーが更新を行いました。再度確認してください",
        userNotification: "toast",
        logging: "structured",
        recovery: "manual_intervention",
      };
      expect(() => structuredExceptionSchema.parse(data)).not.toThrow();
    });
  });
});
