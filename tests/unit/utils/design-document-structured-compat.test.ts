import { describe, expect, it } from "bun:test";
import {
  composeStructuredDetails,
  createStructuredSpecFromDdType,
  parseStructuredDetails,
} from "../../../lib/utils/design-documents/structured-compat";

describe("design-document structured compat", () => {
  it("parses flat structured details", () => {
    const spec = createStructuredSpecFromDdType("api");
    const parsed = parseStructuredDetails(spec);

    expect(parsed.structuredSpec?.ioType).toBe("api");
    expect(parsed.legacyDetails.ioType).toBe("api");
    expect(parsed.parseError).toBeUndefined();
  });

  it("parses wrapped structuredSpec for backward compatibility", () => {
    const spec = createStructuredSpecFromDdType("api");
    const parsed = parseStructuredDetails({
      structuredSpec: spec,
      legacyDetails: { memo: "legacy" },
    });

    expect(parsed.structuredSpec?.ioType).toBe("api");
    expect(parsed.legacyDetails.structuredSpec).toBeDefined();
    expect(parsed.parseError).toBeUndefined();
  });

  it("keeps invalid structuredSpec in legacyDetails", () => {
    const parsed = parseStructuredDetails({
      structuredSpec: { ioType: "api", inputFields: "invalid" },
      note: "keep-me",
    });

    expect(parsed.structuredSpec).toBeUndefined();
    expect(parsed.parseError).toBeDefined();
    expect(parsed.legacyDetails.note).toBe("keep-me");
    expect(parsed.legacyDetails.structuredSpec).toBeDefined();
  });

  it("composes structured details with both values", () => {
    const spec = createStructuredSpecFromDdType("screen");
    const details = composeStructuredDetails({
      structuredSpec: spec,
      legacyDetails: { old: true },
    });

    expect(details.ioType).toBe("screen");
    expect(details.old).toBeUndefined();
  });

  it("returns legacy only when structuredSpec is missing", () => {
    const details = composeStructuredDetails({
      legacyDetails: { a: 1 },
    });
    expect(details).toEqual({ a: 1 });
  });
});
