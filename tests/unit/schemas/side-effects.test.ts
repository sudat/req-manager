import { describe, expect, it } from "vitest";
import {
  dbOperationSchema,
  externalApiCallSchema,
  eventPublishSchema,
  fileOutputSchema,
  sideEffectSchema,
  batchSideEffectsSchema,
  type SideEffect,
} from "@/lib/domain/schemas/side-effects";

describe("side-effects schema", () => {
  describe("dbOperationSchema", () => {
    it("最小構成でパースできる", () => {
      const data = {
        table: "users",
        operation: "insert" as const,
      };
      expect(() => dbOperationSchema.parse(data)).not.toThrow();
    });

    it("全フィールドを含むデータをパースできる", () => {
      const data = {
        table: "users",
        operation: "update" as const,
        condition: "id = ${userId}",
        affectedColumns: ["status", "updated_at"],
      };
      const result = dbOperationSchema.parse(data);
      expect(result.table).toBe("users");
      expect(result.operation).toBe("update");
      expect(result.condition).toBe("id = ${userId}");
      expect(result.affectedColumns).toEqual(["status", "updated_at"]);
    });

    it("有効なoperation種別", () => {
      ["insert", "update", "delete", "upsert"].forEach((op) => {
        expect(() =>
          dbOperationSchema.parse({ table: "test", operation: op })
        ).not.toThrow();
      });
    });

    it("無効なoperationはエラー", () => {
      expect(() =>
        dbOperationSchema.parse({ table: "test", operation: "invalid" })
      ).toThrow();
    });

    it("tableが必須", () => {
      expect(() => dbOperationSchema.parse({ operation: "insert" })).toThrow();
    });

    it("ruleRef/activationを受け入れる", () => {
      const data = {
        id: "update_user",
        table: "users",
        operation: "update" as const,
        ruleRef: "user_update_rule",
        activation: "force" as const,
      };
      const result = dbOperationSchema.parse(data);
      expect(result.id).toBe("update_user");
      expect(result.ruleRef).toBe("user_update_rule");
      expect(result.activation).toBe("force");
    });

    it("response.success/errorを受け入れる", () => {
      const data = {
        table: "users",
        operation: "update" as const,
        response: {
          successLabel: "更新完了",
          successSchemaRef: "outputSchema.success",
          errorLabel: "更新失敗",
          errorExceptionRef: "USER_UPDATE_FAILED",
        },
      };
      const result = dbOperationSchema.parse(data);
      expect(result.response?.successLabel).toBe("更新完了");
      expect(result.response?.errorExceptionRef).toBe("USER_UPDATE_FAILED");
    });

    it("response.errorLabelのみはエラー（errorExceptionRef必須）", () => {
      expect(() =>
        dbOperationSchema.parse({
          table: "users",
          operation: "update",
          response: {
            errorLabel: "更新失敗",
          },
        })
      ).toThrow();
    });
  });

  describe("externalApiCallSchema", () => {
    it("最小構成でパースできる", () => {
      const data = {
        endpoint: "https://api.example.com/v1/users",
        method: "GET" as const,
      };
      expect(() => externalApiCallSchema.parse(data)).not.toThrow();
    });

    it("全フィールドを含むデータをパースできる", () => {
      const data = {
        endpoint: "https://api.example.com/v1/users",
        method: "POST" as const,
        payload: [
          {
            name: "email",
            type: "string",
            required: true,
            description: "ユーザーメールアドレス",
          },
        ],
        retryPolicy: {
          maxRetries: 5,
          backoffMs: 2000,
        },
      };
      const result = externalApiCallSchema.parse(data);
      expect(result.endpoint).toBe("https://api.example.com/v1/users");
      expect(result.retryPolicy?.maxRetries).toBe(5);
    });

    it("有効なmethod種別", () => {
      ["GET", "POST", "PUT", "DELETE"].forEach((method) => {
        expect(() =>
          externalApiCallSchema.parse({
            endpoint: "https://api.example.com",
            method,
          })
        ).not.toThrow();
      });
    });

    it("retryPolicyのデフォルト値が適用される", () => {
      const data = {
        endpoint: "https://api.example.com",
        method: "GET" as const,
        retryPolicy: {},
      };
      const result = externalApiCallSchema.parse(data);
      expect(result.retryPolicy?.maxRetries).toBe(3);
      expect(result.retryPolicy?.backoffMs).toBe(1000);
    });

    it("activation=noneを受け入れる", () => {
      const data = {
        id: "call_external",
        endpoint: "https://api.example.com",
        method: "POST" as const,
        activation: "none" as const,
      };
      const result = externalApiCallSchema.parse(data);
      expect(result.id).toBe("call_external");
      expect(result.activation).toBe("none");
    });
  });

  describe("eventPublishSchema", () => {
    it("最小構成でパースできる", () => {
      const data = {
        eventType: "order.created",
        payload: [],
        destination: "queue" as const,
      };
      expect(() => eventPublishSchema.parse(data)).not.toThrow();
    });

    it("全フィールドを含むデータをパースできる", () => {
      const data = {
        eventType: "user.registered",
        payload: [
          {
            name: "userId",
            type: "string",
            required: true,
          },
        ],
        destination: "topic" as const,
        delayMs: 60000,
      };
      const result = eventPublishSchema.parse(data);
      expect(result.eventType).toBe("user.registered");
      expect(result.delayMs).toBe(60000);
    });

    it("有効なdestination種別", () => {
      ["queue", "topic", "webhook"].forEach((dest) => {
        expect(() =>
          eventPublishSchema.parse({
            eventType: "test",
            payload: [],
            destination: dest,
          })
        ).not.toThrow();
      });
    });

    it("delayMsはオプション", () => {
      const data = {
        eventType: "test",
        payload: [],
        destination: "queue" as const,
      };
      const result = eventPublishSchema.parse(data);
      expect(result.delayMs).toBeUndefined();
    });

    it("ruleRefを受け入れる", () => {
      const data = {
        id: "publish_order_completed",
        eventType: "order.completed",
        payload: [],
        destination: "topic" as const,
        ruleRef: "publish_event",
      };
      const result = eventPublishSchema.parse(data);
      expect(result.id).toBe("publish_order_completed");
      expect(result.ruleRef).toBe("publish_event");
    });
  });

  describe("fileOutputSchema", () => {
    it("最小構成でパースできる", () => {
      const data = {
        id: "invoice_csv",
        path: "/output/reports/daily.csv",
        format: "csv" as const,
      };
      const result = fileOutputSchema.parse(data);
      expect(result.id).toBe("invoice_csv");
    });

    it("有効なformat種別", () => {
      ["csv", "json", "xml", "pdf", "txt"].forEach((fmt) => {
        expect(() =>
          fileOutputSchema.parse({
            path: "/output/test",
            format: fmt,
          })
        ).not.toThrow();
      });
    });

    it("s3パスも許可する", () => {
      const data = {
        path: "s3://bucket/data/export.json",
        format: "json" as const,
      };
      expect(() => fileOutputSchema.parse(data)).not.toThrow();
    });
  });

  describe("sideEffectSchema", () => {
    it("descriptionのみでパースできる（副作用なし）", () => {
      const data: SideEffect = {
        description: "副作用なし",
      };
      expect(() => sideEffectSchema.parse(data)).not.toThrow();
    });

    it("dbOperationsを含むデータをパースできる", () => {
      const data: SideEffect = {
        description: "ユーザー作成時に在庫を減算",
        dbOperations: [
          {
            table: "users",
            operation: "insert",
          },
          {
            table: "inventory",
            operation: "update",
            condition: "product_id = ${productId}",
            affectedColumns: ["quantity"],
          },
        ],
      };
      expect(() => sideEffectSchema.parse(data)).not.toThrow();
    });

    it("externalApiCallsを含むデータをパースできる", () => {
      const data: SideEffect = {
        description: "Welcomeメールを送信",
        externalApiCalls: [
          {
            endpoint: "https://api.example.com/v1/send",
            method: "POST",
          },
        ],
      };
      expect(() => sideEffectSchema.parse(data)).not.toThrow();
    });

    it("eventsを含むデータをパースできる", () => {
      const data: SideEffect = {
        description: "注文確定イベントを発行",
        events: [
          {
            eventType: "order.confirmed",
            payload: [],
            destination: "queue",
          },
        ],
      };
      expect(() => sideEffectSchema.parse(data)).not.toThrow();
    });

    it("fileOutputsを含むデータをパースできる", () => {
      const data: SideEffect = {
        description: "レポートを出力",
        fileOutputs: [
          {
            path: "/output/reports/daily.csv",
            format: "csv",
          },
        ],
      };
      expect(() => sideEffectSchema.parse(data)).not.toThrow();
    });

    it("全ての副作用タイプを含むデータをパースできる", () => {
      const data: SideEffect = {
        description: "注文処理の副作用",
        dbOperations: [
          {
            table: "orders",
            operation: "insert",
          },
        ],
        externalApiCalls: [
          {
            endpoint: "https://payment-api.com/charge",
            method: "POST",
          },
        ],
        events: [
          {
            eventType: "order.created",
            payload: [],
            destination: "topic",
          },
        ],
        fileOutputs: [
          {
            path: "/output/orders/report.pdf",
            format: "pdf",
          },
        ],
      };
      expect(() => sideEffectSchema.parse(data)).not.toThrow();
    });

    it("descriptionが必須", () => {
      expect(() =>
        sideEffectSchema.parse({
          dbOperations: [{ table: "test", operation: "insert" }],
        })
      ).toThrow();
    });

    it("空のdescriptionも許可される（実装の仕様）", () => {
      // 注: 実装では空文字も許可されている（.min(1)がない）
      const result = sideEffectSchema.parse({ description: "" });
      expect(result.description).toBe("");
    });
  });

  describe("batchSideEffectsSchema", () => {
    it("fileOutputsのみでパースできる", () => {
      const data = {
        fileOutputs: [
          {
            path: "/output/reports/daily.csv",
            format: "csv",
          },
        ],
      };
      expect(() => batchSideEffectsSchema.parse(data)).not.toThrow();
    });

    it("dbOperationsも含めることができる", () => {
      const data = {
        fileOutputs: [
          {
            path: "/output/reports/daily.csv",
            format: "csv",
          },
        ],
        dbOperations: [
          {
            table: "batch_logs",
            operation: "insert",
          },
        ],
      };
      expect(() => batchSideEffectsSchema.parse(data)).not.toThrow();
    });

    it("fileOutputsが必須で1件以上", () => {
      expect(() => batchSideEffectsSchema.parse({})).toThrow();
      expect(() =>
        batchSideEffectsSchema.parse({ fileOutputs: [] })
      ).toThrow();
    });

    it("dbOperationsはオプション", () => {
      const data = {
        fileOutputs: [
          {
            path: "/output/test.csv",
            format: "csv",
          },
        ],
      };
      const result = batchSideEffectsSchema.parse(data);
      expect(result.dbOperations).toBeUndefined();
    });
  });

  describe("現実的なユースケース", () => {
    it("請求書発行APIの副作用", () => {
      const data: SideEffect = {
        description: "請求書発行時にデータベースを更新し、メールを送信",
        dbOperations: [
          {
            table: "invoices",
            operation: "insert",
          },
          {
            table: "billing_events",
            operation: "insert",
          },
        ],
        externalApiCalls: [
          {
            endpoint: "${EMAIL_SERVICE_API}/send",
            method: "POST",
            retryPolicy: {
              maxRetries: 3,
              backoffMs: 1000,
            },
          },
        ],
        events: [
          {
            eventType: "invoice.issued",
            payload: [],
            destination: "topic",
          },
        ],
      };
      expect(() => sideEffectSchema.parse(data)).not.toThrow();
    });

    it("バッチ処理のレポート出力", () => {
      const data = {
        fileOutputs: [
          {
            path: "s3://reports/daily-sales.csv",
            format: "csv",
          },
          {
            path: "/tmp/summary.json",
            format: "json",
          },
        ],
        dbOperations: [
          {
            table: "batch_execution_logs",
            operation: "insert",
          },
        ],
      };
      expect(() => batchSideEffectsSchema.parse(data)).not.toThrow();
    });
  });
});
