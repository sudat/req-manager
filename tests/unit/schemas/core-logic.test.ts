import { describe, expect, it } from "vitest";
import {
  businessRuleSchema,
  businessRuleTypeEnum,
  coreLogicSchema,
  type BusinessRule,
  type CoreLogic,
} from "@/lib/domain/schemas/core-logic";

describe("core-logic schema", () => {
  describe("businessRuleTypeEnum", () => {
    it("有効な値を受け入れる", () => {
      expect(() => businessRuleTypeEnum.parse("validation")).not.toThrow();
      expect(() => businessRuleTypeEnum.parse("calculation")).not.toThrow();
      expect(() => businessRuleTypeEnum.parse("state_transition")).not.toThrow();
      expect(() => businessRuleTypeEnum.parse("decision")).not.toThrow();
      expect(() => businessRuleTypeEnum.parse("aggregation")).not.toThrow();
    });

    it("無効な値を拒否する", () => {
      expect(() => businessRuleTypeEnum.parse("invalid")).toThrow();
    });
  });

  describe("businessRuleSchema", () => {
    it("最小構成でパースできる", () => {
      const data: BusinessRule = {
        name: "tax_calculation",
        type: "calculation",
        description: "消費税を計算する",
      };
      expect(() => businessRuleSchema.parse(data)).not.toThrow();
    });

    it("全フィールドを含むデータをパースできる", () => {
      const data: BusinessRule = {
        name: "tax_calculation",
        type: "calculation",
        description: "消費税を計算する",
        formula: "税額 = 税抜金額 × 税率",
        preconditions: ["税抜金額 > 0", "税率は0.08または0.10"],
        rounding: "切り捨て",
        precision: "1円単位",
        notes: "軽減税率対象品目は8%を適用",
      };
      const result = businessRuleSchema.parse(data);
      expect(result.name).toBe("tax_calculation");
      expect(result.type).toBe("calculation");
      expect(result.formula).toBe("税額 = 税抜金額 × 税率");
      expect(result.preconditions).toHaveLength(2);
      expect(result.rounding).toBe("切り捨て");
    });

    it("必須フィールドが欠けている場合はエラー", () => {
      expect(() =>
        businessRuleSchema.parse({
          name: "test",
          type: "validation",
          // description なし
        })
      ).toThrow();
    });
  });

  describe("coreLogicSchema", () => {
    it("空のrulesでパースできる", () => {
      const data: CoreLogic = {
        rules: [],
      };
      expect(() => coreLogicSchema.parse(data)).not.toThrow();
    });

    it("rulesフィールドが省略された場合はデフォルトで空配列になる", () => {
      const result = coreLogicSchema.parse({});
      expect(result.rules).toEqual([]);
    });

    it("summary付きでパースできる", () => {
      const data: CoreLogic = {
        summary: "受注処理のコアロジック",
        rules: [
          {
            name: "stock_check",
            type: "validation",
            description: "在庫数が注文数以上であることを確認",
          },
          {
            name: "price_calculation",
            type: "calculation",
            description: "合計金額を計算",
            formula: "合計金額 = 単価 × 数量",
          },
        ],
      };
      const result = coreLogicSchema.parse(data);
      expect(result.summary).toBe("受注処理のコアロジック");
      expect(result.rules).toHaveLength(2);
      expect(result.rules[0].name).toBe("stock_check");
      expect(result.rules[1].name).toBe("price_calculation");
    });
  });
});
