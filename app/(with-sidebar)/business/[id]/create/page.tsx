"use client";

import { use, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SelectionDialog } from "@/components/forms/SelectionDialog";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useProject } from "@/components/project/project-context";
import { createBusinessRequirements } from "@/lib/data/business-requirements";
import { createTask, deleteTask } from "@/lib/data/tasks";
import { createRequirementLinks, type RequirementLinkCreateInput } from "@/lib/data/requirement-links";
import type { SelectableItem, SelectionDialogState, SelectionDialogType } from "@/lib/domain/forms";
import { requireProjectId } from "@/lib/utils/project";
import { RequirementsSection } from "./components/RequirementsSection";
import { TaskForm } from "./components/TaskForm";
import { useManualAddData } from "./hooks/use-manual-add-data";
import { useRequirements } from "./hooks/use-requirements";

type BusinessTaskCreatePageContentProps = {
  businessKey: string;
};

function BusinessTaskCreatePageContent({ businessKey }: BusinessTaskCreatePageContentProps) {
  const router = useRouter();
  const { currentProjectId, loading: projectLoading } = useProject();

  const {
    loading,
    error: dataError,
    optionsError,
    taskId,
    sortOrder,
    businessArea,
    businessName,
    concepts,
    systemFunctions,
    systemDomains,
    systemRequirements,
  } = useManualAddData(businessKey);

  const {
    requirements,
    addRequirement,
    updateRequirement,
    removeRequirement,
  } = useRequirements();

	const [taskName, setTaskName] = useState("");
  const [taskSummary, setTaskSummary] = useState("");
  const [processSteps, setProcessSteps] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [conceptIdsYaml, setConceptIdsYaml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogState, setDialogState] = useState<SelectionDialogState>(null);

  const canSubmit = useMemo(
    () =>
      !!businessArea &&
      !!businessName &&
	taskName.trim().length > 0 &&
      taskSummary.trim().length > 0 &&
      !loading,
    [
      businessArea,
      businessName,
      taskName,
      taskSummary,
      loading,
    ]
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

  useEffect(() => {
    if (businessArea && businessArea !== businessKey) {
      router.replace(`/business/${businessArea}/create`);
    }
  }, [businessArea, businessKey, router]);

  function handleOpenDialog(type: SelectionDialogType, reqId: string): void {
    setDialogState({ type, reqId });
  }

  function handleCloseDialog(): void {
    setDialogState(null);
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!businessArea || !canSubmit) return;
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
      businessArea,
		name: taskName.trim(),
      summary: taskSummary.trim(),
      triggerDescription: "",
      triggerTaskIds: [],
      frequency: "daily",
      frequencyDescription: "",
      processSteps: processSteps.trim(),
      person: "",
      input: input.trim(),
      output: output.trim(),
      conceptIdsYaml: conceptIdsYaml.trim(),
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
      return {
        id: req.id,
        taskId,
        title: req.title.trim(),
        goal: req.goal.trim() || req.summary.trim(),
        constraints: req.constraints.trim(),
        owner: req.owner.trim(),
        conceptIds: req.conceptIds,
        srfIds: req.srfIds,
        systemDomainIds: req.systemDomainIds,
        impacts: [],
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

    // requirement_linksにSR↔BRリンクを追加
    const linkInputs: RequirementLinkCreateInput[] = [];
    const linkKeys = new Set<string>();
    for (const bizReq of requirements) {
      for (const sysReqId of bizReq.relatedSystemRequirementIds ?? []) {
        const key = `${sysReqId}:${bizReq.id}`;
        if (linkKeys.has(key)) continue;
        linkKeys.add(key);
        linkInputs.push({
          projectId,
          sourceType: "sr",
          sourceId: sysReqId,
          targetType: "br",
          targetId: bizReq.id,
          linkType: "derived_from",
          suspect: false,
        });
      }
    }

    if (linkInputs.length > 0) {
      const { error: linkError } = await createRequirementLinks(linkInputs);
      if (linkError) {
        setError(`要件リンクの保存に失敗しました: ${linkError}`);
        setSaving(false);
        return;
      }
    }

    router.push(`/business/${businessArea ?? businessKey}`);
  }

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-6">
          <Link
            href={`/business/${businessArea ?? businessKey}`}
            className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            業務一覧（詳細）に戻る
          </Link>

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-6">
            業務タスクを新規作成
          </h1>

          <TaskForm
            businessArea={businessArea ?? businessKey}
            taskId={taskId}
            loading={loading}
            businessName={businessName}
            taskName={taskName}
            taskSummary={taskSummary}
            processSteps={processSteps}
            input={input}
            output={output}
            conceptIdsYaml={conceptIdsYaml}
            concepts={concepts}
            error={error ?? dataError}
            optionsError={optionsError}
            canSubmit={canSubmit}
            saving={saving}
            onTaskNameChange={setTaskName}
            onTaskSummaryChange={setTaskSummary}
            onProcessStepsChange={setProcessSteps}
            onInputChange={setInput}
            onOutputChange={setOutput}
            onConceptIdsYamlChange={setConceptIdsYaml}
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

export default function BusinessTaskCreatePage({ params }: BusinessTaskCreatePageProps) {
  const { id: businessKey } = use(params);

  return (
    <>
      <MobileHeader />
      <BusinessTaskCreatePageContent businessKey={businessKey} />
    </>
  );
}
