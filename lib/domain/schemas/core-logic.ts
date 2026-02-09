import { z } from "zod";

/**
 * ビジネスルールのタイプ
 */
export const businessRuleTypeEnum = z.enum([
  "validation",        // 入力検証・妥当性チェック
  "calculation",       // 計算・演算
  "state_transition",  // 状態遷移
  "decision",          // 判定・分岐
  "aggregation",       // 集約・集計
]);

/**
 * ビジネスルール個別定義
 */
export const businessRuleSchema = z.object({
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

  formula: z
    .string()
    .optional()
    .describe("計算式や判定式（例: 税額 = 税抜金額 × 税率）"),

  preconditions: z
    .array(z.string())
    .optional()
    .describe("前提条件のリスト"),

  rounding: z
    .string()
    .optional()
    .describe("端数処理方法（例: 切り捨て、四捨五入、切り上げ）"),

  precision: z
    .string()
    .optional()
    .describe("精度・単位（例: 1円単位、小数点以下2桁）"),

  notes: z
    .string()
    .optional()
    .describe("補足事項・備考"),
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
