import { z } from "zod";

/**
 * ビジネスルールのタイプ（純粋な業務ロジック）
 *
 * coreLogicはインメモリで完結する純粋なビジネスルールを定義する。
 * 外部状態の変更（DB操作、API呼出し等）はsideEffectsで定義する。
 */
export const businessRuleTypeEnum = z.enum([
  "validate",   // 検証・妥当性チェック
  "read",       // 抽出・参照
  "derive",     // 算出・計算・変換・集計
  "decide",     // 判定・分岐・選択（状態遷移の決定を含む）
]);

export const sequenceFragmentTypeEnum = z.enum(["alt", "opt", "loop", "par"]);
export type SequenceFragmentType = z.infer<typeof sequenceFragmentTypeEnum>;

export const sequenceBranchEnum = z.enum(["if", "else"]);
export type SequenceBranch = z.infer<typeof sequenceBranchEnum>;

export const preconditionViolationBehaviorSchema = z
  .object({
    preconditionIndex: z
      .number()
      .int()
      .min(0)
      .describe("紐付け対象の前提条件インデックス（preconditions配列の位置）"),
    exceptionIndex: z
      .number()
      .int()
      .min(0)
      .describe("違反時に参照する例外インデックス（exceptions配列の位置）"),
  })
  .describe("前提条件違反時の挙動マッピング");
export type PreconditionViolationBehavior = z.infer<
  typeof preconditionViolationBehaviorSchema
>;

export const businessRuleSequenceSchema = z
  .object({
    fragmentType: sequenceFragmentTypeEnum
      .optional()
      .describe("シーケンス図のフラグメント種別（alt/opt/loop）"),
    fragmentGroup: z
      .string()
      .min(1)
      .optional()
      .describe("複数ルールを同一フラグメントとして束ねる識別子"),
    branch: sequenceBranchEnum
      .optional()
      .describe("altフラグメント時の分岐（if/else）"),
    guard: z
      .string()
      .min(1)
      .optional()
      .describe("フラグメントに表示するガード条件"),
    loopLabel: z
      .string()
      .min(1)
      .optional()
      .describe("loopフラグメントに表示するラベル"),
  })
  .superRefine((value, ctx) => {
    if (value.branch === "else" && value.fragmentType !== "alt") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branch"],
        message: "branch='else' は fragmentType='alt' の場合のみ指定できます",
      });
    }
  });

/**
 * ビジネスルール個別定義
 */
export const businessRuleSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .describe("ルール識別名（例: tax_calculation, order_validation）"),

    type: businessRuleTypeEnum
      .describe("ルールの種別"),

    description: z
      .string()
      .min(1)
      .describe("ルールの説明文"),

    formulas: z
      .array(z.string())
      .optional()
      .describe("計算式や判定式のリスト（例: 税額 = 税抜金額 × 税率）"),

    preconditions: z
      .array(z.string())
      .optional()
      .describe("前提条件のリスト"),

    preconditionViolations: z
      .array(preconditionViolationBehaviorSchema)
      .optional()
      .describe("前提条件違反時の挙動マッピング（既存exceptionsへの参照）"),

    notes: z
      .array(z.string())
      .optional()
      .describe("補足事項・備考のリスト"),

    sequence: businessRuleSequenceSchema
      .optional()
      .describe("シーケンス図生成に使用するフラグメント制御情報"),
  })
  .superRefine((value, ctx) => {
    const preconditions = value.preconditions ?? [];
    const seen = new Set<number>();

    for (const [index, item] of (value.preconditionViolations ?? []).entries()) {
      if (item.preconditionIndex >= preconditions.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["preconditionViolations", index, "preconditionIndex"],
          message: "preconditionIndex が preconditions の範囲外です",
        });
      }

      if (seen.has(item.preconditionIndex)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["preconditionViolations", index, "preconditionIndex"],
          message: "同一の前提条件に複数の違反挙動は設定できません",
        });
      }
      seen.add(item.preconditionIndex);
    }
  });

export type BusinessRule = z.infer<typeof businessRuleSchema>;

/**
 * コアロジック全体定義
 */
export const coreLogicSchema = z.object({
  summary: z
    .string()
    .optional()
    .describe("コアロジック全体の概要説明"),

  rules: z
    .array(businessRuleSchema)
    .default([])
    .describe("ビジネスルールのリスト"),
});

export type CoreLogic = z.infer<typeof coreLogicSchema>;
