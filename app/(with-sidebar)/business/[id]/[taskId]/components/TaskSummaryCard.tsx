import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConceptBadgeList } from "@/components/ui/concept-badge";
import { IdNameBadge } from "@/components/ui/id-name-badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	parseYamlIdList,
	parseYamlKeySourceList,
	parseYamlProcessFlow,
	type ProcessFlowExit,
	type ProcessStepItem,
} from "@/lib/utils/yaml";
import Link from "next/link";
import { Pencil } from "lucide-react";

type TaskSummaryCardProps = {
	displayBizId: string;
	taskId: string;
	displayTaskName: string;
	displayTaskSummary: string;
	displayTriggerDescription: string;
	displayTriggerTaskIds: string[];
	displayFrequency:
		| "daily"
		| "weekly"
		| "monthly"
		| "quarterly"
		| "yearly"
		| "irregular";
	displayFrequencyDescription: string;
	displayProcessSteps: string;
	displayInput?: string;
	displayOutput?: string;
	displayConceptIds: string;
	conceptMap: Map<string, string>;
	taskMap: Map<string, string>;
	routeArea: string;
};

export function TaskSummaryCard({
	displayBizId,
	taskId,
	displayTaskName,
	displayTaskSummary,
	displayTriggerDescription,
	displayTriggerTaskIds,
	displayFrequency,
	displayFrequencyDescription,
	displayProcessSteps,
	displayInput,
	displayOutput,
	displayConceptIds,
	conceptMap,
	taskMap,
	routeArea,
}: TaskSummaryCardProps) {
	return (
		<Card className="rounded-md border border-slate-200/60 bg-white shadow-sm hover:border-slate-300/60 transition-colors">
			<CardContent className="p-6 space-y-3">
			<div className="flex items-center justify-between">
				<div className="id-label--brand">
					<span>{displayBizId}</span>
					<span className="text-slate-300 mx-1">/</span>
					<span>{taskId}</span>
				</div>
					<Link href={`/business/${routeArea}/${taskId}/edit/basic`}>
						<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[12px]">
							<Pencil className="h-3.5 w-3.5" />
							編集
						</Button>
					</Link>
				</div>

				<h2 className="text-[20px] font-semibold text-slate-900 leading-tight border-b border-slate-200 pb-2">
					{displayTaskName}
				</h2>

				<MarkdownRenderer content={displayTaskSummary} />

				<div className="pt-3 border-t border-slate-100 space-y-4">
					<TriggerBlock
						label="業務開始トリガー"
						description={displayTriggerDescription}
						taskIds={displayTriggerTaskIds}
						taskMap={taskMap}
					/>
					<FrequencyBlock
						label="業務頻度"
						frequency={displayFrequency}
						description={displayFrequencyDescription}
					/>
					<ProcessStepsBlock label="業務プロセス" value={displayProcessSteps} />
					<KeySourceListBlock label="インプット" value={displayInput ?? ""} />
					<KeySourceListBlock
						label="アウトプット"
						value={displayOutput ?? ""}
					/>
					<ConceptIdsBlock
						label="概念"
						value={displayConceptIds}
						conceptMap={conceptMap}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

type TextBlockProps = {
	label: string;
	value: string;
};

function MarkdownBlock({ label, value }: TextBlockProps) {
	return (
		<div className="space-y-2">
			<p className="text-[14px] font-bold text-slate-900">{label}</p>
			{value.trim().length > 0 ? (
				<MarkdownRenderer content={value} />
			) : (
				<p className="text-[14px] text-slate-400">—</p>
			)}
		</div>
	);
}

type ProcessStepsBlockProps = {
	label: string;
	value: string;
};

function ProcessStepsBlock({ label, value }: ProcessStepsBlockProps) {
	const parsed = parseYamlProcessFlow(value);
	const blocks = parsed.value.blocks.filter((block) => {
		if (block.type === "step") {
			return hasProcessStepContent(block.step);
		}
		return block.branches.some(
			(branch) =>
				branch.label.trim().length > 0 ||
				branch.steps.some((step) => hasProcessStepContent(step))
		) || block.else?.steps.some((step) => hasProcessStepContent(step)) || Boolean(block.else?.exit) || Boolean(block.defaultExit);
	});

	return (
		<div className="space-y-2">
			<p className="text-[14px] font-bold text-slate-900">{label}</p>
			{blocks.length === 0 ? (
				<p className="text-[14px] text-slate-400">—</p>
			) : (
				<div className="space-y-3">
					{blocks.map((block, blockIndex) => (
						<div
							key={`process-block-${blockIndex}`}
							className="rounded-md border border-slate-200 bg-white p-3 space-y-2"
						>
							<div className="flex items-center gap-2">
								<Badge
									variant={block.type === "branch" ? "default" : "outline"}
									className="text-[11px]"
								>
									{block.type === "branch" ? "分岐" : "工程"}
								</Badge>
								<span className="text-[12px] text-slate-500">
									{blockIndex + 1}
								</span>
								{block.type === "branch" && (
									<span className="text-[12px] text-slate-700 font-medium">
										{block.decisionLabel?.trim() || "条件分岐"}
									</span>
								)}
							</div>

							{block.type === "step" ? (
								<ProcessStepsTable
									steps={[block.step]}
									rowKeyPrefix={`step-${blockIndex}`}
								/>
							) : (
								<div className="space-y-3">
									{block.branches.map((branch, branchIndex) => (
										<div
											key={`process-branch-${blockIndex}-${branchIndex}`}
											className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2"
										>
											<div className="flex items-center justify-between gap-2">
												<p className="text-[12px] font-medium text-slate-700">
													条件: {branch.label.trim() || `条件${branchIndex + 1}`}
												</p>
												<Badge variant="secondary" className="text-[11px]">
													出口: {formatProcessFlowExit(branch.exit)}
												</Badge>
											</div>
											{branch.steps.some((step) => hasProcessStepContent(step)) ? (
												<ProcessStepsTable
													steps={branch.steps}
													rowKeyPrefix={`branch-${blockIndex}-${branchIndex}`}
												/>
											) : (
												<p className="text-[12px] text-slate-500">
													ステップ未設定
												</p>
											)}
										</div>
									))}
									<div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
										<div className="flex items-center justify-between gap-2">
											<p className="text-[12px] font-medium text-slate-700">
												それ以外
											</p>
											<Badge variant="secondary" className="text-[11px]">
												出口: {formatProcessFlowExit(block.else?.exit ?? block.defaultExit)}
											</Badge>
										</div>
										{(block.else?.steps ?? []).some((step) => hasProcessStepContent(step)) ? (
											<ProcessStepsTable
												steps={block.else?.steps ?? []}
												rowKeyPrefix={`else-${blockIndex}`}
											/>
										) : (
											<p className="text-[12px] text-slate-500">ステップ未設定</p>
										)}
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}
			{parsed.error && (
				<p className="text-[12px] text-rose-600">
					業務プロセスのYAML構文にエラーがあります。
				</p>
			)}
		</div>
	);
}

type ProcessStepsTableProps = {
	steps: ProcessStepItem[];
	rowKeyPrefix: string;
	hideHeader?: boolean;
};

function ProcessStepsTable({
	steps,
	rowKeyPrefix,
	hideHeader = false,
}: ProcessStepsTableProps) {
	return (
		<div className="rounded-md border border-slate-200 overflow-hidden inline-block">
			<Table className="w-auto">
				{!hideHeader && (
					<TableHeader>
						<TableRow className="bg-slate-50 hover:bg-slate-50">
							<TableHead className="w-[40px] text-center text-[11px] font-semibold text-slate-600 py-2">
								#
							</TableHead>
							<TableHead className="w-[92px] text-[11px] font-semibold text-slate-600 py-2">
								step
							</TableHead>
							<TableHead className="w-[160px] text-[11px] font-semibold text-slate-600 py-2">
								タイミング
							</TableHead>
							<TableHead className="w-[160px] text-[11px] font-semibold text-slate-600 py-2">
								担当者
							</TableHead>
							<TableHead className="min-w-[320px] text-[11px] font-semibold text-slate-600 py-2">
								アクション
							</TableHead>
						</TableRow>
					</TableHeader>
				)}
				<TableBody>
					{steps
						.filter((step) => hasProcessStepContent(step))
						.map((step, index) => (
							<TableRow key={`${rowKeyPrefix}-${index}`} className="text-[13px]">
								<TableCell className="w-[40px] text-center text-slate-500 font-medium py-2">
									{index + 1}
								</TableCell>
								<TableCell className="w-[92px] text-slate-600 py-2 font-mono text-[11px]">
									{step.id?.trim() || "—"}
								</TableCell>
								<TableCell className="w-[160px] text-slate-700 py-2">
									{step.when || "—"}
								</TableCell>
								<TableCell className="w-[160px] text-slate-700 py-2">
									{step.who || "—"}
								</TableCell>
								<TableCell className="min-w-[320px] text-slate-600 py-2">
									{step.action || "—"}
								</TableCell>
							</TableRow>
						))}
				</TableBody>
			</Table>
		</div>
	);
}

function hasProcessStepContent(step: ProcessStepItem): boolean {
	return Boolean(
		step.id?.trim() ||
			step.when.trim() ||
			step.who.trim() ||
			step.action.trim() ||
			step.exception?.condition?.trim() ||
			step.exception?.to?.trim()
	);
}

function formatProcessFlowExit(exit: ProcessFlowExit | undefined): string {
	const resolvedType = exit?.type ?? "next";
	if (resolvedType === "next") return "次の工程に合流";
	if (resolvedType === "end") return "業務を終了";
	const target = exit?.to?.trim() ?? "";
	return target ? `指定ステップへ遷移 (${target})` : "指定ステップへ遷移";
}

function KeySourceListBlock({ label, value }: TextBlockProps) {
	const parsed = parseYamlKeySourceList(value);
	const items = parsed.value.filter((item) => item.name || item.source);

	return (
		<div className="space-y-2">
			<p className="text-[14px] font-bold text-slate-900">{label}</p>
			{items.length === 0 ? (
				<p className="text-[14px] text-slate-400">—</p>
			) : (
				<div className="rounded-md border border-slate-200 overflow-hidden inline-block">
					<Table className="w-auto">
						<TableHeader>
							<TableRow className="bg-slate-50 hover:bg-slate-50">
								<TableHead className="w-[40px] text-center text-[11px] font-semibold text-slate-600 py-2">
									#
								</TableHead>
								<TableHead className="min-w-[320px] text-[11px] font-semibold text-slate-600 py-2">
									名称
								</TableHead>
								<TableHead className="min-w-[320px] text-[11px] font-semibold text-slate-600 py-2">
									ソース
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item, index) => (
								<TableRow key={`${label}-${index}`} className="text-[13px]">
									<TableCell className="w-[40px] text-center text-slate-500 font-medium py-2">
										{index + 1}
									</TableCell>
									<TableCell className="min-w-[320px] text-slate-700 py-2">
										{item.name || "（名称なし）"}
									</TableCell>
									<TableCell className="min-w-[320px] text-slate-600 py-2">
										{item.source || "—"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}

type TriggerBlockProps = {
	label: string;
	description: string;
	taskIds: string[];
	taskMap: Map<string, string>;
};

function TriggerBlock({
	label,
	description,
	taskIds,
	taskMap,
}: TriggerBlockProps) {
	const hasDescription = description.trim().length > 0;
	const hasTasks = taskIds.length > 0;

	if (!hasDescription && !hasTasks) {
		return (
			<div className="space-y-2">
				<p className="text-[14px] font-bold text-slate-900">{label}</p>
				<p className="text-[14px] text-slate-400">—</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<p className="text-[14px] font-bold text-slate-900">{label}</p>
			<p className="text-[14px] text-slate-700">
				{hasTasks &&
					taskIds.map((taskId) => (
						<IdNameBadge
							key={taskId}
							id={taskId}
							name={taskMap.get(taskId)}
							className="mr-2"
						/>
					))}
				{hasDescription && (
					<span className="text-slate-600">{description}</span>
				)}
			</p>
		</div>
	);
}

type ConceptIdsBlockProps = {
	label: string;
	value: string;
	conceptMap: Map<string, string>;
};

function ConceptIdsBlock({ label, value, conceptMap }: ConceptIdsBlockProps) {
	const parsed = parseYamlIdList(value);
	const ids = parsed.value;

	return (
		<div className="space-y-1">
			<p className="text-[14px] font-bold text-slate-900">{label}</p>
			<ConceptBadgeList ids={ids} conceptMap={conceptMap} />
		</div>
	);
}

type FrequencyBlockProps = {
	label: string;
	frequency:
		| "daily"
		| "weekly"
		| "monthly"
		| "quarterly"
		| "yearly"
		| "irregular";
	description: string;
};

const frequencyLabels: Record<FrequencyBlockProps["frequency"], string> = {
	daily: "日次",
	weekly: "週次",
	monthly: "月次",
	quarterly: "四半期",
	yearly: "年次",
	irregular: "不定期",
};

function FrequencyBlock({
	label,
	frequency,
	description,
}: FrequencyBlockProps) {
	const frequencyLabel = frequencyLabels[frequency];
	const hasDescription = description.trim().length > 0;

	if (!hasDescription && frequency === "irregular") {
		return (
			<div className="space-y-2">
				<p className="text-[14px] font-bold text-slate-900">{label}</p>
				<p className="text-[14px] text-slate-400">—</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<p className="text-[14px] font-bold text-slate-900">{label}</p>
			<p className="text-[14px] text-slate-700">
				<Badge
					variant="secondary"
					className="text-[12px] px-2 py-1 bg-slate-100 mr-2"
				>
					{frequencyLabel}
				</Badge>
				{hasDescription && (
					<span className="text-slate-600">{description}</span>
				)}
			</p>
		</div>
	);
}
