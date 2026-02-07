"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Field } from "@/lib/domain/schemas/fields";
import { Trash2, Plus } from "lucide-react";

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
  fields: Field[];
  onChange: (fields: Field[]) => void;
}

const createEmptyField = (): Field => ({
  name: "",
  type: "string",
  required: true,
  description: "",
  constraints: {},
});

export function FieldEditor({ label, fields, onChange }: FieldEditorProps) {
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

  const addField = () => onChange([...fields, createEmptyField()]);
  const removeField = (index: number) =>
    onChange(fields.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">まだフィールドがありません。</p>
      )}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="rounded-md border p-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">名前</Label>
                <Input
                  value={field.name}
                  onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                  placeholder="例: customer_id"
                />
              </div>
              <div className="w-40 space-y-1">
                <Label className="text-xs">型</Label>
                <Select
                  value={field.type}
                  onValueChange={(value) =>
                    handleFieldChange(index, { type: value as Field["type"] })
                  }
                >
                  <SelectTrigger>
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
              <div className="flex items-center gap-2 pt-5">
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

            <div className="space-y-1">
              <Label className="text-xs">説明</Label>
              <Input
                value={field.description ?? ""}
                onChange={(e) => handleFieldChange(index, { description: e.target.value })}
                placeholder="例: 顧客ID"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">最小値 / 最小長</Label>
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
                <Label className="text-xs">最大値 / 最大長</Label>
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
                  placeholder="例: ^C[0-9]{6}$"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">フォーマット</Label>
                <Input
                  value={field.constraints?.format ?? ""}
                  onChange={(e) => handleConstraintChange(index, { format: e.target.value as any })}
                  placeholder="email / uuid / date など"
                />
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
        ))}
      </div>
      <Button variant="outline" onClick={addField}>
        <Plus className="h-4 w-4 mr-2" />
        フィールド追加
      </Button>
    </div>
  );
}
