# zodスキーマからプロンプト自動生成・バリデーション改善

## Context

### 課題背景
`/chat` 画面からDD（設計書）を作成する機能において、以下2つの問題が指摘された：

1. **DD草案生成時にzodスキーマが活用されていない**
   - プロンプトがハードコードされており、zodスキーマの構造を反映していない
   - `.describe()` で追加した詳細な説明がLLMに渡されていない

2. **保存時にzodバリデーションが行われていない**
   - `saveDesignDocuments` 関数で `structuredDesignDocumentSpecSchema` による検証が実装されていない
   - スキーマ違反のデータが保存される可能性がある

### 目標
- zodスキーマをSingle Source of Truthにする
- `.describe()` の説明を自動的にプロンプトに組み込む
- 保存時にzodバリデーションを実行する

---

## 実装アプローチ

### 難易度: ★☆☆
- 新規ファイル: 1件（`schema-to-prompt.ts`）
- 変更ファイル: 2件（`dd-draft.ts`, `save-system-function.ts`）
- 追加コード: 約150行
- 依存関係: なし（zodのみ）

### リスク
- zodの内部構造（`_def`）にアクセスするため、zodバージョンアップ時の互換性リスクあり

---

## Critical Files

| ファイル | 操作 | 説明 |
|----------|------|------|
| `lib/mastra/utils/schema-to-prompt.ts` | 新規作成 | zodスキーマからプロンプト用説明を自動生成するユーティリティ |
| `lib/mastra/tools/dd-draft.ts` | 変更 | プロンプト生成部分を動的生成に置換 |
| `lib/utils/system-functions/save-system-function.ts` | 変更 | 保存時にzodバリデーションを追加 |
| `lib/domain/schemas/design-document-structured.ts` | 参照 | スキーマ定義と `.describe()` の確認 |
| `tests/unit/utils/schema-to-prompt.test.ts` | 新規作成 | ユーティリティのユニットテスト |

---

## 実装手順

### Phase 1: ユーティリティ実装（新規）

**ファイル**: `lib/mastra/utils/schema-to-prompt.ts`

```typescript
import { z } from "zod";

interface SchemaToPromptOptions {
  includeNestedDescriptions?: boolean;
  maxDepth?: number;
}

/**
 * zodスキーマからプロンプト用の説明を自動生成する
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

  // ZodOptional / ZodDefault のアンラップ
  if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodDefault) {
    const innerType = zodType._def.innerType;
    return formatZodType(innerType, depth, maxDepth, includeNested);
  }

  // ZodObject
  if (zodType instanceof z.ZodObject) {
    const fields: string[] = [];
    const shape = zodType.shape;

    for (const [key, value] of Object.entries(shape)) {
      const typeName = getZodTypeName(value as z.ZodType);
      const description = extractZodDescription(value as z.ZodType);
      const nested = includeNested
        ? formatZodType(value as z.ZodType, depth + 1, maxDepth, includeNested)
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
    const elementType = zodType._def.element;
    const description = extractZodDescription(zodType);
    const nested = includeNested
      ? formatZodType(elementType, depth + 1, maxDepth, includeNested)
      : "";
    return `${description ? `${indent(depth)}${description}\n` : ""}${indent(depth + 1)}配列要素:\n${nested}`;
  }

  // ZodEnum
  if (zodType instanceof z.ZodEnum) {
    const values = zodType._def.values.join(", ");
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

function extractZodDescription(zodType: z.ZodType): string {
  // _def.description から .describe() の情報を取得
  return (zodType as any)._def?.description || "";
}

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

function indent(depth: number): string {
  return "  ".repeat(depth);
}
```

---

### Phase 2: dd-draft.ts の改善

**ファイル**: `lib/mastra/tools/dd-draft.ts`

**変更箇所**: L287-342 のプロンプト生成部分

**変更前**:
```typescript
const llmPrompt = `
【DD種別の定義】
- screen: 画面/UI設計
- api: アプリ内API設計
...
`;
```

**変更後**:
```typescript
import { zodSchemaToPrompt } from "@/lib/mastra/utils/schema-to-prompt";
import { structuredDesignDocumentSpecSchema } from "@/lib/domain/schemas/design-document-structured";

// スキーマから動的にプロンプトを生成
const schemaPrompt = zodSchemaToPrompt(structuredDesignDocumentSpecSchema, {
  includeNestedDescriptions: true,
  maxDepth: 3,
});

const llmPrompt = `
以下のシステム機能（SF）と関連SRをもとに、DD（Design Document）の草案を複数作成してください。

【スキーマ定義】
${schemaPrompt}

【システム機能】
- ID: ${sfIdValue}
- 名称: ${sfNameValue}
- 概要: ${sfSummaryValue}

【関連SR一覧】${srLines}

【出力形式】
以下のJSON形式で出力してください：
{
  "dd_drafts": [
    {
      "name": "DD名称",
      "type": "screen|api|batch|job|external_if|model|report",
      "summary": "概要",
      ...
    }
  ]
}
`;
```

---

### Phase 3: 保存時バリデーションの追加

**ファイル**: `lib/utils/system-functions/save-system-function.ts`

**変更箇所**: `saveDesignDocuments` 関数（L192-227）

**変更内容**:
```typescript
import { structuredDesignDocumentSpecSchema } from "@/lib/domain/schemas/design-document-structured";

export async function saveDesignDocuments(input: {
  srfId: string;
  designDocuments: DesignDocumentDraft[];
  projectId: string;
}): Promise<{ error: string | null }> {
  const { srfId, designDocuments, projectId } = input;

  // === 追加: zodバリデーション ===
  const validationErrors: string[] = [];

  for (const [index, dd] of designDocuments.entries()) {
    if (dd.structuredSpec) {
      const result = structuredDesignDocumentSpecSchema.safeParse(dd.structuredSpec);
      if (!result.success) {
        const issues = result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        validationErrors.push(`DD「${dd.name}」(${index + 1}件目): ${issues}`);
      }
    }
  }

  if (validationErrors.length > 0) {
    return {
      error: `構造化設計書のバリデーションエラーが発生しました:\n${validationErrors.join("\n")}`,
    };
  }
  // === 追加ここまで ===

  // 既存の保存処理（継続）
  const { error: deleteError } = await deleteDesignDocumentsBySrfId(srfId, projectId);
  if (deleteError) return { error: deleteError };

  const implInputs = designDocuments.map((unit) => ({
    // ... 既存のマッピング処理
  }));

  const { error: insertError } = await createDesignDocuments(implInputs);
  if (insertError) return { error: insertError };

  return { error: null };
}
```

---

### Phase 4: ユニットテストの作成

**ファイル**: `tests/unit/utils/schema-to-prompt.test.ts`

```typescript
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
  });

  it("ネストされたオブジェクトをフォーマットできる", () => {
    const schema = z.object({
      user: z.object({
        name: z.string().describe("名前"),
        email: z.string().describe("メールアドレス"),
      }),
    });

    const result = zodSchemaToPrompt(schema, { maxDepth: 2 });
    expect(result).toContain("名前");
    expect(result).toContain("メールアドレス");
  });

  it("配列型をフォーマットできる", () => {
    const schema = z.object({
      items: z.array(z.string().describe("アイテム名")).describe("アイテムリスト"),
    });

    const result = zodSchemaToPrompt(schema);
    expect(result).toContain("アイテムリスト");
    expect(result).toContain("アイテム名");
  });

  it("enum型をフォーマットできる", () => {
    const schema = z.object({
      status: z.enum(["active", "inactive"]).describe("ステータス"),
    });

    const result = zodSchemaToPrompt(schema);
    expect(result).toContain("active, inactive");
  });

  it(".describe()がない場合もエラーにならない", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const result = zodSchemaToPrompt(schema);
    expect(result).toBeDefined();
  });
});
```

---

## 検証方法

### 1. ユニットテスト実行
```bash
bun test tests/unit/utils/schema-to-prompt.test.ts
```

### 2. DD草案生成の動作確認
1. `/chat` 画面を開く
2. SF IDを指定して「DDを生成」と入力
3. 生成された草案がスキーマ定義に従っているか確認
4. `.describe()` の説明が反映されているか確認

### 3. 保存時バリデーションの確認
1. 不正なstructuredSpecを持つDDを編集
2. 「保存」ボタンをクリック
3. バリデーションエラーが表示されるか確認
4. 正しいデータでは保存できるか確認

### 4. プロンプト内容の確認
```typescript
// デバッグ用: 生成されたプロンプトをコンソールに出力
console.log("Generated schema prompt:", schemaPrompt);
```

---

## 注意事項

### zod内部構造への依存
- `_def` フィールドはzodの内部実装
- zodバージョンアップ時に動作しなくなる可能性がある
- メジャーバージョン更新時には動作確認が必要

### プロンプト長の制限
- スキーマが大きいとプロンプトが長くなる可能性がある
- `maxDepth` オプションで深さを制限している
- 必要に応じてフィルタリング機能を追加

### 既存プロンプトとの互換性
- 完全に置換するため、既存の説明は削除
- 移行期間中は両方を組み合わせることも可能

---

## 既存の実装パターン

### 参照すべきファイル
- `lib/mastra/tools/dd-draft.ts` - 現在のプロンプト実装
- `lib/mastra/tools/br-draft.ts` - 他のツールのプロンプトパターン
- `lib/domain/schemas/design-document-structured.ts` - ターゲットスキーマ定義

### 再利用する関数・型
- `structuredDesignDocumentSpecSchema` - メインのスキーマ定義
- `DesignDocumentDraft` 型 - 保存時のデータ型
