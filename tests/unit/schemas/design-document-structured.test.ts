import { describe, expect, it } from "bun:test";
import {
  createEmptyStructuredDesignDocumentSpec,
  ddTypeToStructuredIoType,
  structuredDesignDocumentSpecSchema,
} from "../../../lib/domain/schemas/design-document-structured";

describe("structuredDesignDocumentSpecSchema", () => {
  it("applies defaults for api spec", () => {
    const parsed = structuredDesignDocumentSpecSchema.parse({
      ioType: "api",
      inputFields: [],
      outputFields: [],
    });

    expect(parsed.version).toBe("1");
    expect(parsed.sideEffects.description).toBe("副作用なし");
    expect(parsed.exceptions).toEqual([]);
    expect(parsed.nonFunctional).toEqual({});
    expect(parsed.coreLogic.rules).toEqual([]);
  });

  it("parses spec with coreLogic", () => {
    const parsed = structuredDesignDocumentSpecSchema.parse({
      ioType: "api",
      inputFields: [],
      coreLogic: {
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
      },
      outputFields: [],
    });

    expect(parsed.coreLogic.summary).toBe("受注処理のコアロジック");
    expect(parsed.coreLogic.rules).toHaveLength(2);
    expect(parsed.coreLogic.rules[0].name).toBe("stock_check");
    expect(parsed.coreLogic.rules[1].type).toBe("calculation");
  });

  it("parses model typeDetail with entity definition", () => {
    const parsed = structuredDesignDocumentSpecSchema.parse({
      ioType: "model",
      typeDetail: {
        ioType: "model",
        entityName: "User",
        entityDescription: "システムユーザー",
        attributes: [
          {
            name: "id",
            type: "UUID",
            primaryKey: true,
            nullable: false,
            description: "ユーザーID",
          },
          {
            name: "email",
            type: "string",
            nullable: false,
            description: "メールアドレス",
            constraints: "UNIQUE",
          },
          {
            name: "status",
            type: "enum",
            enumValues: ["active", "inactive", "suspended"],
            description: "ユーザーステータス",
          },
        ],
        relationships: [
          {
            target: "Order",
            type: "1:N",
            description: "ユーザーは複数の注文を持つ",
          },
        ],
        stateTransitions: [
          {
            from: "active",
            to: ["inactive", "suspended"],
            condition: "管理者による操作",
          },
        ],
      },
      inputFields: [],
      outputFields: [],
    });

    expect(parsed.typeDetail?.ioType).toBe("model");
    if (parsed.typeDetail?.ioType === "model") {
      expect(parsed.typeDetail.entityName).toBe("User");
      expect(parsed.typeDetail.attributes).toHaveLength(3);
      expect(parsed.typeDetail.attributes?.[0].name).toBe("id");
      expect(parsed.typeDetail.attributes?.[0].primaryKey).toBe(true);
      expect(parsed.typeDetail.relationships).toHaveLength(1);
      expect(parsed.typeDetail.relationships?.[0].type).toBe("1:N");
      expect(parsed.typeDetail.stateTransitions).toHaveLength(1);
      expect(parsed.typeDetail.stateTransitions?.[0].from).toBe("active");
    }
  });

  it("rejects mismatched ioType and typeDetail.ioType", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      ioType: "api",
      typeDetail: { ioType: "screen", route: "/x" },
      inputFields: [],
      outputFields: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("structured design helpers", () => {
  it("maps dd type to structured io type", () => {
    expect(ddTypeToStructuredIoType("api")).toBe("api");
    expect(ddTypeToStructuredIoType("external_if")).toBe("external_if");
    expect(ddTypeToStructuredIoType("report")).toBe("report");
  });

  it("creates empty core spec with input/output schema", () => {
    const spec = createEmptyStructuredDesignDocumentSpec("api");
    expect(spec.inputSchema && "method" in spec.inputSchema).toBe(true);
    expect(spec.outputSchema && "success" in spec.outputSchema).toBe(true);
    expect(spec.coreLogic.rules).toEqual([]);
  });

  it("creates screen spec with behavior context defaults", () => {
    const spec = createEmptyStructuredDesignDocumentSpec("screen");
    expect(spec.inputSchema && "trigger" in spec.inputSchema).toBe(true);
    expect(spec.inputSchema && "action" in spec.inputSchema).toBe(true);
    expect(spec.outputSchema && "behavior" in spec.outputSchema).toBe(true);
  });
});
