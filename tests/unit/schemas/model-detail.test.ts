import { describe, expect, it } from "vitest";
import {
  modelAttributeSchema,
  modelRelationshipSchema,
  modelRelationshipTypeEnum,
  stateTransitionSchema,
  type ModelAttribute,
  type ModelRelationship,
  type StateTransition,
} from "@/lib/domain/schemas/model-detail";

describe("model-detail schema", () => {
  describe("modelAttributeSchema", () => {
    it("最小構成でパースできる", () => {
      const data: ModelAttribute = {
        name: "id",
        type: "UUID",
      };
      expect(() => modelAttributeSchema.parse(data)).not.toThrow();
    });

    it("全フィールドを含むデータをパースできる", () => {
      const data: ModelAttribute = {
        name: "email",
        logicalName: "メールアドレス",
        type: "string",
        primaryKey: false,
        nullable: false,
        unique: true,
        foreignKey: false,
        description: "ユーザーのメールアドレス",
        constraints: "最大255文字",
        enumValues: undefined,
      };
      expect(() => modelAttributeSchema.parse(data)).not.toThrow();
    });

    it("nameが必須", () => {
      const data = {
        type: "string",
      };
      expect(() => modelAttributeSchema.parse(data)).toThrow();
    });

    it("nameが空文字はエラー", () => {
      const data = {
        name: "",
        type: "string",
      };
      expect(() => modelAttributeSchema.parse(data)).toThrow();
    });

    it("typeが必須", () => {
      const data = {
        name: "id",
      };
      expect(() => modelAttributeSchema.parse(data)).toThrow();
    });

    it("typeが空文字はエラー", () => {
      const data = {
        name: "id",
        type: "",
      };
      expect(() => modelAttributeSchema.parse(data)).toThrow();
    });

    it("enumValuesを含むデータをパースできる", () => {
      const data: ModelAttribute = {
        name: "status",
        type: "string",
        enumValues: ["active", "inactive", "pending"],
      };
      const result = modelAttributeSchema.parse(data);
      expect(result.enumValues).toEqual(["active", "inactive", "pending"]);
    });

    it("全てのbooleanフィールドはオプション", () => {
      const data: ModelAttribute = {
        name: "id",
        type: "UUID",
      };
      const result = modelAttributeSchema.parse(data);
      expect(result.primaryKey).toBeUndefined();
      expect(result.nullable).toBeUndefined();
      expect(result.unique).toBeUndefined();
      expect(result.foreignKey).toBeUndefined();
    });
  });

  describe("modelRelationshipSchema", () => {
    it("最小構成でパースできる", () => {
      const data: ModelRelationship = {
        target: "User",
        type: "N:1",
      };
      expect(() => modelRelationshipSchema.parse(data)).not.toThrow();
    });

    it("全フィールドを含むデータをパースできる", () => {
      const data: ModelRelationship = {
        target: "Order",
        type: "1:N",
        description: "1つのユーザーが複数の注文を持つ",
        columnMappings: [
          { source: "user_id", target: "id" },
        ],
      };
      expect(() => modelRelationshipSchema.parse(data)).not.toThrow();
    });

    it("targetが必須", () => {
      const data = {
        type: "1:1",
      };
      expect(() => modelRelationshipSchema.parse(data)).toThrow();
    });

    it("targetが空文字はエラー", () => {
      const data = {
        target: "",
        type: "1:1",
      };
      expect(() => modelRelationshipSchema.parse(data)).toThrow();
    });

    it("有効な関係タイプ", () => {
      const validTypes = ["1:1", "1:N", "N:1", "N:M"] as const;
      validTypes.forEach((type) => {
        const data: ModelRelationship = {
          target: "Test",
          type,
        };
        expect(() => modelRelationshipSchema.parse(data)).not.toThrow();
      });
    });

    it("無効な関係タイプはエラー", () => {
      const data = {
        target: "Test",
        type: "invalid" as any,
      };
      expect(() => modelRelationshipSchema.parse(data)).toThrow();
    });

    it("columnMappingsはオプション", () => {
      const data: ModelRelationship = {
        target: "User",
        type: "N:1",
      };
      const result = modelRelationshipSchema.parse(data);
      expect(result.columnMappings).toBeUndefined();
    });

    it("columnMappingsのsourceとtargetは必須", () => {
      const data = {
        target: "User",
        type: "N:1",
        columnMappings: [
          { source: "", target: "id" }, // sourceが空
        ],
      };
      expect(() => modelRelationshipSchema.parse(data)).toThrow();

      const data2 = {
        target: "User",
        type: "N:1",
        columnMappings: [
          { source: "user_id", target: "" }, // targetが空
        ],
      };
      expect(() => modelRelationshipSchema.parse(data2)).toThrow();
    });
  });

  describe("stateTransitionSchema", () => {
    it("最小構成でパースできる", () => {
      const data: StateTransition = {
        from: "draft",
        to: ["published", "archived"],
      };
      expect(() => stateTransitionSchema.parse(data)).not.toThrow();
    });

    it("全フィールドを含むデータをパースできる", () => {
      const data: StateTransition = {
        from: "draft",
        to: ["published"],
        condition: "承認済みの場合のみ公開可能",
      };
      expect(() => stateTransitionSchema.parse(data)).not.toThrow();
    });

    it("fromが必須", () => {
      const data = {
        to: ["published"],
      };
      expect(() => stateTransitionSchema.parse(data)).toThrow();
    });

    it("fromが空文字はエラー", () => {
      const data = {
        from: "",
        to: ["published"],
      };
      expect(() => stateTransitionSchema.parse(data)).toThrow();
    });

    it("toが必須", () => {
      const data = {
        from: "draft",
      };
      expect(() => stateTransitionSchema.parse(data)).toThrow();
    });

    it("toは空配列はエラー", () => {
      const data = {
        from: "draft",
        to: [],
      };
      expect(() => stateTransitionSchema.parse(data)).toThrow();
    });

    it("toは空配列はエラーだが空文字列は配列内で許可", () => {
      const data = {
        from: "draft",
        to: [""],
      };
      // 注: 実装では空文字列も許可されている（配列要素は.z.string()のみ）
      const result = stateTransitionSchema.parse(data);
      expect(result.to).toEqual([""]);
    });

    it("conditionはオプション", () => {
      const data: StateTransition = {
        from: "draft",
        to: ["published"],
      };
      const result = stateTransitionSchema.parse(data);
      expect(result.condition).toBeUndefined();
    });
  });

  describe("modelRelationshipTypeEnum", () => {
    it("全ての関係タイプが有効", () => {
      const validTypes = ["1:1", "1:N", "N:1", "N:M"];
      validTypes.forEach((type) => {
        expect(() => modelRelationshipTypeEnum.parse(type)).not.toThrow();
      });
    });

    it("無効な関係タイプはエラー", () => {
      expect(() => modelRelationshipTypeEnum.parse("invalid")).toThrow();
      expect(() => modelRelationshipTypeEnum.parse("1:0")).toThrow();
      expect(() => modelRelationshipTypeEnum.parse("0:N")).toThrow();
    });
  });

  describe("現実的なユースケース", () => {
    it("Userエンティティの定義", () => {
      const attributes: ModelAttribute[] = [
        {
          name: "id",
          logicalName: "ユーザーID",
          type: "UUID",
          primaryKey: true,
          nullable: false,
        },
        {
          name: "email",
          logicalName: "メールアドレス",
          type: "string",
          unique: true,
          nullable: false,
          description: "ログイン用メールアドレス",
        },
        {
          name: "status",
          logicalName: "ステータス",
          type: "string",
          enumValues: ["active", "inactive", "suspended"],
        },
      ];
      attributes.forEach((attr) => {
        expect(() => modelAttributeSchema.parse(attr)).not.toThrow();
      });
    });

    it("Orderエンティティの関係定義", () => {
      const relationships: ModelRelationship[] = [
        {
          target: "User",
          type: "N:1",
          description: "注文は1人のユーザーに属する",
          columnMappings: [
            { source: "user_id", target: "id" },
          ],
        },
        {
          target: "OrderItem",
          type: "1:N",
          description: "1つの注文は複数の明細を持つ",
          columnMappings: [
            { source: "id", target: "order_id" },
          ],
        },
      ];
      relationships.forEach((rel) => {
        expect(() => modelRelationshipSchema.parse(rel)).not.toThrow();
      });
    });

    it("Orderの状態遷移定義", () => {
      const transitions: StateTransition[] = [
        {
          from: "draft",
          to: ["confirmed", "cancelled"],
          condition: "在庫が十分にある場合のみ確認可能",
        },
        {
          from: "confirmed",
          to: ["shipped", "cancelled"],
          condition: "出荷準備が完了した場合のみ出荷可能",
        },
        {
          from: "shipped",
          to: ["delivered"],
          condition: "配送完了報告を受領した場合",
        },
      ];
      transitions.forEach((trans) => {
        expect(() => stateTransitionSchema.parse(trans)).not.toThrow();
      });
    });

    it("Invoiceエンティティの複合的な定義", () => {
      // 属性
      const attributes: ModelAttribute[] = [
        { name: "id", type: "UUID", primaryKey: true },
        { name: "amount", type: "number", nullable: false },
        { name: "status", type: "string", enumValues: ["draft", "issued", "cancelled"] },
      ];

      // 関係
      const relationships: ModelRelationship[] = [
        { target: "User", type: "N:1", description: "請求書はユーザーに紐づく" },
        { target: "Payment", type: "1:1", description: "請求書は1回の支払いに紐づく" },
      ];

      // 状態遷移
      const transitions: StateTransition[] = [
        { from: "draft", to: ["issued", "cancelled"] },
        { from: "issued", to: ["paid", "overdue"] },
      ];

      attributes.forEach((attr) => {
        expect(() => modelAttributeSchema.parse(attr)).not.toThrow();
      });
      relationships.forEach((rel) => {
        expect(() => modelRelationshipSchema.parse(rel)).not.toThrow();
      });
      transitions.forEach((trans) => {
        expect(() => stateTransitionSchema.parse(trans)).not.toThrow();
      });
    });
  });
});
