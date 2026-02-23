import { describe, expect, it } from "bun:test";
import type { SequenceSpec } from "../../../../../../lib/domain/schemas/sequence";
import {
  appendSequenceStep,
  patchSequenceStep,
  removeSequenceStep,
} from "../../../../../../components/forms/design-document/editors/shared/sequence-update";

describe("sequence-update helper", () => {
  const baseSequence: SequenceSpec = {
    mode: "guided",
    steps: [
      {
        kind: "call",
        id: "call_1",
        targetDdId: "DD-001",
        callType: "sync",
      },
      {
        kind: "note",
        text: "before",
      },
    ],
  };

  it("指定インデックスのステップを更新できる", () => {
    const next = patchSequenceStep(baseSequence, 1, { text: "after" });

    expect(next.steps).toHaveLength(2);
    expect(next.steps[1]?.kind).toBe("note");
    if (next.steps[1]?.kind === "note") {
      expect(next.steps[1].text).toBe("after");
    }

    if (baseSequence.steps[1]?.kind === "note") {
      expect(baseSequence.steps[1].text).toBe("before");
    }
  });

  it("指定インデックスのステップを削除できる", () => {
    const next = removeSequenceStep(baseSequence, 0);

    expect(next.steps).toHaveLength(1);
    expect(next.steps[0]?.kind).toBe("note");
  });

  it("ステップを末尾に追加できる", () => {
    const next = appendSequenceStep(baseSequence, {
      kind: "effect_ref",
      ref: "db:op_1",
    });

    expect(next.steps).toHaveLength(3);
    expect(next.steps[2]?.kind).toBe("effect_ref");
    if (next.steps[2]?.kind === "effect_ref") {
      expect(next.steps[2].ref).toBe("db:op_1");
    }
  });

  it("範囲外インデックスの更新は既存配列を維持する", () => {
    const next = patchSequenceStep(baseSequence, 99, { text: "noop" });

    expect(next.steps).toEqual(baseSequence.steps);
  });
});
