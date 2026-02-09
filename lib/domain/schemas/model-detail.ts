import { z } from "zod";

/**
 * モデル属性の定義（テーブルのカラムに相当）
 */
export const modelAttributeSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe("属性名（物理名）"),

  logicalName: z
    .string()
    .optional()
    .describe("論理名（日本語等、わかりやすい名称）"),

  type: z
    .string()
    .min(1)
    .describe("データ型（例: string, number, boolean, Date, UUID）"),

  primaryKey: z
    .boolean()
    .optional()
    .describe("主キーかどうか"),

  nullable: z
    .boolean()
    .optional()
    .describe("NULL許容かどうか"),

  unique: z
    .boolean()
    .optional()
    .describe("UNIQUE制約があるかどうか"),

  foreignKey: z
    .boolean()
    .optional()
    .describe("外部キー制約があるかどうか"),

  description: z
    .string()
    .optional()
    .describe("属性の説明"),

  constraints: z
    .string()
    .optional()
    .describe("その他の制約条件（例: CHECK制約の内容）"),

  enumValues: z
    .array(z.string())
    .optional()
    .describe("列挙型の場合の取りうる値リスト"),
});

export type ModelAttribute = z.infer<typeof modelAttributeSchema>;

/**
 * モデル間のリレーション定義
 */
export const modelRelationshipTypeEnum = z.enum([
  "1:1",   // 1対1
  "1:N",   // 1対多
  "N:1",   // 多対1
  "N:M",   // 多対多
]);

export const modelRelationshipSchema = z.object({
  target: z
    .string()
    .min(1)
    .describe("関連先のエンティティ名"),

  type: modelRelationshipTypeEnum
    .describe("関連の種別"),

  description: z
    .string()
    .optional()
    .describe("関連の説明"),

  columnMappings: z
    .array(
      z.object({
        source: z.string().min(1).describe("このテーブルのカラム名"),
        target: z.string().min(1).describe("関連先テーブルのカラム名"),
      })
    )
    .optional()
    .describe("FK のカラムマッピング（1:1, 1:N, N:1 の場合）。N:M の場合は不要。"),
});

export type ModelRelationship = z.infer<typeof modelRelationshipSchema>;

/**
 * 状態遷移の定義
 */
export const stateTransitionSchema = z.object({
  from: z
    .string()
    .min(1)
    .describe("遷移元の状態"),

  to: z
    .array(z.string())
    .min(1)
    .describe("遷移先の状態リスト"),

  condition: z
    .string()
    .optional()
    .describe("遷移条件"),
});

export type StateTransition = z.infer<typeof stateTransitionSchema>;
