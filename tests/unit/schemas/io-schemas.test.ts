import { describe, it, expect } from "bun:test";
import { fieldSchema } from "../../../lib/domain/schemas/fields";
import { apiInputSchema, apiOutputSchema } from "../../../lib/domain/schemas/io-schemas";

describe("fieldSchema", () => {
  it("requires name", () => {
    expect(() => fieldSchema.parse({ type: "string" })).toThrow();
  });

  it("applies defaults", () => {
    const result = fieldSchema.parse({ name: "amount", type: "number" });
    expect(result.required).toBe(true);
  });
});

describe("api schemas", () => {
  it("accepts minimal api input", () => {
    const result = apiInputSchema.parse({
      method: "POST",
      path: "/api/invoices",
    });
    expect(result.method).toBe("POST");
  });

  it("accepts api output with success", () => {
    const result = apiOutputSchema.parse({
      success: { status: 200, fields: [] },
    });
    expect(result.success.status).toBe(200);
  });
});
