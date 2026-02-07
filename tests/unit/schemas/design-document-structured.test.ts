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
  });
});
