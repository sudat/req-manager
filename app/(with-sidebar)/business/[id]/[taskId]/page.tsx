"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { use, useMemo } from "react";
import { HealthScoreCard } from "@/components/health-score/health-score-card";
import { MobileHeader } from "@/components/layout/mobile-header";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { buildHealthScoreSummary } from "@/lib/health-score";
import { TaskLoadingStatus } from "./components/TaskLoadingStatus";
import { TaskSummaryCard } from "./components/TaskSummaryCard";
import { BusinessRequirementsSection } from "./components/BusinessRequirementsSection";
import { useTaskDetail } from "./use-task-detail";

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
		optionsLoading,
		knowledge,
		concepts,
		conceptMap,
		systemFunctionMap,
		systemFunctionDomainMap,
		systemDomainMap,
		systemFunctions,
		systemFunctionsFull,
	} = useTaskDetail({ bizId: id, taskId });

	const displayBizId = task?.businessId ?? knowledge.bizId;
	const displayTaskName = task?.name ?? knowledge.taskName;
	const displayTaskSummary = task?.summary ?? knowledge.taskSummary;
	const displayBusinessContext = task?.businessContext ?? knowledge.businessContext;
	const displayProcessSteps = task?.processSteps ?? knowledge.processSteps;
	const displayInput = task?.input ?? knowledge.input;
	const displayOutput = task?.output ?? knowledge.output;
	const displayConceptIds = task?.conceptIdsYaml ?? knowledge.conceptIdsYaml;
	const businessRequirementMap = useMemo(
		() =>
			new Map(businessRequirements.map((req) => [req.id, req.title || req.id])),
		[businessRequirements],
	);

	const systemRequirementsByBizReq = useMemo(() => {
		const map = new Map<string, typeof systemRequirements>();
		systemRequirements.forEach(sr => {
			sr.businessRequirementIds.forEach(bizReqId => {
				const list = map.get(bizReqId) || [];
				list.push(sr);
				map.set(bizReqId, list);
			});
		});
		return map;
	}, [systemRequirements]);

	const relatedSystemFunctions = useMemo(() => {
		if (systemRequirements.length === 0) return [];
		const srfIds = new Set(
			systemRequirements
				.map((req) => req.srfId)
				.filter((id): id is string => Boolean(id)),
		);
		return systemFunctionsFull.filter((srf) => srfIds.has(srf.id));
	}, [systemRequirements, systemFunctionsFull]);

	const healthLoading =
		requirementsLoading || systemRequirementsLoading || optionsLoading;
	const healthError =
		requirementsError || systemRequirementsError || optionsError;

	const healthSummary = useMemo(() => {
		if (healthLoading || healthError) return null;
		return buildHealthScoreSummary({
			businessRequirements,
			systemRequirements,
			systemFunctions: relatedSystemFunctions,
			concepts,
		});
	}, [
		businessRequirements,
		systemRequirements,
		relatedSystemFunctions,
		concepts,
		healthLoading,
		healthError,
	]);

	return (
		<>
			<MobileHeader />
			<div className="flex-1 min-h-screen bg-slate-50">
				<div className="mx-auto max-w-[1400px] px-8 py-4">
					{/* パンくずリスト */}
					<Breadcrumb className="mb-4">
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link href="/business">業務領域一覧</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link href={`/business/${id}`}>業務一覧（詳細）</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>業務タスク詳細</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>

					{/* タイトルと編集ボタン */}
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
							業務タスク詳細
						</h1>
						<Link href={`/business/${id}/${taskId}/edit`}>
							<Button variant="outline" className="h-8 gap-2 text-[14px]">
								<Pencil className="h-4 w-4" />
								編集
							</Button>
						</Link>
					</div>

					<TaskLoadingStatus
						loading={taskLoading}
						error={taskError}
						task={task}
					/>

					<TaskSummaryCard
						displayBizId={displayBizId}
						taskId={taskId}
						displayTaskName={displayTaskName}
						displayTaskSummary={displayTaskSummary}
						displayBusinessContext={displayBusinessContext}
						displayProcessSteps={displayProcessSteps}
						displayInput={displayInput}
						displayOutput={displayOutput}
						displayConceptIds={displayConceptIds}
						conceptMap={conceptMap}
					/>

					<div className="mt-4">
						<HealthScoreCard
							title="業務タスクヘルススコア"
							summary={healthSummary}
							loading={healthLoading}
							error={healthError}
							maxIssues={6}
							showStats
						/>
					</div>

				<BusinessRequirementsSection
					requirements={businessRequirements}
					loading={requirementsLoading}
					error={requirementsError}
					optionsError={optionsError}
					conceptMap={conceptMap}
					systemFunctionMap={systemFunctionMap}
					systemFunctionDomainMap={systemFunctionDomainMap}
					systemDomainMap={systemDomainMap}
					systemRequirementsByBizReq={systemRequirementsByBizReq}
				/>
				</div>
			</div>
		</>
	);
}
