"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Field } from "@/lib/domain/schemas/fields";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Plus, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD_TYPES: Field["type"][] = [
  "string",
  "number",
  "boolean",
  "enum",
  "object",
  "array",
];

interface FieldEditorProps {
  label?: string;
  labelTooltip?: string;
  description?: string;
  fields: Field[];
  onChange: (fields: Field[]) => void;
  compactPreview?: boolean;
}

const createEmptyField = (): Field => ({
  name: "",
  type: "string",
  required: true,
  description: "",
  constraints: {},
});

export function FieldEditor({
  label,
  labelTooltip,
  description,
  fields,
  onChange,
  compactPreview = false,
}: FieldEditorProps) {
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!compactPreview) return;
    setSelectedFieldIndex((prev) => {
      if (prev === null) return null;
      return prev < fields.length ? prev : null;
    });
  }, [compactPreview, fields.length]);

  const handleFieldChange = (index: number, partial: Partial<Field>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const handleConstraintChange = (
    index: number,
    partial: NonNullable<Field["constraints"]>
  ) => {
    const current = fields[index].constraints ?? {};
    handleFieldChange(index, { constraints: { ...current, ...partial } });
  };

  const addField = () => {
    const nextFields = [...fields, createEmptyField()];
    onChange(nextFields);
    if (compactPreview) {
      setSelectedFieldIndex(nextFields.length - 1);
    }
  };
  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
    if (compactPreview) {
      setSelectedFieldIndex((prev) => {
        if (prev === null) return null;
        if (prev === index) return null;
        if (prev > index) return prev - 1;
        return prev;
      });
    }
  };
  const compactNames = fields.map((field, index) => field.name || `項目${index + 1}`);
  const visibleFieldIndices = compactPreview
    ? selectedFieldIndex === null
      ? []
      : [selectedFieldIndex]
    : fields.map((_, index) => index);
  const shouldRenderEditor = !compactPreview || fields.length === 0 || selectedFieldIndex !== null;

  return (
    <div className="space-y-3">
      <div>
        {label && (
          <div className="inline-flex items-center gap-1.5">
            <Label>{label}</Label>
            {labelTooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${label} の説明`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CircleHelp className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[min(90vw,48rem)] whitespace-normal leading-relaxed">
                  {labelTooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {compactPreview && (
        <div className="w-full rounded-md border border-dashed px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {fields.length > 0 ? `${fields.length}項目` : "項目なし"}
            </span>
            {selectedFieldIndex !== null ? (
              <button
                type="button"
                onClick={() => setSelectedFieldIndex(null)}
                className="text-xs text-primary hover:underline"
              >
                選択解除
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">タグをクリックして詳細表示</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {compactNames.length > 0 ? (
              compactNames.map((name, index) => (
                <button
                  type="button"
                  key={`${name}-${index}`}
                  onClick={() =>
                    setSelectedFieldIndex((prev) => (prev === index ? null : index))
                  }
                  className={cn(
                    "inline-block rounded-full px-2 py-1 text-xs transition-colors",
                    selectedFieldIndex === index
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {name}
                </button>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">まだフィールドがありません。</span>
            )}
          </div>
        </div>
      )}

      {shouldRenderEditor && (
        <>
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">まだフィールドがありません。</p>
          )}
          <div className="space-y-4">
            {visibleFieldIndices.map((index) => {
              const field = fields[index];
              return (
              <div key={index} className="rounded-md border p-3 space-y-3">
                <div className="grid grid-cols-[12%_12%_12%_1fr_auto_auto] gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">名前</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                      placeholder="例: customer_id"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">表示名</Label>
                    <Input
                      value={field.label ?? ""}
                      onChange={(e) => handleFieldChange(index, { label: e.target.value })}
                      placeholder="例: 顧客ID"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">型</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) =>
                        handleFieldChange(index, { type: value as Field["type"] })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">説明</Label>
                    <Input
                      value={field.description ?? ""}
                      onChange={(e) => handleFieldChange(index, { description: e.target.value })}
                      placeholder="例: 顧客ID"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.required ?? true}
                      onCheckedChange={(checked) =>
                        handleFieldChange(index, { required: checked })
                      }
                    />
                    <span className="text-xs text-muted-foreground">必須</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(index)}
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-[15%_15%_55%_1fr] gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">最小値</Label>
                    <Input
                      type="number"
                      value={field.constraints?.min ?? ""}
                      onChange={(e) =>
                        handleConstraintChange(index, {
                          min: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">最大値</Label>
                    <Input
                      type="number"
                      value={field.constraints?.max ?? ""}
                      onChange={(e) =>
                        handleConstraintChange(index, {
                          max: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">パターン</Label>
                    <Input
                      value={field.constraints?.pattern ?? ""}
                      onChange={(e) => handleConstraintChange(index, { pattern: e.target.value })}
                      placeholder="^C[0-9]{6}$"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">フォーマット（任意）</Label>
                    <Select
                      value={field.constraints?.format}
                      onValueChange={(value) =>
                        handleConstraintChange(index, {
                          format: value as "email" | "date" | "uuid",
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">email</SelectItem>
                        <SelectItem value="date">date</SelectItem>
                        <SelectItem value="uuid">uuid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {field.type === "enum" && (
                  <div className="space-y-1">
                    <Label className="text-xs">列挙値（カンマ区切り）</Label>
                    <Input
                      value={(field.constraints?.enum ?? []).join(",")}
                      onChange={(e) =>
                        handleConstraintChange(index, {
                          enum: e.target.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="issued, error"
                    />
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </>
      )}
      <div className="flex justify-end">
        <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addField}>
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </div>
    </div>
  );
}
