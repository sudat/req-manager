import { describe, expect, it } from "bun:test";
import {
  composeStructuredDetails,
  createStructuredSpecFromDdType,
  parseStructuredDetails,
  syncStructuredSpecToDdType,
} from "../../../lib/utils/design-documents/structured-compat";

describe("design-document structured compat", () => {
  it("parses flat structured details", () => {
    const spec = createStructuredSpecFromDdType("api");
    const parsed = parseStructuredDetails(spec);

    expect(parsed.structuredSpec?.ioType).toBe("api");
    expect(parsed.parseError).toBeUndefined();
  });

  it("returns parse error for invalid details", () => {
    const parsed = parseStructuredDetails({ ioType: "api", inputFields: "invalid" });

    expect(parsed.structuredSpec).toBeUndefined();
    expect(parsed.parseError).toBeDefined();
  });

  it("composes structured details", () => {
    const spec = createStructuredSpecFromDdType("screen");
    const details = composeStructuredDetails(spec);

    expect(details.ioType).toBe("screen");
  });

  it("returns empty object when structuredSpec is missing", () => {
    const details = composeStructuredDetails(undefined);
    expect(details).toEqual({});
  });

  it("parses spec with coreLogic", () => {
    const spec = createStructuredSpecFromDdType("api");
    spec.coreLogic = {
      summary: "テストロジック",
      rules: [
        {
          name: "validation_rule",
          type: "validation",
          description: "入力値を検証",
        },
      ],
    };
    const parsed = parseStructuredDetails(spec);

    expect(parsed.structuredSpec?.coreLogic.summary).toBe("テストロジック");
    expect(parsed.structuredSpec?.coreLogic.rules).toHaveLength(1);
    expect(parsed.parseError).toBeUndefined();
  });

  it("preserves coreLogic when syncing to different ddType", () => {
    const spec = createStructuredSpecFromDdType("api");
    spec.coreLogic = {
      summary: "保持されるロジック",
      rules: [
        {
          name: "test_rule",
          type: "calculation",
          description: "計算ルール",
        },
      ],
    };

    const synced = syncStructuredSpecToDdType(spec, "batch");

    expect(synced.ioType).toBe("batch");
    expect(synced.coreLogic.summary).toBe("保持されるロジック");
    expect(synced.coreLogic.rules).toHaveLength(1);
  });

  it("parses model typeDetail with entity definition", () => {
    const modelData = {
      ioType: "model" as const,
      typeDetail: {
        ioType: "model" as const,
        entityName: "Product",
        entityDescription: "商品エンティティ",
        attributes: [
          {
            name: "id",
            type: "UUID",
            primaryKey: true,
            description: "商品ID",
          },
        ],
        relationships: [
          {
            target: "Category",
            type: "N:1" as const,
            description: "商品は1つのカテゴリに属す",
          },
        ],
      },
      inputFields: [],
      outputFields: [],
    };

    const parsed = parseStructuredDetails(modelData);

    expect(parsed.structuredSpec?.ioType).toBe("model");
    expect(parsed.structuredSpec?.typeDetail?.ioType).toBe("model");
    if (parsed.structuredSpec?.typeDetail?.ioType === "model") {
      expect(parsed.structuredSpec.typeDetail.entityName).toBe("Product");
      expect(parsed.structuredSpec.typeDetail.attributes).toHaveLength(1);
      expect(parsed.structuredSpec.typeDetail.relationships).toHaveLength(1);
    }
    expect(parsed.parseError).toBeUndefined();
  });

  it("preserves model typeDetail when syncing model to model", () => {
    const spec = createStructuredSpecFromDdType("model");
    spec.typeDetail = {
      ioType: "model" as const,
      entityName: "User",
      entityDescription: "ユーザーエンティティ",
      attributes: [
        {
          name: "id",
          type: "UUID",
          primaryKey: true,
          description: "ユーザーID",
        },
        {
          name: "email",
          type: "String",
          primaryKey: false,
          description: "メールアドレス",
        },
      ],
      relationships: [],
    };

    const synced = syncStructuredSpecToDdType(spec, "model");

    expect(synced.ioType).toBe("model");
    expect(synced.typeDetail?.ioType).toBe("model");
    if (synced.typeDetail?.ioType === "model") {
      expect(synced.typeDetail.entityName).toBe("User");
      expect(synced.typeDetail.attributes).toHaveLength(2);
      expect(synced.typeDetail.attributes[0].name).toBe("id");
      expect(synced.typeDetail.attributes[1].name).toBe("email");
    }
  });

  it("clears model typeDetail when syncing model to api", () => {
    const spec = createStructuredSpecFromDdType("model");
    spec.typeDetail = {
      ioType: "model" as const,
      entityName: "User",
      entityDescription: "ユーザーエンティティ",
      attributes: [
        {
          name: "id",
          type: "UUID",
          primaryKey: true,
          description: "ユーザーID",
        },
      ],
      relationships: [],
    };

    const synced = syncStructuredSpecToDdType(spec, "api");

    expect(synced.ioType).toBe("api");
    expect(synced.typeDetail).toBeUndefined();
    expect(synced.inputSchema).toBeDefined();
    expect(synced.outputSchema).toBeDefined();
  });
});
