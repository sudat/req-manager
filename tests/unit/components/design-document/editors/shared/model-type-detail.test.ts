import { describe, expect, it } from "bun:test";
import {
  createEmptyStructuredDesignDocumentSpec,
  type StructuredDesignDocumentSpec,
} from "../../../../../../lib/domain/schemas/design-document-structured";
import {
  patchModelAttribute,
  patchModelTypeDetail,
  updateModelAttributes,
} from "../../../../../../components/forms/design-document/editors/shared/model-type-detail";

describe("model-type-detail helper", () => {
  it("model typeDetailがない場合でもpatchで作成できる", () => {
    const spec = createEmptyStructuredDesignDocumentSpec("model");

    const next = patchModelTypeDetail(spec, {
      entityName: "User",
      entityLogicalName: "ユーザー",
    });

    expect(next.typeDetail?.ioType).toBe("model");
    if (next.typeDetail?.ioType === "model") {
      expect(next.typeDetail.entityName).toBe("User");
      expect(next.typeDetail.entityLogicalName).toBe("ユーザー");
    }
  });

  it("属性配列を更新関数で置き換えできる", () => {
    const spec = createEmptyStructuredDesignDocumentSpec("model");

    const next = updateModelAttributes(spec, (attrs) => [
      ...attrs,
      { name: "id", type: "UUID", primaryKey: true },
    ]);

    expect(next.typeDetail?.ioType).toBe("model");
    if (next.typeDetail?.ioType === "model") {
      expect(next.typeDetail.attributes).toHaveLength(1);
      expect(next.typeDetail.attributes?.[0]?.name).toBe("id");
    }
  });

  it("指定インデックスの属性をpatchできる", () => {
    const spec: StructuredDesignDocumentSpec = {
      ...createEmptyStructuredDesignDocumentSpec("model"),
      typeDetail: {
        ioType: "model",
        attributes: [
          { name: "email", type: "string", description: "before" },
        ],
      },
    };

    const next = patchModelAttribute(spec, 0, {
      description: "after",
      unique: true,
    });

    expect(next.typeDetail?.ioType).toBe("model");
    if (next.typeDetail?.ioType === "model") {
      expect(next.typeDetail.attributes?.[0]?.description).toBe("after");
      expect(next.typeDetail.attributes?.[0]?.unique).toBe(true);
    }
  });

  it("model以外のtypeDetailでもmodel構造へ正規化される", () => {
    const spec = createEmptyStructuredDesignDocumentSpec("api");

    const next = patchModelTypeDetail(spec, {
      entityName: "Invoice",
    });

    expect(next.typeDetail?.ioType).toBe("model");
    if (next.typeDetail?.ioType === "model") {
      expect(next.typeDetail.entityName).toBe("Invoice");
    }
  });
});
