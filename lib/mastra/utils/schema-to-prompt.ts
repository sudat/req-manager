import { z } from "zod";

interface SchemaToPromptOptions {
  includeNestedDescriptions?: boolean;
  maxDepth?: number;
}

/**
 * zodスキーマからプロンプト用の説明を自動生成する
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string().describe("ユーザー名"),
 *   age: z.number().describe("年齢"),
 * });
 * const prompt = zodSchemaToPrompt(schema);
 * // => "## 設計書スキーマ定義\n\n**name** (string)\n  ユーザー名\n**age** (number)\n  年齢"
 * ```
 */
export function zodSchemaToPrompt<T extends z.ZodType>(
  schema: T,
  options: SchemaToPromptOptions = {}
): string {
  const { includeNestedDescriptions = true, maxDepth = 3 } = options;
  const lines: string[] = [];

  lines.push("## 設計書スキーマ定義\n");
  lines.push(formatZodType(schema, 0, maxDepth, includeNestedDescriptions));

  return lines.join("\n");
}

function formatZodType(
  zodType: z.ZodType,
  depth: number,
  maxDepth: number,
  includeNested: boolean
): string {
  if (depth > maxDepth) {
    return `${indent(depth)}(深さ制限により省略)`;
  }

  // ZodOptional / ZodDefault: descriptionを取得してからアンラップ
  if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodDefault) {
    const description = extractZodDescription(zodType);
    const innerType = zodType._def.innerType as z.ZodType;
    const typeName = getZodTypeName(innerType);
    const nested = includeNested
      ? formatZodType(innerType, depth, maxDepth, includeNested)
      : "";

    // descriptionがある場合はそれを優先、なければネストされた内容
    if (description) {
      return `${indent(depth)}${typeName}${nested ? `\n${nested}` : ""}`;
    }
    return nested;
  }

  // ZodObject
  if (zodType instanceof z.ZodObject) {
    const fields: string[] = [];
    const shape = zodType.shape;

    for (const [key, value] of Object.entries(shape)) {
      const fieldZodType = value as z.ZodType;
      const typeName = getZodTypeName(fieldZodType);
      const description = extractZodDescription(fieldZodType);
      const nested = includeNested
        ? formatZodType(fieldZodType, depth + 1, maxDepth, includeNested)
        : "";

      fields.push(
        `${indent(depth + 1)}**${key}** (${typeName})${description ? `\n${indent(depth + 2)}${description}` : ""}${
          nested ? `\n${nested}` : ""
        }`
      );
    }

    const objDesc = extractZodDescription(zodType);
    return `${objDesc ? `${indent(depth)}${objDesc}\n` : ""}${fields.join("\n")}`;
  }

  // ZodArray
  if (zodType instanceof z.ZodArray) {
    const elementType = zodType._def.element as z.ZodType;
    const description = extractZodDescription(zodType);
    const nested = includeNested
      ? formatZodType(elementType, depth + 1, maxDepth, includeNested)
      : "";
    return `${description ? `${indent(depth)}${description}\n` : ""}${indent(depth + 1)}配列要素:\n${nested}`;
  }

  // ZodEnum
  if (zodType instanceof z.ZodEnum) {
    // zod 4.xでは _def.entries に値が格納されている
    const entries = (zodType._def as any).entries;
    const values = entries ? Object.values(entries).join(", ") : "";
    const description = extractZodDescription(zodType);
    return `${description ? `${indent(depth)}${description}\n` : ""}${indent(depth + 1)}許容値: ${values}`;
  }

  // ZodUnion / ZodDiscriminatedUnion
  if (zodType instanceof z.ZodUnion || zodType instanceof z.ZodDiscriminatedUnion) {
    const description = extractZodDescription(zodType);
    return `${description ? `${indent(depth)}${description}\n` : ""}${indent(depth + 1)}(ユニオン型)`;
  }

  // プリミティブ型
  const description = extractZodDescription(zodType);
  return description ? `${indent(depth)}${description}` : "";
}

/**
 * zodスキーマから .describe() で設定された説明を抽出する
 * zod 4.xでは description は _def 内ではなく、スキーマオブジェクトのプロパティとして公開されている
 */
function extractZodDescription(zodType: z.ZodType): string {
  return (zodType as any).description || "";
}

/**
 * zodスキーマの型名を取得する
 */
function getZodTypeName(zodType: z.ZodType): string {
  if (zodType instanceof z.ZodString) return "string";
  if (zodType instanceof z.ZodNumber) return "number";
  if (zodType instanceof z.ZodBoolean) return "boolean";
  if (zodType instanceof z.ZodEnum) return "enum";
  if (zodType instanceof z.ZodObject) return "object";
  if (zodType instanceof z.ZodArray) return "array";
  if (zodType instanceof z.ZodUnion) return "union";
  if (zodType instanceof z.ZodDiscriminatedUnion) return "discriminatedUnion";
  if (zodType instanceof z.ZodOptional) return "optional";
  if (zodType instanceof z.ZodDefault) return "default";
  return "unknown";
}

/**
 * 深さに応じたインデントを生成する
 */
function indent(depth: number): string {
  return "  ".repeat(depth);
}
