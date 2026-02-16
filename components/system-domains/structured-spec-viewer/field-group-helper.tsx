import type { ReactNode } from "react";
import type { Field } from "@/lib/domain/schemas/fields";
import { FieldsViewer, type FieldsViewerVariant } from "./FieldsViewer";
import { LabeledValue } from "./LabeledValue";

export function renderFieldGroup(
  label: string,
  fields: Field[] | undefined,
  variant: FieldsViewerVariant = "default"
): ReactNode {
  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <LabeledValue label={label} labelClassName="font-medium" valueClassName="">
      <FieldsViewer fields={fields} variant={variant} />
    </LabeledValue>
  );
}
