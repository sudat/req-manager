"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { TaskKnowledge } from "@/lib/domain";

interface TaskFrequencyFieldProps {
  label: string;
  frequency: TaskKnowledge['frequency'];
  description: string;
  onFrequencyChange: (value: TaskKnowledge['frequency']) => void;
  onDescriptionChange: (value: string) => void;
  helperText?: string;
}

const frequencyOptions = [
  { value: 'daily', label: '日次' },
  { value: 'weekly', label: '週次' },
  { value: 'monthly', label: '月次' },
  { value: 'quarterly', label: '四半期' },
  { value: 'yearly', label: '年次' },
  { value: 'irregular', label: '不定期' },
];

export function TaskFrequencyField({
  label,
  frequency,
  description,
  onFrequencyChange,
  onDescriptionChange,
  helperText,
}: TaskFrequencyFieldProps) {
  return (
    <div className="space-y-3">
      <Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">{label}</Label>
      {helperText && (
        <p className="text-[12px] text-slate-500">{helperText}</p>
      )}
      
      <div className="flex gap-3 items-start">
        <Select value={frequency} onValueChange={onFrequencyChange}>
          <SelectTrigger className="w-[140px] text-[14px]">
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            {frequencyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-[14px]">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="毎月月末"
          className="flex-1 text-[14px]"
        />
      </div>
    </div>
  );
}
