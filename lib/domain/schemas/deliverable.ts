import { z } from "zod";
import {
  designTargetTypeSchema,
  functionDesignContentSchema,
  dataDesignContentSchema,
  exceptionDesignContentSchema,
  authDesignContentSchema,
  type FunctionDesignContent,
  type DataDesignContent,
  type ExceptionDesignContent,
  type AuthDesignContent,
} from "./system-design";

/**
 * 成果物の種別（旧 DesignTargetType と同一）
 */
export const deliverableTypeSchema = designTargetTypeSchema;
export type DeliverableType = z.infer<typeof deliverableTypeSchema>;

/**
 * 非機能設計の内容（security, scalability を追加）
 */
export const nonFunctionalDesignContentSchema = z.object({
  performance: z.string().optional(),
  availability: z.string().optional(),
  monitoring: z.string().optional(),
  security: z.string().optional(),      // ★追加
  scalability: z.string().optional(),   // ★追加
});
export type NonFunctionalDesignContent = z.infer<typeof nonFunctionalDesignContentSchema>;

/**
 * 成果物の設計内容（5観点）
 */
export const deliverableDesignSchema = z.object({
  function: functionDesignContentSchema.nullable(),
  data: dataDesignContentSchema.nullable(),
  exception: exceptionDesignContentSchema.nullable(),
  auth: authDesignContentSchema.nullable(),
  non_functional: nonFunctionalDesignContentSchema.nullable(),
});
export type DeliverableDesign = z.infer<typeof deliverableDesignSchema>;

/**
 * 成果物（Deliverable）
 * 旧 SystemDesignItem.target + SystemDesignItem + EntryPoint を統合
 */
export const deliverableSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "成果物名は必須です"),
  type: deliverableTypeSchema,
  entryPoint: z.string().nullable(),
  design: deliverableDesignSchema,
});
export type Deliverable = z.infer<typeof deliverableSchema>;

/**
 * デフォルトの空成果物を生成
 */
export function createEmptyDeliverable(): Deliverable {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "screen",
    entryPoint: null,
    design: {
      function: null,
      data: null,
      exception: null,
      auth: null,
      non_functional: null,
    },
  };
}

/**
 * 成果物の設計内容が空かチェック
 */
export function isDeliverableDesignEmpty(design: DeliverableDesign): boolean {
  return (
    design.function === null &&
    design.data === null &&
    design.exception === null &&
    design.auth === null &&
    design.non_functional === null
  );
}

/**
 * 成果物のバリデーション
 */
export function validateDeliverable(deliverable: Deliverable): string[] {
  const errors: string[] = [];

  if (!deliverable.name.trim()) {
    errors.push("成果物名は必須です");
  }

  if (!deliverable.type) {
    errors.push("成果物の種別は必須です");
  }

  // 設計内容が全て空の場合は警告
  if (isDeliverableDesignEmpty(deliverable.design)) {
    errors.push("少なくとも1つの設計観点を入力してください");
  }

  return errors;
}
