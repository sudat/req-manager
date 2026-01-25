import { z } from "zod";
import type { SystemDesignItem } from "../enums";

/**
 * 設計観点（SystemRequirementCategoryを再利用）
 */
export const designPerspectiveSchema = z.enum([
  "function",
  "data",
  "exception",
  "auth",
  "non_functional",
]);
export type DesignPerspective = z.infer<typeof designPerspectiveSchema>;

/**
 * 対象物の種別
 */
export const designTargetTypeSchema = z.enum([
  "screen",    // 画面
  "batch",     // バッチ
  "api",       // API
  "job",       // ジョブ
  "template",  // テンプレート
  "service",   // サービス
]);
export type DesignTargetType = z.infer<typeof designTargetTypeSchema>;

/**
 * 対象物
 */
export const designTargetSchema = z.object({
  name: z.string().min(1, "対象物の名前は必須です"),
  type: designTargetTypeSchema,
  entryPoint: z.string().nullable().optional(),
});
export type DesignTarget = z.infer<typeof designTargetSchema>;

/**
 * 機能観点のcontent
 */
export const functionDesignContentSchema = z.object({
  input: z.string().min(1, "入力は必須です"),
  process: z.string().min(1, "処理は必須です"),
  output: z.string().min(1, "出力は必須です"),
  sideEffects: z.string().optional(),
});
export type FunctionDesignContent = z.infer<typeof functionDesignContentSchema>;

/**
 * データ観点のcontent
 */
export const dataDesignContentSchema = z.object({
  fields: z.string().min(1, "対象項目は必須です"),
  tables: z.array(z.string()).optional(),
  constraints: z.string().optional(),
  migration: z.string().optional(),
});
export type DataDesignContent = z.infer<typeof dataDesignContentSchema>;

/**
 * 例外観点のcontent
 */
export const exceptionDesignContentSchema = z.object({
  errorCases: z.string().min(1, "エラーケースは必須です"),
  userNotification: z.string().optional(),
  logging: z.string().optional(),
  recovery: z.string().optional(),
});
export type ExceptionDesignContent = z.infer<typeof exceptionDesignContentSchema>;

/**
 * 認証・認可観点のcontent
 */
export const authDesignContentSchema = z.object({
  roles: z.string().min(1, "対象ロールは必須です"),
  operations: z.string().min(1, "許可操作は必須です"),
  boundary: z.string().optional(),
});
export type AuthDesignContent = z.infer<typeof authDesignContentSchema>;

/**
 * 非機能観点のcontent
 * @deprecated deliverable.ts の NonFunctionalDesignContent を使用してください（security, scalability を含む）
 */
export const nonFunctionalDesignContentSchema = z.object({
  performance: z.string().optional(),
  availability: z.string().optional(),
  monitoring: z.string().optional(),
  security: z.string().optional(),      // 新規追加
  scalability: z.string().optional(),   // 新規追加
});
export type NonFunctionalDesignContent = z.infer<typeof nonFunctionalDesignContentSchema>;

/**
 * レガシーデータ移行用content
 */
export const legacyDesignContentSchema = z.object({
  legacy: z.string(),
});
export type LegacyDesignContent = z.infer<typeof legacyDesignContentSchema>;

/**
 * content ユニオン型
 */
export const designContentSchema = z.union([
  functionDesignContentSchema,
  dataDesignContentSchema,
  exceptionDesignContentSchema,
  authDesignContentSchema,
  nonFunctionalDesignContentSchema,
  legacyDesignContentSchema,
]);
export type DesignContent = z.infer<typeof designContentSchema>;

/**
 * 新しいシステム設計項目（V2）
 */
export const systemDesignItemV2Schema = z.object({
  id: z.string(),
  category: designPerspectiveSchema,
  title: z.string(),
  target: designTargetSchema,
  content: designContentSchema,
  priority: z.enum(["high", "medium", "low"]),
});
export type SystemDesignItemV2 = z.infer<typeof systemDesignItemV2Schema>;

/**
 * 型ガード: V2形式か判定
 */
export function isV2Item(item: unknown): item is SystemDesignItemV2 {
  return (
    typeof item === "object" &&
    item !== null &&
    "target" in item &&
    "content" in item &&
    typeof (item as any).target === "object" &&
    "name" in (item as any).target &&
    "type" in (item as any).target
  );
}

/**
 * 型ガード: レガシー形式か判定
 */
export function isLegacyItem(item: unknown): item is SystemDesignItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "description" in item &&
    !("target" in item) &&
    !("content" in item)
  );
}

/**
 * 曖昧語リスト
 */
export const AMBIGUOUS_WORDS = [
  "高速",
  "柔軟",
  "便利",
  "適切",
  "迅速",
  "安定",
  "簡単",
  "効率的",
  "最適",
];

/**
 * 曖昧語を検出
 */
export function detectAmbiguousWords(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  return AMBIGUOUS_WORDS.filter((word) => text.includes(word));
}
