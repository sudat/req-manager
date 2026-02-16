import type {
  ApiInput,
  ApiOutput,
  BatchInput,
  BatchOutput,
  JobInput,
  JobOutput,
  ScreenInput,
  ScreenOutput,
} from "@/lib/domain/schemas/io-schemas";

export type StructuredInputSchema =
  | ApiInput
  | ScreenInput
  | BatchInput
  | JobInput
  | undefined;
export type StructuredOutputSchema =
  | ApiOutput
  | ScreenOutput
  | BatchOutput
  | JobOutput
  | undefined;

export function isApiInputSchema(inputSchema: StructuredInputSchema): inputSchema is ApiInput {
  return Boolean(inputSchema && "method" in inputSchema);
}

export function isScreenInputSchema(
  inputSchema: StructuredInputSchema
): inputSchema is ScreenInput {
  return Boolean(inputSchema && "trigger" in inputSchema);
}

export function isBatchInputSchema(
  inputSchema: StructuredInputSchema
): inputSchema is BatchInput {
  return Boolean(inputSchema && "schedule" in inputSchema);
}

export function isJobInputSchema(inputSchema: StructuredInputSchema): inputSchema is JobInput {
  return Boolean(inputSchema && "event" in inputSchema);
}

export function isApiOutputSchema(
  outputSchema: StructuredOutputSchema
): outputSchema is ApiOutput {
  return Boolean(outputSchema && "success" in outputSchema);
}

export function isScreenOutputSchema(
  outputSchema: StructuredOutputSchema
): outputSchema is ScreenOutput {
  return Boolean(outputSchema && "transition" in outputSchema);
}

export function isBatchOutputSchema(
  outputSchema: StructuredOutputSchema
): outputSchema is BatchOutput {
  return Boolean(outputSchema && "summary" in outputSchema);
}

export function isJobOutputSchema(
  outputSchema: StructuredOutputSchema
): outputSchema is JobOutput {
  return Boolean(outputSchema && "result" in outputSchema);
}
