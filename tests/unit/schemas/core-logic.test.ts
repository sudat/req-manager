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
      expect(() => businessRuleTypeEnum.parse("validate")).not.toThrow();
      expect(() => businessRuleTypeEnum.parse("read")).not.toThrow();
      expect(() => businessRuleTypeEnum.parse("derive")).not.toThrow();
      expect(() => businessRuleTypeEnum.parse("decide")).not.toThrow();
    });

    it("persist は廃止済みのため拒否される", () => {
      expect(() => businessRuleTypeEnum.parse("persist")).toThrow();
    });

    it("無効な値を拒否する", () => {
      expect(() => businessRuleTypeEnum.parse("invalid")).toThrow();
    });
  });

  describe("businessRuleSchema", () => {
    it("最小構成でパースできる", () => {
      const data: BusinessRule = {
        name: "tax_calculation",
        type: "derive",
        description: "消費税を計算する",
      };
      expect(() => businessRuleSchema.parse(data)).not.toThrow();
    });

    it("全フィールドを含むデータをパースできる", () => {
      const data: BusinessRule = {
        name: "tax_calculation",
        type: "derive",
        description: "消費税を計算する",
        formulas: ["税額 = 税抜金額 × 税率"],
        preconditions: ["税抜金額 > 0", "税率は0.08または0.10"],
        notes: ["軽減税率対象品目は8%を適用"],
      };
      const result = businessRuleSchema.parse(data);
      expect(result.name).toBe("tax_calculation");
      expect(result.type).toBe("derive");
      expect(result.formulas).toEqual(["税額 = 税抜金額 × 税率"]);
      expect(result.preconditions).toHaveLength(2);
      expect(result.notes).toEqual(["軽減税率対象品目は8%を適用"]);
    });

    it("必須フィールドが欠けている場合はエラー", () => {
      expect(() =>
        businessRuleSchema.parse({
          name: "test",
          type: "validate",
          // description なし
        })
      ).toThrow();
    });

    it("シーケンス図メタ情報を含むデータをパースできる", () => {
      const data: BusinessRule = {
        name: "credit_check",
        type: "decide",
        description: "与信枠を判定する",
        sequence: {
          fragmentType: "alt",
          fragmentGroup: "credit_decision",
          branch: "if",
          guard: "与信枠を超過",
        },
      };
      const result = businessRuleSchema.parse(data);
      expect(result.sequence?.fragmentType).toBe("alt");
      expect(result.sequence?.branch).toBe("if");
    });

    it("前提条件違反時の挙動マッピングをパースできる", () => {
      const data: BusinessRule = {
        name: "invoice_validation",
        type: "validate",
        description: "前提条件を検証する",
        preconditions: ["請求対象が1件以上選択されている"],
        preconditionViolations: [{ preconditionIndex: 0, exceptionIndex: 1 }],
      };
      const result = businessRuleSchema.parse(data);
      expect(result.preconditionViolations).toEqual([
        { preconditionIndex: 0, exceptionIndex: 1 },
      ]);
    });

    it("前提条件インデックスが範囲外の場合はエラー", () => {
      expect(() =>
        businessRuleSchema.parse({
          name: "invalid_precondition_index",
          type: "validate",
          description: "不正ケース",
          preconditions: ["請求対象が1件以上選択されている"],
          preconditionViolations: [{ preconditionIndex: 1, exceptionIndex: 0 }],
        })
      ).toThrow();
    });

    it("同一前提条件に複数マッピングを設定するとエラー", () => {
      expect(() =>
        businessRuleSchema.parse({
          name: "duplicate_precondition_map",
          type: "validate",
          description: "不正ケース",
          preconditions: ["請求対象が1件以上選択されている"],
          preconditionViolations: [
            { preconditionIndex: 0, exceptionIndex: 0 },
            { preconditionIndex: 0, exceptionIndex: 1 },
          ],
        })
      ).toThrow();
    });

    it("parフラグメントを受け入れる", () => {
      const data: BusinessRule = {
        name: "parallel_dispatch",
        type: "decide",
        description: "並列実行の開始",
        sequence: {
          fragmentType: "par",
          guard: "外部通知と監査ログを並列処理",
        },
      };
      const result = businessRuleSchema.parse(data);
      expect(result.sequence?.fragmentType).toBe("par");
    });

    it("alt以外でbranch=elseはエラー", () => {
      expect(() =>
        businessRuleSchema.parse({
          name: "invalid_branch",
          type: "decide",
          description: "不正ケース",
          sequence: {
            fragmentType: "opt",
            branch: "else",
          },
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
            type: "validate",
            description: "在庫数が注文数以上であることを確認",
          },
          {
            name: "price_calculation",
            type: "derive",
            description: "合計金額を計算",
            formulas: ["合計金額 = 単価 × 数量"],
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
