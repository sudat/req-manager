"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KeySourceListField } from "@/components/forms/key-source-list-field";
import { ConceptIdsField } from "@/components/forms/concept-ids-field";
import { ProcessStepsField } from "@/components/forms/process-steps-field";
import { MarkdownGuide } from "./MarkdownGuide";
import type { TaskKnowledge } from "@/lib/domain";
import type { SelectableItem } from "@/lib/domain/forms";

type TaskBasicInfoCardProps = {
	knowledge: TaskKnowledge;
	onFieldChange: <K extends keyof TaskKnowledge>(key: K, value: TaskKnowledge[K]) => void;
	concepts: SelectableItem[];
};

/**
 * タスク基本情報カードコンポーネント
 */
export function TaskBasicInfoCard({
	knowledge,
	onFieldChange,
	concepts,
}: TaskBasicInfoCardProps) {
	return (
		<Card className="rounded-md border border-slate-200">
			<CardContent className="p-5 space-y-3">
				<div className="flex items-center gap-3 text-[12px] text-slate-500">
					<span className="font-mono">{knowledge.bizId}</span>
					<span className="text-slate-300">/</span>
					<span className="font-mono">{knowledge.taskId}</span>
				</div>

				<div className="space-y-1.5">
					<Label className="text-[12px] font-medium text-slate-500">
						業務タスク<span className="text-rose-500">*</span>
					</Label>
					<Input
						value={knowledge.taskName}
						onChange={(e) => onFieldChange("taskName", e.target.value)}
						className="text-[16px] font-semibold"
					/>
				</div>

				<div className="space-y-1.5">
					<Label className="text-[12px] font-medium text-slate-500">
						業務概要<span className="text-rose-500">*</span>
					</Label>
					<Textarea
						value={knowledge.taskSummary}
						onChange={(e) => onFieldChange("taskSummary", e.target.value)}
						className="min-h-[110px] text-[14px]"
					/>
				</div>

				<div className="space-y-1.5">
					<Label className="text-[12px] font-medium text-slate-500">
						業務コンテキスト<span className="text-rose-500">*</span>
					</Label>
					<Textarea
						value={knowledge.businessContext}
						onChange={(e) => onFieldChange("businessContext", e.target.value)}
						className="min-h-[120px] text-[14px]"
						placeholder="実施組織・ロール、タイミング、前後の業務、業務ルールなど"
					/>
				</div>

				<MarkdownGuide />

				<ProcessStepsField
					label="業務プロセス"
					value={knowledge.processSteps}
					onChange={(value) => onFieldChange("processSteps", value)}
					helperText="いつ／誰が／何をするかを入力します（任意）。"
				/>

				<KeySourceListField
					label="inputs"
					value={knowledge.input}
					onChange={(value) => onFieldChange("input", value)}
					namePlaceholder="入力の名前"
					sourcePlaceholder="ソース"
					helperText="開始時に必要な情報を名前/ソースで整理します。"
				/>
				<KeySourceListField
					label="outputs"
					value={knowledge.output}
					onChange={(value) => onFieldChange("output", value)}
					namePlaceholder="出力の名前"
					sourcePlaceholder="ソース"
					helperText="完了後の成果物を名前/ソースで整理します。"
				/>
				<ConceptIdsField
					label="concept_ids"
					value={knowledge.conceptIdsYaml}
					onChange={(value) => onFieldChange("conceptIdsYaml", value)}
					concepts={concepts}
					helperText="関連概念IDをバッジで管理します（任意）。"
				/>
			</CardContent>
		</Card>
	);
}
