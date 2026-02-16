"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { Field } from "@/lib/domain/schemas/fields";
import { EmptyState } from "./EmptyState";

export type FieldsViewerVariant =
  | "default"
  | "screen-input"
  | "api-input"
  | "batch-input"
  | "job-input";

interface FieldsViewerProps {
  fields: Field[];
  emptyMessage?: string;
  variant?: FieldsViewerVariant;
}

export function FieldsViewer({
  fields,
  emptyMessage = "未設定",
  variant = "default",
}: FieldsViewerProps): ReactNode {
  if (fields.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const showUiElementColumn = variant === "screen-input";
  const showLocationColumn = variant === "api-input";
  const showCategoryColumn = variant === "batch-input" || variant === "job-input";

  const renderOptionalTag = (value?: string) => {
    if (!value) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <Badge variant="outline" className="text-xs">
        {value}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="w-[22%] px-3 py-2 text-left font-medium">名前</th>
            <th className="w-[10%] px-3 py-2 text-left font-medium">型</th>
            <th className="w-[8%] px-3 py-2 text-left font-medium">必須</th>
            {showUiElementColumn && (
              <th className="w-[10%] px-3 py-2 text-left font-medium">UI属性</th>
            )}
            {showLocationColumn && (
              <th className="w-[10%] px-3 py-2 text-left font-medium">配置</th>
            )}
            {showCategoryColumn && (
              <th className="w-[10%] px-3 py-2 text-left font-medium">カテゴリ</th>
            )}
            <th className="w-[25%] px-3 py-2 text-left font-medium">制約</th>
            <th className="w-[25%] px-3 py-2 text-left font-medium">説明</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={index} className="border-t">
              <td className="px-3 py-2">
                <div className="font-mono text-xs">
                  {field.label || field.name}
                  {field.label && field.name && field.label !== field.name && (
                    <span className="text-muted-foreground"> ( {field.name} )</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {field.type || "any"}
                </code>
              </td>
              <td className="px-3 py-2">
                {field.required && (
                  <Badge variant="secondary" className="text-xs">必須</Badge>
                )}
              </td>
              {showUiElementColumn && (
                <td className="px-3 py-2">{renderOptionalTag(field.elementType)}</td>
              )}
              {showLocationColumn && (
                <td className="px-3 py-2">{renderOptionalTag(field.location)}</td>
              )}
              {showCategoryColumn && (
                <td className="px-3 py-2">{renderOptionalTag(field.category)}</td>
              )}
              <td className="px-3 py-2">
                <div className="flex gap-1 flex-wrap">
                  {field.constraints?.min !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      最小: {field.constraints.min}
                    </Badge>
                  )}
                  {field.constraints?.max !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      最大: {field.constraints.max}
                    </Badge>
                  )}
                  {field.constraints?.pattern && (
                    <Badge variant="outline" className="text-xs font-mono">
                      パターン: {field.constraints.pattern}
                    </Badge>
                  )}
                  {field.constraints?.format && (
                    <Badge variant="outline" className="text-xs">
                      {field.constraints.format}
                    </Badge>
                  )}
                  {field.constraints?.enum && field.constraints.enum.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {field.constraints.enum.join(", ")}
                    </Badge>
                  )}
                  {field.constraints?.default !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      デフォルト: {String(field.constraints.default)}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 text-muted-foreground text-xs">
                {field.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
