import type { SequenceSpec, SequenceStep } from "@/lib/domain/schemas/sequence";
import { removeAtIndex, updateAtIndex } from "@/lib/utils/array-updates";

export function patchSequenceStep(
  sequence: SequenceSpec,
  index: number,
  patch: Partial<SequenceStep>
): SequenceSpec {
  return {
    ...sequence,
    steps: updateAtIndex(sequence.steps, index, patch),
  };
}

export function removeSequenceStep(sequence: SequenceSpec, index: number): SequenceSpec {
  return {
    ...sequence,
    steps: removeAtIndex(sequence.steps, index),
  };
}

export function appendSequenceStep(sequence: SequenceSpec, step: SequenceStep): SequenceSpec {
  return {
    ...sequence,
    steps: [...sequence.steps, step],
  };
}
