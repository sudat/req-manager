import { describe, expect, it } from "bun:test";
import type { SideEffect } from "../../../lib/domain/schemas/side-effects";
import {
  collectSideEffectsByRuleName,
  countSideEffects,
  getSideEffectKindLabel,
} from "../../../lib/utils/design-documents/side-effect-rule-link";

describe("side-effect-rule-link", () => {
  it("ruleRefごとに副作用を収集できる", () => {
    const sideEffects: SideEffect = {
      description: "副作用テスト",
      dbOperations: [
        { table: "users", operation: "insert", ruleRef: " validate_user " },
        { table: "audit_logs", operation: "insert" },
      ],
      externalApiCalls: [
        { endpoint: "/api/users", method: "POST", ruleRef: "validate_user" },
      ],
      events: [
        {
          eventType: "user.created",
          destination: "topic",
          payload: [],
          ruleRef: "notify_user",
        },
      ],
      fileOutputs: [
        { path: "/tmp/users.csv", format: "csv", ruleRef: "validate_user" },
      ],
    };

    const map = collectSideEffectsByRuleName(sideEffects);

    const validateItems = map.get("validate_user") ?? [];
    expect(validateItems).toHaveLength(3);
    expect(validateItems[0]?.kind).toBe("db");
    expect(validateItems[1]?.kind).toBe("api");
    expect(validateItems[2]?.kind).toBe("file");

    const notifyItems = map.get("notify_user") ?? [];
    expect(notifyItems).toHaveLength(1);
    expect(notifyItems[0]?.label).toContain("EVENT");
  });

  it("ruleRef未指定の副作用は収集対象にしない", () => {
    const map = collectSideEffectsByRuleName({
      description: "no rule ref",
      dbOperations: [{ table: "users", operation: "insert" }],
    });

    expect(map.size).toBe(0);
  });

  it("副作用件数を集計できる", () => {
    expect(countSideEffects(undefined)).toBe(0);

    const count = countSideEffects({
      description: "count test",
      dbOperations: [{ table: "users", operation: "insert" }],
      externalApiCalls: [{ endpoint: "/a", method: "GET" }],
      events: [{ eventType: "x", destination: "topic", payload: [] }],
      fileOutputs: [{ path: "/tmp/x.csv", format: "csv" }],
    });

    expect(count).toBe(4);
  });

  it("副作用種別ラベルを返す", () => {
    expect(getSideEffectKindLabel("db")).toBe("DB");
    expect(getSideEffectKindLabel("api")).toBe("API");
    expect(getSideEffectKindLabel("event")).toBe("Event");
    expect(getSideEffectKindLabel("file")).toBe("File");
  });
});
