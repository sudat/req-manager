"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ArrowLeft } from "lucide-react";
import { createTask, deleteTask } from "@/lib/data/tasks";
import { createBusinessRequirements } from "@/lib/data/business-requirements";
import { useManualAddData } from "./hooks/use-manual-add-data";
import { useRequirements } from "./hooks/use-requirements";
import { TaskForm } from "./components/TaskForm";
import { RequirementsSection } from "./components/RequirementsSection";
import { SelectionDialog } from "@/components/forms/SelectionDialog";
import type { SelectionDialogState, SelectionDialogType } from "@/lib/domain/forms";

function ManualAddPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bizId = searchParams.get("id");

  const {
    loading,
    error: dataError,
    optionsError,
    taskId,
    sortOrder,
    businessName,
    concepts,
    systemFunctions,
    systemDomains,
  } = useManualAddData(bizId);

  const {
    requirements,
    addRequirement,
    updateRequirement,
    removeRequirement,
  } = useRequirements();

  const [taskName, setTaskName] = useState("");
  const [taskSummary, setTaskSummary] = useState("");
  const [person, setPerson] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogState, setDialogState] = useState<SelectionDialogState>(null);

  const canSubmit = useMemo(
    () => !!bizId && !!businessName && taskName.trim().length > 0 && !loading,
    [bizId, businessName, taskName, loading]
  );

  const activeRequirement = useMemo(
    () =>
      dialogState
        ? requirements.find((req) => req.id === dialogState.reqId) ?? null
        : null,
    [dialogState, requirements]
  );

  function handleOpenDialog(type: SelectionDialogType, reqId: string): void {
    setDialogState({ type, reqId });
  }

  function handleCloseDialog(): void {
    setDialogState(null);
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!bizId || !canSubmit) return;

    setSaving(true);
    setError(null);

    const { error: saveError } = await createTask({
      id: taskId,
      businessId: bizId,
      name: taskName.trim(),
      summary: taskSummary.trim(),
      person: person.trim(),
      input: input.trim(),
      output: output.trim(),
      concepts: [],
      sortOrder,
    });

    if (saveError) {
      setError(saveError);
      setSaving(false);
      return;
    }

    const requirementPayload = requirements.map((req, index) => ({
      id: req.id,
      taskId,
      title: req.title.trim(),
      summary: req.summary.trim(),
      conceptIds: req.conceptIds,
      srfId: req.srfId,
      systemDomainIds: req.systemDomainIds,
      impacts: [],
      relatedSystemRequirementIds: [],
      acceptanceCriteria: req.acceptanceCriteria
        .map((criteria) => criteria.trim())
        .filter((criteria) => criteria.length > 0),
      sortOrder: index + 1,
    }));

    const { error: requirementError } = await createBusinessRequirements(
      requirementPayload
    );

    if (requirementError) {
      const rollback = await deleteTask(taskId);
      const rollbackMessage = rollback.error
        ? `（ロールバック失敗: ${rollback.error}）`
        : "";
      setError(`業務要件の保存に失敗しました。${rollbackMessage}`);
      setSaving(false);
      return;
    }

    router.push(`/business/${bizId}/tasks`);
  }

  if (!bizId) {
    return (
    <>
        <div className="flex-1 min-h-screen bg-white">
          <div className="mx-auto max-w-[1400px] px-8 py-6">
            <p className="text-sm text-rose-600">
              業務IDが指定されていません。
            </p>
            <Link
              href="/business"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900 mt-4"
            >
              <ArrowLeft className="h-4 w-4" />
              業務一覧に戻る
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-6">
          <Link
            href={`/business/${bizId}/tasks`}
            className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            業務一覧（詳細）に戻る
          </Link>

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-6">
            業務タスクを手動追加
          </h1>

          <TaskForm
            bizId={bizId}
            taskId={taskId}
            loading={loading}
            businessName={businessName}
            taskName={taskName}
            taskSummary={taskSummary}
            person={person}
            input={input}
            output={output}
            error={error ?? dataError}
            optionsError={optionsError}
            canSubmit={canSubmit}
            saving={saving}
            onTaskNameChange={setTaskName}
            onTaskSummaryChange={setTaskSummary}
            onPersonChange={setPerson}
            onInputChange={setInput}
            onOutputChange={setOutput}
            onSubmit={handleSubmit}
          />

          <RequirementsSection
            requirements={requirements}
            concepts={concepts}
            systemFunctions={systemFunctions}
            systemDomains={systemDomains}
            loading={loading}
            onAddRequirement={() => addRequirement(taskId)}
            onUpdateRequirement={updateRequirement}
            onRemoveRequirement={removeRequirement}
            onOpenDialog={handleOpenDialog}
          />
        </div>
      </div>

      <SelectionDialog
        dialogState={dialogState}
        onClose={handleCloseDialog}
        activeRequirement={activeRequirement}
        concepts={concepts}
        systemFunctions={systemFunctions}
        systemDomains={systemDomains}
        onUpdateRequirement={updateRequirement}
      />
    </>
  );
}

export default function ManualAddPage() {
  return (
    <>
      <MobileHeader />
      <Suspense fallback={
        <div className="flex-1 min-h-screen bg-white">
          <div className="mx-auto max-w-[1400px] px-8 py-6">
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-slate-200 rounded w-48" />
              <div className="h-4 bg-slate-200 rounded w-32" />
              <div className="h-64 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      }>
        <ManualAddPageContent />
      </Suspense>
    </>
  );
}
