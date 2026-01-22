"use client";

import { use, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SelectionDialog } from "@/components/forms/SelectionDialog";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useProject } from "@/components/project/project-context";
import { createBusinessRequirements } from "@/lib/data/business-requirements";
import { acceptanceCriteriaJsonToLegacy, mergeAcceptanceCriteriaJsonWithLegacy } from "@/lib/data/structured";
import { listSystemRequirementsByIds, updateSystemRequirement } from "@/lib/data/system-requirements";
import { createTask, deleteTask } from "@/lib/data/tasks";
import type { SelectableItem, SelectionDialogState, SelectionDialogType } from "@/lib/domain/forms";
import { requireProjectId } from "@/lib/utils/project";
import { RequirementsSection } from "./components/RequirementsSection";
import { TaskForm } from "./components/TaskForm";
import { useManualAddData } from "./hooks/use-manual-add-data";
import { useRequirements } from "./hooks/use-requirements";

type BusinessTaskCreatePageContentProps = {
  bizId: string;
};

function BusinessTaskCreatePageContent({ bizId }: BusinessTaskCreatePageContentProps): JSX.Element {
  const router = useRouter();
  const { currentProjectId, loading: projectLoading } = useProject();

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
    systemRequirements,
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

  const businessRequirementItems: SelectableItem[] = useMemo(
    () =>
      requirements.map((req) => ({
        id: req.id,
        name: req.title || req.id,
      })),
    [requirements]
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
    const projectId = requireProjectId({
      currentProjectId,
      projectLoading,
      onMissing: setError,
    });
    if (!projectId) return;

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
      projectId,
    });

    if (saveError) {
      setError(saveError);
      setSaving(false);
      return;
    }

    const requirementPayload = requirements.map((req, index) => {
      const acceptanceCriteriaJson = mergeAcceptanceCriteriaJsonWithLegacy(
        req.acceptanceCriteriaJson,
        req.acceptanceCriteria
          .map((criteria) => criteria.trim())
          .filter((criteria) => criteria.length > 0)
      );

      return {
        id: req.id,
        taskId,
        title: req.title.trim(),
        summary: req.summary.trim(),
        conceptIds: req.conceptIds,
        srfId: req.srfId,
        systemDomainIds: req.systemDomainIds,
        impacts: [],
        relatedSystemRequirementIds: req.relatedSystemRequirementIds ?? [],
        priority: req.priority,
        acceptanceCriteriaJson,
        acceptanceCriteria: acceptanceCriteriaJsonToLegacy(acceptanceCriteriaJson),
        sortOrder: index + 1,
        projectId,
      };
    });

    const { error: requirementError } = await createBusinessRequirements(
      requirementPayload
    );

    if (requirementError) {
      const rollback = await deleteTask(taskId, projectId);
      const rollbackMessage = rollback.error
        ? `（ロールバック失敗: ${rollback.error}）`
        : "";
      setError(`業務要件の保存に失敗しました。${rollbackMessage}`);
      setSaving(false);
      return;
    }

    // 業務要件のrelatedSystemRequirementIdsからシステム要件を更新
    const allSystemReqIds = new Set<string>();
    const bizReqIdsBySystemReq = new Map<string, Set<string>>();
    
    for (const bizReq of requirementPayload) {
      for (const sysReqId of bizReq.relatedSystemRequirementIds ?? []) {
        allSystemReqIds.add(sysReqId);
        if (!bizReqIdsBySystemReq.has(sysReqId)) {
          bizReqIdsBySystemReq.set(sysReqId, new Set());
        }
        bizReqIdsBySystemReq.get(sysReqId)?.add(bizReq.id);
      }
    }

    if (allSystemReqIds.size > 0) {
      const { data: existingSystemReqs } = await listSystemRequirementsByIds(
        Array.from(allSystemReqIds),
        projectId
      );
      
      if (existingSystemReqs) {
        for (const sysReq of existingSystemReqs) {
          const newBizReqIds = bizReqIdsBySystemReq.get(sysReq.id) ?? new Set();
          const existingBizReqIds = new Set(sysReq.businessRequirementIds);
          const mergedBizReqIds = Array.from(new Set([...existingBizReqIds, ...newBizReqIds]));
          
          await updateSystemRequirement(sysReq.id, {
            taskId: sysReq.taskId,
            srfId: sysReq.srfId,
            title: sysReq.title,
            summary: sysReq.summary,
            conceptIds: sysReq.conceptIds,
            impacts: sysReq.impacts,
            category: sysReq.category,
            businessRequirementIds: mergedBizReqIds,
            acceptanceCriteriaJson: sysReq.acceptanceCriteriaJson,
            acceptanceCriteria: sysReq.acceptanceCriteria,
            systemDomainIds: sysReq.systemDomainIds,
            sortOrder: sysReq.sortOrder,
          }, projectId);
        }
      }
    }

    router.push(`/business/${bizId}/tasks`);
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
            業務タスクを新規作成
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
            systemRequirements={systemRequirements}
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
        businessRequirements={businessRequirementItems}
        systemRequirements={systemRequirements}
        onUpdateRequirement={updateRequirement}
      />
    </>
  );
}

type BusinessTaskCreatePageProps = {
  params: Promise<{ id: string }>;
};

export default function BusinessTaskCreatePage({ params }: BusinessTaskCreatePageProps): JSX.Element {
  const { id } = use(params);

  return (
    <>
      <MobileHeader />
      <BusinessTaskCreatePageContent bizId={id} />
    </>
  );
}
