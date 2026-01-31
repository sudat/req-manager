import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

type TaskSummaryCardProps = {
	displayBizId: string;
	taskId: string;
	displayTaskName: string;
	displayTaskSummary: string;
	displayBusinessContext: string;
	displayProcessSteps: string;
	displayInput?: string;
	displayOutput?: string;
	displayConceptIds: string;
	conceptMap: Map<string, string>;
};

export function TaskSummaryCard({
	displayBizId,
	taskId,
	displayTaskName,
	displayTaskSummary,
	displayBusinessContext,
	displayProcessSteps,
	displayInput,
	displayOutput,
	displayConceptIds,
	conceptMap,
}: TaskSummaryCardProps) {
	return (
		<Card className="rounded-md border border-slate-200/60 bg-white shadow-sm hover:border-slate-300/60 transition-colors">
			<CardContent className="p-6 space-y-3">
				<div className="flex items-center gap-2">
					<span className="id-label--brand">{displayBizId}</span>
					<span className="text-slate-300">/</span>
					<span className="id-label--brand">{taskId}</span>
				</div>

				<h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
					{displayTaskName}
				</h2>

				<MarkdownRenderer content={displayTaskSummary} />

				<div className="pt-3 border-t border-slate-100 space-y-4">
					<MarkdownBlock label="業務コンテキスト" value={displayBusinessContext} />
					<ProcessStepsBlock label="業務プロセス" value={displayProcessSteps} />
					<KeySourceListBlock label="インプット" value={displayInput ?? ""} />
					<KeySourceListBlock label="アウトプット" value={displayOutput ?? ""} />
					<ConceptIdsBlock
						label="concept_ids"
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
		(step) => step.when || step.who || step.action
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
								<TableHead className="w-[40px] text-center text-[11px] font-semibold text-slate-600 py-2">#</TableHead>
								<TableHead className="w-[160px] text-[11px] font-semibold text-slate-600 py-2">タイミング</TableHead>
								<TableHead className="w-[160px] text-[11px] font-semibold text-slate-600 py-2">担当者</TableHead>
								<TableHead className="min-w-[400px] text-[11px] font-semibold text-slate-600 py-2">アクション</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{steps.map((step, index) => (
								<TableRow key={`${label}-${index}`} className="text-[13px]">
									<TableCell className="w-[40px] text-center text-slate-500 font-medium py-2">{index + 1}</TableCell>
									<TableCell className="w-[160px] text-slate-700 py-2">{step.when || "—"}</TableCell>
									<TableCell className="w-[160px] text-slate-700 py-2">{step.who || "—"}</TableCell>
									<TableCell className="min-w-[400px] text-slate-600 py-2">{step.action || "—"}</TableCell>
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
								<TableHead className="w-[40px] text-center text-[11px] font-semibold text-slate-600 py-2">#</TableHead>
								<TableHead className="min-w-[320px] text-[11px] font-semibold text-slate-600 py-2">名称</TableHead>
								<TableHead className="min-w-[320px] text-[11px] font-semibold text-slate-600 py-2">ソース</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item, index) => (
								<TableRow key={`${label}-${index}`} className="text-[13px]">
									<TableCell className="w-[40px] text-center text-slate-500 font-medium py-2">{index + 1}</TableCell>
									<TableCell className="min-w-[320px] text-slate-700 py-2">{item.name || "（名称なし）"}</TableCell>
									<TableCell className="min-w-[320px] text-slate-600 py-2">{item.source || "—"}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
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
			<div className="flex flex-wrap gap-2">
				{ids.length === 0 && <span className="text-[14px] text-slate-400">—</span>}
				{ids.map((id) => (
					<Badge key={id} variant="secondary" className="gap-1 text-[11px]">
						<span className="font-mono">{id}</span>
						{conceptMap.get(id) && <span className="text-slate-600">{conceptMap.get(id)}</span>}
					</Badge>
				))}
			</div>
		</div>
	);
}
