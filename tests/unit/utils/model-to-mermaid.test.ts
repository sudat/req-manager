import { describe, expect, it } from "bun:test";
import type { DesignDocument } from "../../../lib/domain/entities";
import { modelDDsToMermaidErDiagram } from "../../../lib/utils/design-documents/model-to-mermaid";

function createModelDd(
  id: string,
  entityName: string,
  typeDetailPatch: Record<string, unknown> = {}
): DesignDocument {
  return {
    id,
    srfId: "SF-TEST-0001",
    projectId: "00000000-0000-0000-0000-000000000001",
    name: `${entityName}DD`,
    type: "model",
    summary: "",
    entryPoints: [],
    designPolicy: "",
    details: {
      typeDetail: {
        entityName,
        attributes: [],
        relationships: [],
        ...typeDetailPatch,
      },
    },
    createdAt: "2026-02-12T00:00:00.000Z",
    updatedAt: "2026-02-12T00:00:00.000Z",
  };
}

describe("modelDDsToMermaidErDiagram", () => {
  it("columnMappingsがある場合、カラムレベルの関連ラベルを出力する", () => {
    const dds = [
      createModelDd("DD-ORDER", "Order", {
        relationships: [
          {
            target: "Customer",
            type: "N:1",
            columnMappings: [{ source: "customerId", target: "id" }],
          },
        ],
      }),
      createModelDd("DD-CUSTOMER", "Customer"),
    ];

    const mermaid = modelDDsToMermaidErDiagram(dds);
    expect(mermaid).toContain('Order }o--|| Customer : "customerId -> id"');
  });

  it("columnMappingsが複数ある場合、カンマ区切りで出力する", () => {
    const dds = [
      createModelDd("DD-LINE", "InvoiceLine", {
        relationships: [
          {
            target: "Invoice",
            type: "N:1",
            columnMappings: [
              { source: "invoiceId", target: "id" },
              { source: "invoiceVersion", target: "version" },
            ],
          },
        ],
      }),
      createModelDd("DD-INVOICE", "Invoice"),
    ];

    const mermaid = modelDDsToMermaidErDiagram(dds);
    expect(mermaid).toContain(
      'InvoiceLine }o--|| Invoice : "invoiceId -> id, invoiceVersion -> version"'
    );
  });

  it("columnMappingsとdescriptionがある場合、説明を併記する", () => {
    const dds = [
      createModelDd("DD-PAYMENT", "PaymentDetail", {
        relationships: [
          {
            target: "PaymentRequest",
            type: "N:1",
            description: "支払依頼との関係",
            columnMappings: [{ source: "paymentRequestId", target: "id" }],
          },
        ],
      }),
      createModelDd("DD-REQUEST", "PaymentRequest"),
    ];

    const mermaid = modelDDsToMermaidErDiagram(dds);
    expect(mermaid).toContain(
      'PaymentDetail }o--|| PaymentRequest : "paymentRequestId -> id (支払依頼との関係)"'
    );
  });

  it("columnMappingsがない場合、属性のFK制約からラベルを推定する", () => {
    const dds = [
      createModelDd("DD-PAYMENT", "PaymentDetail", {
        attributes: [
          {
            name: "paymentRequestId",
            type: "UUID",
            constraints: "FK: PaymentRequest.id",
          },
        ],
        relationships: [{ target: "PaymentRequest", type: "N:1" }],
      }),
      createModelDd("DD-REQUEST", "PaymentRequest"),
    ];

    const mermaid = modelDDsToMermaidErDiagram(dds);
    expect(mermaid).toContain(
      'PaymentDetail }o--|| PaymentRequest : "paymentRequestId -> id"'
    );
  });

  it("マッピングも説明もない場合、UNRESOLVED_MAPPINGと警告コメントを出力する", () => {
    const dds = [
      createModelDd("DD-A", "EntityA", {
        relationships: [{ target: "EntityB", type: "1:1" }],
      }),
      createModelDd("DD-B", "EntityB"),
    ];

    const mermaid = modelDDsToMermaidErDiagram(dds);
    expect(mermaid).toContain('EntityA ||--|| EntityB : "UNRESOLVED_MAPPING"');
    expect(mermaid).toContain(
      "%% WARN: EntityA -> EntityB columnMappings / FK constraints / description のいずれかを設定してください"
    );
  });
});
