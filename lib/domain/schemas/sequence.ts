import { z } from "zod";
import { sequenceActivationPolicyEnum } from "./side-effects";

export const sequenceModeEnum = z.enum(["auto", "guided"]);
export type SequenceMode = z.infer<typeof sequenceModeEnum>;

export const sequenceCallTypeEnum = z.enum(["sync", "async"]);
export type SequenceCallType = z.infer<typeof sequenceCallTypeEnum>;

export const sequenceFragmentEnum = z.enum(["alt", "opt", "loop", "par"]);
export type SequenceFragment = z.infer<typeof sequenceFragmentEnum>;

export const sequenceStepKindEnum = z.enum([
  "call",
  "effect_ref",
  "fragment",
  "ref",
  "note",
]);
export type SequenceStepKind = z.infer<typeof sequenceStepKindEnum>;

function validateErrorPath(
  value: {
    errorLabel?: string;
    errorSchemaRef?: string;
    errorExceptionRef?: string;
  },
  ctx: z.RefinementCtx
) {
  const hasErrorDetail = Boolean(value.errorLabel || value.errorSchemaRef);
  if (hasErrorDetail && !value.errorExceptionRef) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["errorExceptionRef"],
      message:
        "errorLabel / errorSchemaRef を指定する場合は errorExceptionRef も指定してください",
    });
  }
}

export const sequenceAsyncCompletionSchema = z
  .object({
    callbackToDdId: z
      .string()
      .min(1)
      .optional()
      .describe("非同期完了通知のコールバック先DD ID"),
    message: z
      .string()
      .min(1)
      .optional()
      .describe("非同期完了メッセージ"),
    timeoutMs: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("非同期完了待ちタイムアウト（ミリ秒）"),
    successLabel: z
      .string()
      .min(1)
      .optional()
      .describe("非同期完了（成功時）の戻りラベル"),
    successSchemaRef: z
      .string()
      .min(1)
      .optional()
      .describe("非同期完了（成功時）のスキーマ参照"),
    errorLabel: z
      .string()
      .min(1)
      .optional()
      .describe("非同期完了（失敗時）の戻りラベル"),
    errorSchemaRef: z
      .string()
      .min(1)
      .optional()
      .describe("非同期完了（失敗時）のスキーマ参照"),
    errorExceptionRef: z
      .string()
      .min(1)
      .optional()
      .describe("非同期完了（失敗時）に紐づく例外コード（exceptions[].errorCode）"),
  })
  .superRefine((value, ctx) => {
    validateErrorPath(value, ctx);
  });
export type SequenceAsyncCompletion = z.infer<
  typeof sequenceAsyncCompletionSchema
>;

export const sequenceCallStepSchema = z
  .object({
    kind: z.literal("call"),
    id: z.string().min(1).describe("callステップID（DD内一意）"),
    targetDdId: z.string().min(1).describe("呼び出し先DD ID"),
    callType: sequenceCallTypeEnum.default("sync"),
    message: z.string().min(1).optional().describe("呼び出しメッセージ"),
    returnLabel: z
      .string()
      .min(1)
      .optional()
      .describe("同期呼び出しの戻りラベル"),
    returnSchemaRef: z
      .string()
      .min(1)
      .optional()
      .describe("戻り値スキーマ参照"),
    errorLabel: z
      .string()
      .min(1)
      .optional()
      .describe("同期呼び出し失敗時の戻りラベル"),
    errorSchemaRef: z
      .string()
      .min(1)
      .optional()
      .describe("同期呼び出し失敗時のスキーマ参照"),
    errorExceptionRef: z
      .string()
      .min(1)
      .optional()
      .describe("失敗時に紐づく例外コード（exceptions[].errorCode）"),
    ruleRef: z
      .string()
      .min(1)
      .optional()
      .describe("紐付け対象のコアロジックルール名"),
    activation: sequenceActivationPolicyEnum
      .optional()
      .describe("シーケンス図のアクティベーション制御"),
    asyncCompletion: sequenceAsyncCompletionSchema.optional(),
  })
  .superRefine((value, ctx) => {
    validateErrorPath(value, ctx);
  });
export type SequenceCallStep = z.infer<typeof sequenceCallStepSchema>;

export const sequenceEffectRefSchema = z
  .string()
  .regex(
    /^(db|api|event|file):[A-Za-z0-9_-]+$/,
    "effect_ref は 'db:<id>' | 'api:<id>' | 'event:<id>' | 'file:<id>' 形式で指定してください"
  );

export const sequenceEffectRefStepSchema = z.object({
  kind: z.literal("effect_ref"),
  ref: sequenceEffectRefSchema,
  activation: sequenceActivationPolicyEnum
    .optional()
    .describe("シーケンス図のアクティベーション制御"),
});
export type SequenceEffectRefStep = z.infer<typeof sequenceEffectRefStepSchema>;

export const sequenceReferenceTargetSchema = z
  .object({
    ddId: z.string().min(1).optional(),
    srfId: z.string().min(1).optional(),
    url: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.ddId && !value.srfId && !value.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "target には ddId / srfId / url のいずれか1つ以上が必要です",
      });
    }
  });
export type SequenceReferenceTarget = z.infer<
  typeof sequenceReferenceTargetSchema
>;

export const sequenceReferenceStepSchema = z.object({
  kind: z.literal("ref"),
  title: z.string().min(1),
  target: sequenceReferenceTargetSchema,
});
export type SequenceReferenceStep = z.infer<typeof sequenceReferenceStepSchema>;

export const sequenceNoteStepSchema = z.object({
  kind: z.literal("note"),
  text: z.string().min(1),
});
export type SequenceNoteStep = z.infer<typeof sequenceNoteStepSchema>;

export type SequenceStep =
  | SequenceCallStep
  | SequenceEffectRefStep
  | SequenceFragmentStep
  | SequenceReferenceStep
  | SequenceNoteStep;

export type SequenceBranch = {
  name: string;
  guard?: string;
  steps: SequenceStep[];
};

export type SequenceFragmentStep = {
  kind: "fragment";
  fragment: SequenceFragment;
  label?: string;
  branches: SequenceBranch[];
};

export const sequenceStepSchema: z.ZodType<SequenceStep> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    sequenceCallStepSchema,
    sequenceEffectRefStepSchema,
    sequenceReferenceStepSchema,
    sequenceNoteStepSchema,
    z.object({
      kind: z.literal("fragment"),
      fragment: sequenceFragmentEnum,
      label: z.string().min(1).optional(),
      branches: z
        .array(
          z.object({
            name: z.string().min(1),
            guard: z.string().min(1).optional(),
            steps: z.array(sequenceStepSchema).default([]),
          })
        )
        .min(1),
    }),
  ])
);

export const sequenceSpecSchema = z
  .object({
    mode: sequenceModeEnum.default("auto"),
    entryActor: z
      .object({
        label: z.string().min(1),
      })
      .optional(),
    steps: z.array(sequenceStepSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "guided" && value.steps.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["steps"],
        message: "mode='guided' の場合は steps を1件以上指定してください",
      });
    }

    for (const [stepIndex, step] of value.steps.entries()) {
      if (step.kind !== "fragment") continue;

      if ((step.fragment === "alt" || step.fragment === "par") && step.branches.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", stepIndex, "branches"],
          message: `${step.fragment} フラグメントは2分岐以上が必要です`,
        });
      }
    }
  });
export type SequenceSpec = z.infer<typeof sequenceSpecSchema>;
