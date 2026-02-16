import { z } from "zod";

export const fieldTypeEnum = z.enum([
  "string",
  "number",
  "boolean",
  "enum",
  "object",
  "array",
]);

export const constraintsSchema = z
  .object({
    min: z
      .number()
      .optional()
      .describe("最小値。数値型の場合は下限値、文字列型の場合は最小文字数、配列型の場合は最小要素数"),
    max: z
      .number()
      .optional()
      .describe("最大値。数値型の場合は上限値、文字列型の場合は最大文字数、配列型の場合は最大要素数"),
    pattern: z
      .string()
      .optional()
      .describe("正規表現パターン。文字列型の値のフォーマットを制約（例: '^[0-9]+$' は数字のみ、'^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$' はメールアドレス形式）"),
    format: z
      .enum(["email", "date", "uuid"])
      .optional()
      .describe("定義済みフォーマット。emailはメールアドレス、dateはISO 8601日付形式（2024-01-01等）、uuidはUUID形式（v4推奨）。文字列型の場合に使用"),
    enum: z
      .array(z.string())
      .optional()
      .describe("列挙型の許容値リスト。typeが'enum'の場合に使用し、ここで指定した文字列値のいずれかのみ許容される（例: ['active', 'inactive', 'pending']）"),
    default: z
      .unknown()
      .optional()
      .describe("デフォルト値。フィールドが省略された場合や未指定の場合に使用される値。型はtypeと一致させる必要がある"),
  })
  .optional()
  .describe(
    "フィールドの値制約定義。型に応じて適用される制約が異なる（数値は範囲、文字列は長さとフォーマット、配列は要素数等）"
  );

export const fieldLocationSchema = z.enum(["query", "body"]).describe(
  "API用: フィールドの配置場所。'query'はURLクエリパラメータ、'body'はリクエストボディ"
);

export const fieldCategorySchema = z.enum(["config", "data"]).describe(
  "Batch/Job用: フィールドのカテゴリ。'config'は設定/パラメータ、'data'は実際の処理対象データ"
);

export const fieldElementTypeSchema = z.enum([
  "input",
  "display",
  "checkbox",
  "radio",
  "select",
  "button",
  "file",
]).describe(
  "画面用: UI要素の種類。inputは入力系UI、displayは表示専用（入力不可）、checkboxはチェックボックス、radioはラジオボタン、selectはプルダウン、buttonはボタン、fileはファイル選択"
);

export const fieldSchema = z.object({
  name: z
    .string()
    .min(1, "フィールド名は必須")
    .describe(
      "フィールド名。データ構造内で一意である必要がある（例: userId, email, createdAt）。キャメルケースまたはスネークケースを使用"
    ),
  label: z
    .string()
    .optional()
    .describe(
      "フィールドの表示名・論理名。画面上やドキュメントで表示される人間可読な名前（例: 顧客ID、請求書番号）"
    ),
  type: fieldTypeEnum.describe(
    "データ型。stringはテキスト、numberは数値（整数・小数）、booleanは真偽値、enumは固定値セットからの選択、objectはネストされたオブジェクト、arrayは配列"
  ),
  required: z
    .boolean()
    .default(true)
    .describe("必須フラグ。trueの場合このフィールドは必ず指定が必要。falseの場合、省略可能（オプショナル）"),
  description: z
    .string()
    .optional()
    .describe(
      "フィールドの説明や用途。AIによるドキュメント生成や実装時に、このフィールドの目的を理解するためのヒントとして使用される（例: 'ユーザーのメールアドレス。ログインIDとしても使用'）"
    ),
  constraints: constraintsSchema,
  location: fieldLocationSchema.optional().describe(
    "API用（オプション）: フィールドの配置場所。'query'はURLクエリパラメータ、'body'はリクエストボディ"
  ),
  category: fieldCategorySchema.optional().describe(
    "Batch/Job用（オプション）: フィールドのカテゴリ。'config'は設定/パラメータ、'data'は実際の処理対象データ"
  ),
  elementType: fieldElementTypeSchema.optional().describe(
    "画面用（オプション）: UI要素の種類"
  ),
}).describe(
  "データフィールド定義。APIの入出力、画面要素、データモデル等のデータ構造を構成する各フィールドを定義"
);

export const fieldArraySchema = z.array(fieldSchema);

export type FieldType = z.infer<typeof fieldTypeEnum>;
export type FieldLocation = z.infer<typeof fieldLocationSchema>;
export type FieldCategory = z.infer<typeof fieldCategorySchema>;
export type FieldElementType = z.infer<typeof fieldElementTypeSchema>;
export type FieldConstraints = z.infer<typeof constraintsSchema>;
export type Field = z.infer<typeof fieldSchema>;
