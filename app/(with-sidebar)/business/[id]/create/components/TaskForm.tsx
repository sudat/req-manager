"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KeySourceListField } from "@/components/forms/key-source-list-field";
import { ConceptIdsField } from "@/components/forms/concept-ids-field";
import { ProcessStepsField } from "@/components/forms/process-steps-field";
import type { SelectableItem } from "@/lib/domain/forms";

type TaskFormProps = {
  bizId: string;
  taskId: string;
  loading: boolean;
  businessName: string | null;
  taskName: string;
  taskSummary: string;
  businessContext: string;
  processSteps: string;
  input: string;
  output: string;
  conceptIdsYaml: string;
  concepts: SelectableItem[];
  error: string | null;
  optionsError: string | null;
  canSubmit: boolean;
  saving: boolean;
  onTaskNameChange: (value: string) => void;
  onTaskSummaryChange: (value: string) => void;
  onBusinessContextChange: (value: string) => void;
  onProcessStepsChange: (value: string) => void;
  onInputChange: (value: string) => void;
  onOutputChange: (value: string) => void;
  onConceptIdsYamlChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function TaskForm({
  bizId,
  taskId,
  loading,
  businessName,
  taskName,
  taskSummary,
  businessContext,
  processSteps,
  input,
  output,
  conceptIdsYaml,
  concepts,
  error,
  optionsError,
  canSubmit,
  saving,
  onTaskNameChange,
  onTaskSummaryChange,
  onBusinessContextChange,
  onProcessStepsChange,
  onInputChange,
  onOutputChange,
  onConceptIdsYamlChange,
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
          <Label className="text-[12px] font-medium text-slate-500">
            業務概要<span className="text-slate-900">*</span>
          </Label>
          <Textarea
            placeholder="この業務タスクで何をするのかを入力してください"
            className="min-h-[100px] text-[14px]"
            value={taskSummary}
            onChange={(e) => onTaskSummaryChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">
            業務コンテキスト<span className="text-slate-900">*</span>
          </Label>
          <Textarea
            placeholder="実施組織・ロール、タイミング・頻度、前後の業務、業務ルールなど"
            className="min-h-[120px] text-[14px]"
            value={businessContext}
            onChange={(e) => onBusinessContextChange(e.target.value)}
          />
        </div>

        <ProcessStepsField
          label="process_steps"
          value={processSteps}
          onChange={onProcessStepsChange}
          helperText="いつ／誰が／何をするかを入力します（任意）。"
        />

        <KeySourceListField
          label="inputs"
          value={input}
          onChange={onInputChange}
          namePlaceholder="入力の名前"
          sourcePlaceholder="ソース"
          helperText="開始時に必要な情報を名前/ソースで整理します。"
        />
        <KeySourceListField
          label="outputs"
          value={output}
          onChange={onOutputChange}
          namePlaceholder="出力の名前"
          sourcePlaceholder="ソース"
          helperText="完了後の成果物を名前/ソースで整理します。"
        />
        <ConceptIdsField
          label="concept_ids"
          value={conceptIdsYaml}
          onChange={onConceptIdsYamlChange}
          concepts={concepts}
          helperText="関連概念IDをバッジで管理します（任意）。"
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {optionsError && <p className="text-sm text-rose-600">{optionsError}</p>}

        <div className="flex gap-2 pt-2">
          <Link href={`/business/${bizId}`}>
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
