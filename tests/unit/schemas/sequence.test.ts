import { describe, expect, it } from "vitest";
import { sequenceSpecSchema } from "@/lib/domain/schemas/sequence";

describe("sequenceSpecSchema", () => {
  it("auto mode can omit steps", () => {
    const result = sequenceSpecSchema.safeParse({
      mode: "auto",
    });
    expect(result.success).toBe(true);
  });

  it("guided mode requires steps", () => {
    const result = sequenceSpecSchema.safeParse({
      mode: "guided",
      steps: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts call/effect_ref/ref/note steps", () => {
    const result = sequenceSpecSchema.safeParse({
      mode: "guided",
      steps: [
        {
          kind: "call",
          id: "call_1",
          targetDdId: "DD-SF-AR-0001-002",
          callType: "sync",
          message: "請求書発行API呼び出し",
          returnLabel: "処理結果",
        },
        {
          kind: "effect_ref",
          ref: "db:save_invoice",
        },
        {
          kind: "ref",
          title: "共通エラーハンドリング",
          target: { srfId: "SF-AR-0099" },
        },
        {
          kind: "note",
          text: "ここで画面メッセージ表示",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("par fragment requires two branches", () => {
    const result = sequenceSpecSchema.safeParse({
      mode: "guided",
      steps: [
        {
          kind: "fragment",
          fragment: "par",
          branches: [
            {
              name: "branch-1",
              steps: [],
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects call error detail without errorExceptionRef", () => {
    const result = sequenceSpecSchema.safeParse({
      mode: "guided",
      steps: [
        {
          kind: "call",
          id: "call_1",
          targetDdId: "DD-SF-AR-0001-002",
          callType: "sync",
          errorLabel: "保存失敗",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts asyncCompletion success/error details", () => {
    const result = sequenceSpecSchema.safeParse({
      mode: "guided",
      steps: [
        {
          kind: "call",
          id: "call_async_1",
          targetDdId: "DD-SF-AR-0001-002",
          callType: "async",
          asyncCompletion: {
            callbackToDdId: "DD-SF-AR-0001-001",
            timeoutMs: 5000,
            successLabel: "完了通知",
            errorLabel: "失敗通知",
            errorExceptionRef: "ASYNC_TIMEOUT",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
