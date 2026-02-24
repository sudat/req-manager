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
            type: "validate",
            description: "在庫数が注文数以上であることを確認",
          },
          {
            name: "price_calculation",
            type: "derive",
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
    expect(parsed.coreLogic.rules[1].type).toBe("derive");
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
            columnMappings: [
              {
                source: "id",
                target: "userId",
              },
            ],
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

  it("rejects model when entityName is missing", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      ioType: "model",
      typeDetail: {
        ioType: "model",
        attributes: [
          { name: "id", type: "UUID", primaryKey: true },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts non N:M relationship without columnMappings on version=1 (backward compat)", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      ioType: "model",
      typeDetail: {
        ioType: "model",
        entityName: "Invoice",
        attributes: [
          { name: "id", type: "UUID", primaryKey: true },
          { name: "customerId", type: "UUID" },
        ],
        relationships: [
          {
            target: "Customer",
            type: "N:1",
          },
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects non N:M relationship without columnMappings on version=2", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      version: "2",
      ioType: "model",
      typeDetail: {
        ioType: "model",
        entityName: "Invoice",
        attributes: [
          { name: "id", type: "UUID", primaryKey: true },
          { name: "customerId", type: "UUID" },
        ],
        relationships: [
          {
            target: "Customer",
            type: "N:1",
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects relationship mapping source that does not exist in attributes", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      ioType: "model",
      typeDetail: {
        ioType: "model",
        entityName: "Invoice",
        attributes: [
          { name: "id", type: "UUID", primaryKey: true },
          { name: "customerId", type: "UUID" },
        ],
        relationships: [
          {
            target: "Customer",
            type: "N:1",
            columnMappings: [
              { source: "missingColumn", target: "id" },
            ],
          },
        ],
      },
    });

    expect(result.success).toBe(false);
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

  it("rejects unknown sideEffects.ruleRef", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      ioType: "api",
      coreLogic: {
        rules: [
          {
            name: "known_rule",
            type: "validate",
            description: "既知ルール",
          },
        ],
      },
      sideEffects: {
        description: "副作用あり",
        dbOperations: [
          {
            table: "orders",
            operation: "insert",
            ruleRef: "unknown_rule",
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it("parses version=2 guided sequence with valid effect_ref", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      version: "2",
      ioType: "api",
      sideEffects: {
        description: "副作用あり",
        dbOperations: [
          {
            id: "save_invoice",
            table: "invoices",
            operation: "insert",
          },
        ],
      },
      sequence: {
        mode: "guided",
        steps: [
          {
            kind: "effect_ref",
            ref: "db:save_invoice",
          },
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects sequence on version=1", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      version: "1",
      ioType: "api",
      sideEffects: {
        description: "副作用あり",
      },
      sequence: {
        mode: "guided",
        steps: [
          {
            kind: "note",
            text: "step",
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown effect_ref", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      version: "2",
      ioType: "api",
      sideEffects: {
        description: "副作用あり",
        dbOperations: [
          {
            id: "save_invoice",
            table: "invoices",
            operation: "insert",
          },
        ],
      },
      sequence: {
        mode: "guided",
        steps: [
          {
            kind: "effect_ref",
            ref: "db:unknown_id",
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it("parses preconditionViolations when exceptionIndex is valid", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      ioType: "screen",
      coreLogic: {
        rules: [
          {
            name: "validate_input",
            type: "validate",
            description: "入力チェック",
            preconditions: ["請求対象が1件以上選択されている"],
            preconditionViolations: [{ preconditionIndex: 0, exceptionIndex: 0 }],
          },
        ],
      },
      exceptions: [
        {
          type: "validation",
          condition: "請求対象が選択されていない",
          errorCode: "INVOICE_TARGET_REQUIRED",
          message: "請求対象を選択してください",
          recovery: "none",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects preconditionViolations when exceptionIndex is out of range", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      ioType: "screen",
      coreLogic: {
        rules: [
          {
            name: "validate_input",
            type: "validate",
            description: "入力チェック",
            preconditions: ["請求対象が1件以上選択されている"],
            preconditionViolations: [{ preconditionIndex: 0, exceptionIndex: 1 }],
          },
        ],
      },
      exceptions: [
        {
          type: "validation",
          condition: "請求対象が選択されていない",
          errorCode: "INVOICE_TARGET_REQUIRED",
          message: "請求対象を選択してください",
          recovery: "none",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts sideEffects.response.errorExceptionRef when exception exists", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      ioType: "api",
      sideEffects: {
        description: "副作用あり",
        externalApiCalls: [
          {
            endpoint: "https://api.example.com/v1/notify",
            method: "POST",
            response: {
              errorLabel: "通知失敗",
              errorExceptionRef: "NOTIFY_FAILED",
            },
          },
        ],
      },
      exceptions: [
        {
          type: "external",
          condition: "通知APIが失敗",
          errorCode: "NOTIFY_FAILED",
          message: "通知に失敗しました",
          recovery: "retry_with_backoff",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects sequence.call.errorExceptionRef when exception is missing", () => {
    const result = structuredDesignDocumentSpecSchema.safeParse({
      version: "2",
      ioType: "api",
      sideEffects: {
        description: "副作用なし",
      },
      sequence: {
        mode: "guided",
        steps: [
          {
            kind: "call",
            id: "call_1",
            targetDdId: "DD-SF-AR-0001-002",
            callType: "sync",
            errorLabel: "呼び出し失敗",
            errorExceptionRef: "MISSING_EXCEPTION",
          },
        ],
      },
      exceptions: [],
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
