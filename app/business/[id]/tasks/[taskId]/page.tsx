"use client";

import { use } from "react";
import Link from "next/link";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";
import { useTaskDetail } from "./use-task-detail";
import { BusinessRequirementCard } from "./business-requirement-card";
import { SystemRequirementCard } from "./system-requirement-card";
import { CardSkeleton } from "@/components/skeleton";

type PageProps = {
  params: Promise<{ id: string; taskId: string }>;
};

export default function TaskDetailPage({ params }: PageProps) {
  const { id, taskId } = use(params);
  const {
    task,
    taskLoading,
    taskError,
    businessRequirements,
    requirementsLoading,
    requirementsError,
    systemRequirements,
    systemRequirementsLoading,
    systemRequirementsError,
    optionsError,
    knowledge,
    conceptMap,
    systemFunctionMap,
    systemFunctionDomainMap,
    systemDomainMap,
  } = useTaskDetail({ bizId: id, taskId });

  const displayBizId = task?.businessId ?? knowledge.bizId;
  const displayTaskName = task?.name ?? knowledge.taskName;
  const displayTaskSummary = task?.summary ?? knowledge.taskSummary;
  const displayPerson = task?.person ?? knowledge.person;
  const displayInput = task?.input ?? knowledge.input;
  const displayOutput = task?.output ?? knowledge.output;
  const backBizId = task?.businessId ?? id;

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          <Header backBizId={backBizId} id={id} taskId={taskId} />

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-4">
            業務タスク詳細
          </h1>

          <TaskLoadingStatus loading={taskLoading} error={taskError} task={task} />

          <TaskSummaryCard
            displayBizId={displayBizId}
            taskId={taskId}
            displayTaskName={displayTaskName}
            displayTaskSummary={displayTaskSummary}
            displayPerson={displayPerson}
            displayInput={displayInput}
            displayOutput={displayOutput}
          />

          <BusinessRequirementsSection
            requirements={businessRequirements}
            loading={requirementsLoading}
            error={requirementsError}
            optionsError={optionsError}
            conceptMap={conceptMap}
            systemFunctionMap={systemFunctionMap}
            systemFunctionDomainMap={systemFunctionDomainMap}
            systemDomainMap={systemDomainMap}
          />

          <SystemRequirementsSection
            requirements={systemRequirements}
            loading={systemRequirementsLoading}
            error={systemRequirementsError}
            conceptMap={conceptMap}
            systemFunctionDomainMap={systemFunctionDomainMap}
          />
        </div>
      </div>
    </>
  );
}

type HeaderProps = {
  backBizId: string;
  id: string;
  taskId: string;
};

function Header({ backBizId, id, taskId }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <Link
        href={`/business/${backBizId}/tasks`}
        className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        業務一覧（詳細）に戻る
      </Link>
      <Link href={`/business/${id}/tasks/${taskId}/edit`}>
        <Button variant="outline" className="h-8 gap-2 text-[14px]">
          <Pencil className="h-4 w-4" />
          編集
        </Button>
      </Link>
    </div>
  );
}

type TaskLoadingStatusProps = {
  loading: boolean;
  error: string | null;
  task: unknown | null;
};

function TaskLoadingStatus({ loading, error, task }: TaskLoadingStatusProps) {
  if (loading) {
    return <p className="text-[13px] text-slate-500 mb-3">業務タスクを読み込み中...</p>;
  }
  if (error) {
    return <p className="text-[13px] text-rose-600 mb-3">{error}</p>;
  }
  if (task === null) {
    return <p className="text-[13px] text-rose-600 mb-3">業務タスクが見つかりません。</p>;
  }
  return null;
}

type TaskSummaryCardProps = {
  displayBizId: string;
  taskId: string;
  displayTaskName: string;
  displayTaskSummary: string;
  displayPerson?: string;
  displayInput?: string;
  displayOutput?: string;
};

function TaskSummaryCard({
  displayBizId,
  taskId,
  displayTaskName,
  displayTaskSummary,
  displayPerson,
  displayInput,
  displayOutput,
}: TaskSummaryCardProps) {
  return (
    <Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-3 text-[12px] text-slate-500">
          <span className="font-mono">{displayBizId}</span>
          <span className="text-slate-300">/</span>
          <span className="font-mono">{taskId}</span>
        </div>

        <h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
          {displayTaskName}
        </h2>

        <p className="text-[14px] text-slate-700 leading-relaxed">
          {displayTaskSummary}
        </p>

        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-slate-100 text-[13px]">
          <div>
            <span className="text-slate-500">担当者</span>
            <span className="ml-2 text-slate-900">{displayPerson ?? "—"}</span>
          </div>
          <div>
            <span className="text-slate-500">インプット</span>
            <span className="ml-2 text-slate-900">{displayInput ?? "—"}</span>
          </div>
          <div>
            <span className="text-slate-500">アウトプット</span>
            <span className="ml-2 text-slate-900">{displayOutput ?? "—"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type BusinessRequirementsSectionProps = {
  requirements: import("@/lib/data/business-requirements").BusinessRequirement[];
  loading: boolean;
  error: string | null;
  optionsError: string | null;
  conceptMap: Map<string, string>;
  systemFunctionMap: Map<string, string>;
  systemFunctionDomainMap: Map<string, string | null>;
  systemDomainMap: Map<string, string>;
};

function BusinessRequirementsSection({
  requirements,
  loading,
  error,
  optionsError,
  conceptMap,
  systemFunctionMap,
  systemFunctionDomainMap,
  systemDomainMap,
}: BusinessRequirementsSectionProps) {
  return (
		<Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <h3 className="text-[20px] font-semibold text-slate-900">業務要件</h3>
          <Badge variant="outline" className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0">
            {requirements.length}
          </Badge>
        </div>

        {loading && <CardSkeleton />}
        {error && <div className="text-[14px] text-rose-600">{error}</div>}
        {!loading && !error && requirements.length === 0 && (
          <div className="text-[14px] text-slate-500">まだ登録されていません。</div>
        )}
        {!loading && !error && requirements.map((req) => (
          <BusinessRequirementCard
            key={req.id}
            requirement={req}
            conceptMap={conceptMap}
            systemFunctionMap={systemFunctionMap}
            systemFunctionDomainMap={systemFunctionDomainMap}
            systemDomainMap={systemDomainMap}
            optionsError={optionsError}
          />
        ))}
      </CardContent>
    </Card>
  );
}

type SystemRequirementsSectionProps = {
	requirements: import("@/lib/data/system-requirements").SystemRequirement[];
	loading: boolean;
	error: string | null;
	conceptMap: Map<string, string>;
	systemFunctionDomainMap: Map<string, string | null>;
};

function SystemRequirementsSection({
	requirements,
	loading,
	error,
	conceptMap,
	systemFunctionDomainMap,
}: SystemRequirementsSectionProps) {
	return (
		<Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
			<CardContent className="p-3 space-y-2">
				<div className="flex items-center gap-2 pb-2 border-b border-slate-100">
					<h3 className="text-[20px] font-semibold text-slate-900">関連システム要件</h3>
					<Badge variant="outline" className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0">
						{requirements.length}
					</Badge>
				</div>

				{loading && <CardSkeleton />}
				{error && <div className="text-[14px] text-rose-600">{error}</div>}
				{!loading && !error && requirements.length === 0 && (
					<div className="text-[14px] text-slate-500">まだ登録されていません。</div>
				)}
				{!loading && !error && requirements.map((sysReq) => (
					<SystemRequirementCard
						key={sysReq.id}
						requirement={sysReq}
						conceptMap={conceptMap}
						systemFunctionDomainMap={systemFunctionDomainMap}
					/>
				))}
			</CardContent>
		</Card>
	);
}
