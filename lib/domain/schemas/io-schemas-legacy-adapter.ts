import type { Field } from "./fields";
import {
  apiInputSchema,
  apiOutputSchema,
  batchInputSchema,
  batchOutputSchema,
  jobInputSchema,
  jobOutputSchema,
  screenInputSchema,
  screenOutputSchema,
  type ApiInput,
  type ApiOutput,
  type BatchInput,
  type BatchOutput,
  type JobInput,
  type JobOutput,
  type ScreenInput,
  type ScreenOutput,
  type StructuredInput,
  type StructuredOutput,
} from "./io-schemas-core";

type WithLegacyFields = {
  fields?: Field[];
  dataFields?: Field[];
};

const cloneFields = (fields?: Field[]): Field[] => fields ? [...fields] : [];

export const normalizeLegacyIoShape = <T extends WithLegacyFields>(value: T): T => {
  const next: T = { ...value };
  const normalizedFields = cloneFields(next.fields);

  if (normalizedFields.length === 0 && next.dataFields && next.dataFields.length > 0) {
    next.fields = cloneFields(next.dataFields);
  }

  if (next.dataFields === undefined && next.fields) {
    next.dataFields = cloneFields(next.fields);
  }

  return next;
};

export const toLegacyIoShape = <T extends WithLegacyFields>(value: T): T => {
  const next: T = { ...value };
  if (next.fields && !next.dataFields) {
    next.dataFields = cloneFields(next.fields);
  }
  return next;
};

// 後方互換性のための値エイリアス（非推奨）
/** @deprecated Use apiInputSchema instead */
export const apiInputSchemaV2 = apiInputSchema;
/** @deprecated Use screenInputSchema instead */
export const screenInputSchemaV2 = screenInputSchema;
/** @deprecated Use batchInputSchema instead */
export const batchInputSchemaV2 = batchInputSchema;
/** @deprecated Use jobInputSchema instead */
export const jobInputSchemaV2 = jobInputSchema;
/** @deprecated Use apiOutputSchema instead */
export const apiOutputSchemaV2 = apiOutputSchema;
/** @deprecated Use screenOutputSchema instead */
export const screenOutputSchemaV2 = screenOutputSchema;
/** @deprecated Use batchOutputSchema instead */
export const batchOutputSchemaV2 = batchOutputSchema;
/** @deprecated Use jobOutputSchema instead */
export const jobOutputSchemaV2 = jobOutputSchema;

// 後方互換性のための型エイリアス（非推奨）
/** @deprecated Use ApiInput instead */
export type ApiInputV2 = ApiInput;
/** @deprecated Use ScreenInput instead */
export type ScreenInputV2 = ScreenInput;
/** @deprecated Use BatchInput instead */
export type BatchInputV2 = BatchInput;
/** @deprecated Use JobInput instead */
export type JobInputV2 = JobInput;
/** @deprecated Use ApiOutput instead */
export type ApiOutputV2 = ApiOutput;
/** @deprecated Use ScreenOutput instead */
export type ScreenOutputV2 = ScreenOutput;
/** @deprecated Use BatchOutput instead */
export type BatchOutputV2 = BatchOutput;
/** @deprecated Use JobOutput instead */
export type JobOutputV2 = JobOutput;
/** @deprecated Use StructuredInput instead */
export type StructuredInputV2 = StructuredInput;
/** @deprecated Use StructuredOutput instead */
export type StructuredOutputV2 = StructuredOutput;
