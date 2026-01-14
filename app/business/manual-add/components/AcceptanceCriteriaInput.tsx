"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AcceptanceCriteriaInputProps = {
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
};

export function AcceptanceCriteriaInput({
  values,
  onChange,
  className,
}: AcceptanceCriteriaInputProps) {
  const handleAdd = () => onChange([...values, ""]);
  const handleRemove = (index: number) =>
    onChange(values.filter((_, i) => i !== index));
  const handleChange = (index: number, newValue: string) => {
    const updated = [...values];
    updated[index] = newValue;
    onChange(updated);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-[12px] font-medium text-slate-500">受入条件</Label>
      {values.map((value, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Input
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={`条件 ${index + 1}`}
            className="flex-1 text-[14px]"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-9 w-9 shrink-0"
            onClick={() => handleRemove(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-2 text-[12px]"
        onClick={handleAdd}
      >
        <Plus className="h-4 w-4" />
        条件を追加
      </Button>
    </div>
  );
}
