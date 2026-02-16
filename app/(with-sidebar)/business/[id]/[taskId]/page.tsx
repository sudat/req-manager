"use client";

import { Pencil, Sparkles } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { buildBusinessRequirementsForHealth } from "@/lib/health-score/utils";
import { TaskLoadingStatus, TaskNotFound } from "./components/TaskLoadingStatus";
import { TaskSummaryCard } from "./components/TaskSummaryCard";
import { BusinessRequirementsSection } from "./components/BusinessRequirementsSection";
import { useTaskDetail } from "./use-task-detail";
import { useBusinessByKey } from "@/hooks/use-business-by-key";

type PageProps = {
	params: Promise<{ id: string; taskId: string }>;
};

export default function TaskDetailPage({ params }: PageProps) {
	const { id: businessKey, taskId } = use(params);
	const router = useRouter();
	const { businessArea } = useBusinessByKey(businessKey);
	const routeArea = businessArea ?? businessKey;
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
		taskMap,
		systemFunctions,
		systemFunctionsFull,
	} = useTaskDetail({ bizId: businessKey, taskId });

	const displayBizId = routeArea ?? task?.businessArea ?? knowledge.bizId;
	const displayTaskName = task?.name ?? knowledge.taskName;
	const displayTaskSummary = task?.summary ?? knowledge.taskSummary;
	const displayTriggerDescription = task?.triggerDescription ?? knowledge.triggerDescription ?? "";
	const displayTriggerTaskIds = task?.triggerTaskIds ?? knowledge.triggerTaskIds ?? [];
	const displayFrequency = task?.frequency ?? knowledge.frequency ?? 'daily';
	const displayFrequencyDescription = task?.frequencyDescription ?? knowledge.frequencyDescription ?? "";
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
		return systemFunctionsFull.filter((srf) =>
			srf.relatedTaskIds.includes(taskId)
		);
	}, [systemFunctionsFull, taskId]);

	const healthLoading =
		requirementsLoading || systemRequirementsLoading || optionsLoading;
	const healthError =
		requirementsError || systemRequirementsError || optionsError;

	const healthSummary = useMemo(() => {
		if (healthLoading || healthError) return null;
		const businessRequirementsForHealth = buildBusinessRequirementsForHealth(
			businessRequirements,
			relatedSystemFunctions
		);
		return buildHealthScoreSummary({
			businessRequirements: businessRequirementsForHealth,
			systemRequirements,
			systemFunctions: relatedSystemFunctions,
			concepts,
			pageType: 'business',
		});
	}, [
		businessRequirements,
		systemRequirements,
		relatedSystemFunctions,
		concepts,
		healthLoading,
		healthError,
	]);

	useEffect(() => {
		if (businessArea && businessArea !== businessKey) {
			router.replace(`/business/${businessArea}/${taskId}`);
		}
	}, [businessArea, businessKey, taskId, router]);

	return (
		<>
			<MobileHeader />
			<div className="min-h-screen bg-slate-50">
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
									<Link href={`/business/${routeArea}`}>業務一覧（詳細）</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage className="font-semibold text-slate-900">業務タスク詳細</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>

					{/* タイトルと編集ボタン */}
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
							業務タスク詳細
						</h1>
						<div className="flex gap-2">
							<Link href={routeArea ? `/chat?screen=BT&bdId=${routeArea}&btId=${taskId}` : "/chat"}>
								<Button className="h-8 gap-2 text-[14px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
									<Sparkles className="h-4 w-4" />
									AIで追加
								</Button>
							</Link>
							<Link href={`/business/${routeArea}/${taskId}/edit/basic`}>
								<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[12px] hover:bg-slate-100 transition-colors">
									<Pencil className="h-3.5 w-3.5" />
									編集
								</Button>
							</Link>
						</div>
					</div>

					<TaskLoadingStatus
						loading={taskLoading}
						error={taskError}
						task={task}
					/>

					{!taskLoading && task === null && !taskError && (
						<TaskNotFound taskId={taskId} businessKey={businessKey} />
					)}

					{task !== null && (
						<>
						<TaskSummaryCard
							displayBizId={displayBizId}
							taskId={taskId}
							displayTaskName={displayTaskName}
							displayTaskSummary={displayTaskSummary}
							displayTriggerDescription={displayTriggerDescription}
							displayTriggerTaskIds={displayTriggerTaskIds}
							displayFrequency={displayFrequency}
							displayFrequencyDescription={displayFrequencyDescription}
							displayProcessSteps={displayProcessSteps}
							displayInput={displayInput}
							displayOutput={displayOutput}
							displayConceptIds={displayConceptIds}
							conceptMap={conceptMap}
							taskMap={taskMap}
						/>

							<div className="mt-6 space-y-6">
								<div>
									<HealthScoreCard
										title="業務タスクヘルススコア"
										summary={healthSummary}
										loading={healthLoading}
										error={healthError}
										maxIssues={6}
										showStats
										pageType="business"
									/>
								</div>

								<section className="space-y-4">
									<div className="flex items-center justify-between border-l-4 border-brand-600 pl-3">
										<h2 className="text-[18px] font-semibold text-slate-900">
											業務要件
										</h2>
								<Link href={`/business/${routeArea}/${taskId}/edit/requirements`}>
									<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[12px] hover:bg-slate-100 transition-colors">
										<Pencil className="h-3.5 w-3.5" />
										編集
									</Button>
								</Link>
									</div>
									<BusinessRequirementsSection
										requirements={businessRequirements}
										loading={requirementsLoading}
										error={requirementsError}
										optionsError={optionsError}
										conceptMap={conceptMap}
										systemFunctionMap={systemFunctionMap}
										systemFunctionDomainMap={systemFunctionDomainMap}
										systemRequirementsByBizReq={systemRequirementsByBizReq}
									/>
								</section>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
}
