import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { zodSchemaToPrompt } from "@/lib/mastra/utils/schema-to-prompt";

describe("zodSchemaToPrompt", () => {
  it("プリミティブ型の説明を抽出できる", () => {
    const schema = z.object({
      name: z.string().describe("ユーザー名"),
      age: z.number().describe("年齢"),
    });

    const result = zodSchemaToPrompt(schema);
    expect(result).toContain("ユーザー名");
    expect(result).toContain("年齢");
    expect(result).toContain("**name** (string)");
    expect(result).toContain("**age** (number)");
  });

  it("ネストされたオブジェクトをフォーマットできる", () => {
    const schema = z.object({
      user: z
        .object({
          name: z.string().describe("名前"),
          email: z.string().describe("メールアドレス"),
        })
        .describe("ユーザー情報"),
    });

    const result = zodSchemaToPrompt(schema, { maxDepth: 2 });
    expect(result).toContain("名前");
    expect(result).toContain("メールアドレス");
    expect(result).toContain("ユーザー情報");
  });

  it("配列型をフォーマットできる", () => {
    const schema = z.object({
      items: z.array(z.string().describe("アイテム名")).describe("アイテムリスト"),
    });

    const result = zodSchemaToPrompt(schema);
    expect(result).toContain("アイテムリスト");
    expect(result).toContain("アイテム名");
    expect(result).toContain("配列要素");
  });

  it("enum型をフォーマットできる", () => {
    const schema = z.object({
      status: z.enum(["active", "inactive"]).describe("ステータス"),
    });

    const result = zodSchemaToPrompt(schema);
    expect(result).toContain("active, inactive");
    expect(result).toContain("許容値");
  });

  it(".describe()がない場合もエラーにならない", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const result = zodSchemaToPrompt(schema);
    expect(result).toBeDefined();
    expect(result).toContain("**name**");
    expect(result).toContain("**age**");
  });

  it("maxDepthで深さを制限できる", () => {
    const schema = z.object({
      level1: z.object({
        level2: z.object({
          level3: z.string().describe("深いレベル"),
        }),
      }),
    });

    const result = zodSchemaToPrompt(schema, { maxDepth: 1 });
    expect(result).not.toContain("深いレベル");
  });

  it("includeNestedDescriptionsがfalseの場合ネストされた説明を含まない", () => {
    const schema = z.object({
      items: z.array(z.string().describe("アイテム名")).describe("アイテムリスト"),
    });

    const result = zodSchemaToPrompt(schema, { includeNestedDescriptions: false });
    expect(result).toContain("アイテムリスト");
    expect(result).not.toContain("アイテム名");
  });

  it("ZodOptionalをアンラップできる", () => {
    const schema = z.object({
      optionalField: z.string().optional().describe("オプションフィールド"),
    });

    const result = zodSchemaToPrompt(schema);
    expect(result).toContain("オプションフィールド");
  });

  it("ZodDefaultをアンラップできる", () => {
    const schema = z.object({
      defaultField: z.string().default("default").describe("デフォルトフィールド"),
    });

    const result = zodSchemaToPrompt(schema);
    expect(result).toContain("デフォルトフィールド");
  });

  it("ZodDiscriminatedUnionをフォーマットできる", () => {
    const schema = z.object({
      union: z.discriminatedUnion("type", [
        z.object({ type: z.literal("a"), value: z.string() }),
        z.object({ type: z.literal("b"), count: z.number() }),
      ]),
    });

    const result = zodSchemaToPrompt(schema);
    expect(result).toContain("union");
  });
});
