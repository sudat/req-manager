import { describe, it, expect } from "bun:test";
import { fieldSchema } from "../../../lib/domain/schemas/fields";
import {
  apiInputSchema,
  apiOutputSchema,
  screenInputSchema,
  screenOutputSchema,
} from "../../../lib/domain/schemas/io-schemas";

describe("fieldSchema", () => {
  it("requires name", () => {
    expect(() => fieldSchema.parse({ type: "string" })).toThrow();
  });

  it("applies defaults", () => {
    const result = fieldSchema.parse({ name: "amount", type: "number" });
    expect(result.required).toBe(true);
  });
});

describe("api schemas", () => {
  it("accepts minimal api input", () => {
    const result = apiInputSchema.parse({
      method: "POST",
      path: "/api/invoices",
    });
    expect(result.method).toBe("POST");
  });

  it("accepts api output with success", () => {
    const result = apiOutputSchema.parse({
      success: { status: 200, fields: [] },
    });
    expect(result.success.status).toBe(200);
  });
});

describe("screen schemas", () => {
  it("accepts screen input with action context", () => {
    const result = screenInputSchema.parse({
      trigger: "click",
      action: "請求書を発行",
      targetElement: "一括発行ボタン",
      precondition: "請求対象が1件以上選択されている",
      elements: [],
    });
    expect(result.trigger).toBe("click");
    expect(result.action).toBe("請求書を発行");
  });

  it("accepts screen output with behavior details", () => {
    const result = screenOutputSchema.parse({
      transition: "/billing/invoices",
      messages: ["発行を受け付けました"],
      behavior: "発行ジョブをキュー投入する",
      displayChanges: "対象行のステータスを発行待ちに更新",
    });
    expect(result.messages?.[0]).toBe("発行を受け付けました");
    expect(result.behavior).toContain("キュー投入");
  });
});
