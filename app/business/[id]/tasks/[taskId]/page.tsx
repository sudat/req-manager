"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { use, useMemo } from "react";
import { HealthScoreCard } from "@/components/health-score/health-score-card";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { CardSkeleton } from "@/components/skeleton";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildHealthScoreSummary } from "@/lib/health-score";
import { BusinessRequirementCard } from "./business-requirement-card";
import { SystemRequirementCard } from "./system-requirement-card";
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
	const displayPerson = task?.person ?? knowledge.person;
	const displayInput = task?.input ?? knowledge.input;
	const displayOutput = task?.output ?? knowledge.output;
	const businessRequirementMap = useMemo(
		() =>
			new Map(businessRequirements.map((req) => [req.id, req.title || req.id])),
		[businessRequirements],
	);

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
			<div className="flex-1 min-h-screen bg-white">
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
									<Link href={`/business/${id}/tasks`}>業務一覧（詳細）</Link>
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
						<Link href={`/business/${id}/tasks/${taskId}/edit`}>
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
						displayPerson={displayPerson}
						displayInput={displayInput}
						displayOutput={displayOutput}
					/>

					<div className="mt-4">
						<HealthScoreCard
							title="タスクヘルススコア"
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
					/>

					<SystemRequirementsSection
						requirements={systemRequirements}
						loading={systemRequirementsLoading}
						error={systemRequirementsError}
						conceptMap={conceptMap}
						systemFunctions={systemFunctions}
						systemFunctionDomainMap={systemFunctionDomainMap}
						businessRequirementMap={businessRequirementMap}
					/>
				</div>
			</div>
		</>
	);
}

type TaskLoadingStatusProps = {
	loading: boolean;
	error: string | null;
	task: unknown | null;
};

function TaskLoadingStatus({ loading, error, task }: TaskLoadingStatusProps) {
	if (loading) {
		return null;
	}
	if (error) {
		return <p className="text-[13px] text-rose-600 mb-3">{error}</p>;
	}
	if (task === null) {
		return (
			<p className="text-[13px] text-rose-600 mb-3">
				業務タスクが見つかりません。
			</p>
		);
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
			<CardContent className="p-5 space-y-2">
				<div className="flex items-center gap-3 text-[12px] text-slate-500">
					<span className="font-mono">{displayBizId}</span>
					<span className="text-slate-300">/</span>
					<span className="font-mono">{taskId}</span>
				</div>

				<h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
					{displayTaskName}
				</h2>

				<MarkdownRenderer content={displayTaskSummary} />

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

type RequirementsSectionProps<T> = {
	title: string;
	items: T[];
	loading: boolean;
	error: string | null;
	emptyMessage?: string;
	renderItem: (item: T) => React.ReactNode;
};

function RequirementsSection<T extends { id: string }>({
	title,
	items,
	loading,
	error,
	emptyMessage = "まだ登録されていません。",
	renderItem,
}: RequirementsSectionProps<T>) {
	return (
		<Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
			<CardContent className="p-3 space-y-2">
				<div className="flex items-center gap-2 pb-2 border-b border-slate-100">
					<h3 className="text-[20px] font-semibold text-slate-900">{title}</h3>
					<Badge
						variant="outline"
						className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0"
					>
						{items.length}
					</Badge>
				</div>

				{loading && <CardSkeleton />}
				{error && <div className="text-[14px] text-rose-600">{error}</div>}
				{!loading && !error && items.length === 0 && (
					<div className="text-[14px] text-slate-500">{emptyMessage}</div>
				)}
				{!loading && !error && items.map(renderItem)}
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

function BusinessRequirementsSection(props: BusinessRequirementsSectionProps) {
	return (
		<RequirementsSection
			title="業務要件"
			items={props.requirements}
			loading={props.loading}
			error={props.error}
			renderItem={(req) => (
				<BusinessRequirementCard
					key={req.id}
					requirement={req}
					conceptMap={props.conceptMap}
					systemFunctionMap={props.systemFunctionMap}
					systemFunctionDomainMap={props.systemFunctionDomainMap}
					systemDomainMap={props.systemDomainMap}
					optionsError={props.optionsError}
				/>
			)}
		/>
	);
}

type SystemRequirementsSectionProps = {
	requirements: import("@/lib/data/system-requirements").SystemRequirement[];
	loading: boolean;
	error: string | null;
	conceptMap: Map<string, string>;
	systemFunctions: {
		id: string;
		name: string;
		systemDomainId: string | null;
	}[];
	systemFunctionDomainMap: Map<string, string | null>;
	businessRequirementMap: Map<string, string>;
};

function SystemRequirementsSection(props: SystemRequirementsSectionProps) {
	return (
		<RequirementsSection
			title="関連システム要件"
			items={props.requirements}
			loading={props.loading}
			error={props.error}
			renderItem={(sysReq) => (
				<SystemRequirementCard
					key={sysReq.id}
					requirement={sysReq}
					conceptMap={props.conceptMap}
					systemFunctions={props.systemFunctions}
					systemFunctionDomainMap={props.systemFunctionDomainMap}
					businessRequirementMap={props.businessRequirementMap}
				/>
			)}
		/>
	);
}
