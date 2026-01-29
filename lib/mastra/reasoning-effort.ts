export const reasoningEffortValues = ['minimal', 'low', 'medium', 'high'] as const;

export type ReasoningEffort = (typeof reasoningEffortValues)[number];

export const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'medium';

export const reasoningEffortOptions: ReadonlyArray<{
  value: ReasoningEffort;
  label: string;
}> = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const isReasoningEffort = (value: unknown): value is ReasoningEffort => {
  if (typeof value !== 'string') return false;
  return (reasoningEffortValues as readonly string[]).includes(value);
};
