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
    const parsed = parseStructuredDetails({ ioType: "invalid_io_type" });

    expect(parsed.structuredSpec).toBeUndefined();
    expect(parsed.parseError).toBeDefined();
  });

  it("normalizes legacy screen trigger value", () => {
    const parsed = parseStructuredDetails({
      ioType: "screen",
      version: "1",
      inputSchema: {
        trigger: "user_action",
        action: "請求書発行指示",
        targetElement: "発行ボタン",
      },
    });

    expect(parsed.parseError).toBeUndefined();
    expect(parsed.structuredSpec?.inputSchema).toBeDefined();
    if (parsed.structuredSpec?.inputSchema && "trigger" in parsed.structuredSpec.inputSchema) {
      expect(parsed.structuredSpec.inputSchema.trigger).toBe("click");
    }
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

  it("auto assigns sideEffect ids when missing", () => {
    const spec = createStructuredSpecFromDdType("api");
    spec.sideEffects = {
      description: "副作用あり",
      dbOperations: [
        {
          table: "invoices",
          operation: "insert",
        },
      ],
      events: [
        {
          eventType: "invoice.created",
          destination: "topic",
          payload: [],
        },
      ],
    };

    const details = composeStructuredDetails(spec) as any;
    expect(details.sideEffects.dbOperations[0].id).toBe("db_1");
    expect(details.sideEffects.events[0].id).toBe("event_1");
  });

  it("parses spec with coreLogic", () => {
    const spec = createStructuredSpecFromDdType("api");
    spec.coreLogic = {
      summary: "テストロジック",
      rules: [
        {
          name: "validation_rule",
          type: "validate",
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
          type: "derive",
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
    if (synced.typeDetail?.ioType === "model" && synced.typeDetail.attributes) {
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
