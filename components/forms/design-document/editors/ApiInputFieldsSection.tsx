import type { ReactNode } from "react";
import { FieldEditor } from "@/components/forms/FieldEditor";
import type { ApiInput } from "@/lib/domain/schemas/io-schemas";

export function ApiInputFieldsSection({
  inputSchema,
  onChange,
}: {
  inputSchema: ApiInput;
  onChange: (inputSchema: ApiInput) => void;
}): ReactNode {
  const queryFields = inputSchema.fields.filter((f) => f.location === "query");
  const bodyFields = inputSchema.fields.filter((f) => f.location === "body");

  const handleQueryChange = (fields: typeof inputSchema.fields) => {
    const otherFields = inputSchema.fields.filter((f) => f.location !== "query");
    onChange({
      ...inputSchema,
      fields: [...fields.map((f) => ({ ...f, location: "query" as const })), ...otherFields],
    });
  };

  const handleBodyChange = (fields: typeof inputSchema.fields) => {
    const otherFields = inputSchema.fields.filter((f) => f.location !== "body");
    onChange({
      ...inputSchema,
      fields: [...otherFields, ...fields.map((f) => ({ ...f, location: "body" as const }))],
    });
  };

  return (
    <div className="space-y-3">
      <FieldEditor
        label="クエリパラメータ項目"
        labelTooltip="URLの末尾に付くパラメータです。1項目につき1つのパラメータ名・型・必須有無を記述します。"
        description="URLの?以降に付与（例: ?page=1&limit=20）"
        fields={queryFields}
        onChange={handleQueryChange}
        compactPreview
      />
      <FieldEditor
        label="リクエストボディ項目"
        labelTooltip="APIに送る本体データです。1項目につき1つのJSONプロパティとして記述します。"
        description="POST/PUT/PATCHリクエストのペイロード"
        fields={bodyFields}
        onChange={handleBodyChange}
        compactPreview
      />
    </div>
  );
}
