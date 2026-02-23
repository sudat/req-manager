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
	parseYamlProcessSteps,
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
	const parsed = parseYamlProcessSteps(value);
	const steps = parsed.value.filter(
		(step) => step.when || step.who || step.action,
	);

	return (
		<div className="space-y-2">
			<p className="text-[14px] font-bold text-slate-900">{label}</p>
			{steps.length === 0 ? (
				<p className="text-[14px] text-slate-400">—</p>
			) : (
				<div className="rounded-md border border-slate-200 overflow-hidden inline-block">
					<Table className="w-auto">
						<TableHeader>
							<TableRow className="bg-slate-50 hover:bg-slate-50">
								<TableHead className="w-[40px] text-center text-[11px] font-semibold text-slate-600 py-2">
									#
								</TableHead>
								<TableHead className="w-[160px] text-[11px] font-semibold text-slate-600 py-2">
									タイミング
								</TableHead>
								<TableHead className="w-[160px] text-[11px] font-semibold text-slate-600 py-2">
									担当者
								</TableHead>
								<TableHead className="min-w-[400px] text-[11px] font-semibold text-slate-600 py-2">
									アクション
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{steps.map((step, index) => (
								<TableRow key={`${label}-${index}`} className="text-[13px]">
									<TableCell className="w-[40px] text-center text-slate-500 font-medium py-2">
										{index + 1}
									</TableCell>
									<TableCell className="w-[160px] text-slate-700 py-2">
										{step.when || "—"}
									</TableCell>
									<TableCell className="w-[160px] text-slate-700 py-2">
										{step.who || "—"}
									</TableCell>
									<TableCell className="min-w-[400px] text-slate-600 py-2">
										{step.action || "—"}
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
