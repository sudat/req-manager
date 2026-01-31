"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LabeledInput } from "@/components/ui/labeled-input";
import { LabeledTextarea } from "@/components/ui/labeled-textarea";
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

				<LabeledInput
					label="業務タスク"
					required
					value={knowledge.taskName}
					onChange={(value) => onFieldChange("taskName", value)}
					className="text-[16px] font-semibold"
				/>

				<LabeledTextarea
					label="業務概要"
					required
					value={knowledge.taskSummary}
					onChange={(value) => onFieldChange("taskSummary", value)}
					minHeight="min-h-[110px]"
				/>

				<LabeledTextarea
					label="業務コンテキスト"
					required
					value={knowledge.businessContext}
					onChange={(value) => onFieldChange("businessContext", value)}
					placeholder="実施組織・ロール、タイミング、前後の業務、業務ルールなど"
					minHeight="min-h-[120px]"
				/>

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
				/>
			</CardContent>
		</Card>
	);
}
