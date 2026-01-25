"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type TaskFormProps = {
  bizId: string;
  taskId: string;
  loading: boolean;
  businessName: string | null;
  taskName: string;
  taskSummary: string;
  person: string;
  input: string;
  output: string;
  error: string | null;
  optionsError: string | null;
  canSubmit: boolean;
  saving: boolean;
  onTaskNameChange: (value: string) => void;
  onTaskSummaryChange: (value: string) => void;
  onPersonChange: (value: string) => void;
  onInputChange: (value: string) => void;
  onOutputChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function TaskForm({
  bizId,
  taskId,
  loading,
  businessName,
  taskName,
  taskSummary,
  person,
  input,
  output,
  error,
  optionsError,
  canSubmit,
  saving,
  onTaskNameChange,
  onTaskSummaryChange,
  onPersonChange,
  onInputChange,
  onOutputChange,
  onSubmit,
}: TaskFormProps) {
  return (
    <Card className="rounded-md border border-slate-200 p-3">
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="flex items-center gap-3 text-[12px] text-slate-500">
          <span className="font-mono">{bizId}</span>
          <span className="text-slate-300">/</span>
          <span className="font-mono">
            {loading ? <Skeleton className="h-4 w-16 inline-block align-middle" /> : taskId}
          </span>
          {businessName && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600">{businessName}</span>
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">
            業務タスク<span className="text-slate-900">*</span>
          </Label>
          <Input
            placeholder="例: 請求書発行"
            required
            className="text-[16px] font-semibold"
            value={taskName}
            onChange={(e) => onTaskNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">業務概要</Label>
          <Textarea
            placeholder="この業務タスクで何をするのかを入力してください"
            className="min-h-[100px] text-[14px]"
            value={taskSummary}
            onChange={(e) => onTaskSummaryChange(e.target.value)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">担当者</Label>
            <Input
              placeholder="例: 経理担当"
              className="text-[14px]"
              value={person}
              onChange={(e) => onPersonChange(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">
              インプット
            </Label>
            <Input
              placeholder="例: 請求対象データ"
              className="text-[14px]"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">
              アウトプット
            </Label>
            <Input
              placeholder="例: 請求書（PDF）"
              className="text-[14px]"
              value={output}
              onChange={(e) => onOutputChange(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {optionsError && <p className="text-sm text-rose-600">{optionsError}</p>}

        <div className="flex gap-2 pt-2">
          <Link href={`/business/${bizId}/tasks`}>
            <Button type="button" variant="outline" className="h-8 text-[14px]">
              キャンセル
            </Button>
          </Link>
          <Button
            type="submit"
            className="h-8 text-[14px] bg-slate-900 hover:bg-slate-800"
            disabled={!canSubmit || saving}
          >
            {saving ? "追加中..." : "追加"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
