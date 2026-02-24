"use client";

import { ConceptIdsField } from "@/components/forms/concept-ids-field";
import { KeySourceListField } from "@/components/forms/key-source-list-field";
import { ProcessStepsField } from "@/components/forms/process-steps-field";
import { TaskFrequencyField } from "@/components/forms/TaskFrequencyField";
import { TaskTriggerField } from "@/components/forms/TaskTriggerField";
import { Card, CardContent } from "@/components/ui/card";
import { LabeledInput } from "@/components/ui/labeled-input";
import { LabeledTextarea } from "@/components/ui/labeled-textarea";
import type { Task, TaskKnowledge } from "@/lib/domain";
import type { SelectableItem } from "@/lib/domain/forms";

type TaskBasicInfoCardProps = {
	knowledge: TaskKnowledge;
	onFieldChange: <K extends keyof TaskKnowledge>(
		key: K,
		value: TaskKnowledge[K],
	) => void;
	concepts: SelectableItem[];
	tasks: Task[];
};

/**
 * タスク基本情報カードコンポーネント
 */
export function TaskBasicInfoCard({
	knowledge,
	onFieldChange,
	concepts,
	tasks,
}: TaskBasicInfoCardProps) {
	return (
		<Card className="rounded-md border border-slate-200">
			<CardContent className="p-5 space-y-8">
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
					helperText="業務の名称を入力します。"
				/>

				<LabeledTextarea
					label="業務目的"
					required
					value={knowledge.taskSummary}
					onChange={(value) => onFieldChange("taskSummary", value)}
					minHeight="min-h-[80px]"
					showMarkdownBadge
					helperText="この業務で達成したい目的や成果を入力します。"
				/>

				<TaskTriggerField
					label="業務開始トリガー"
					description={knowledge.triggerDescription}
					selectedTaskIds={knowledge.triggerTaskIds}
					onDescriptionChange={(value) =>
						onFieldChange("triggerDescription", value)
					}
					onSelectedTaskIdsChange={(value) =>
						onFieldChange("triggerTaskIds", value)
					}
					tasks={tasks}
					currentTaskId={knowledge.taskId}
					helperText="この業務が開始される条件と、トリガーとなる前工程の業務を設定します（任意）。"
				/>

				<TaskFrequencyField
					label="業務頻度"
					frequency={knowledge.frequency}
					description={knowledge.frequencyDescription}
					onFrequencyChange={(value) => onFieldChange("frequency", value)}
					onDescriptionChange={(value) =>
						onFieldChange("frequencyDescription", value)
					}
					helperText="業務の実行頻度を選択し、詳細を入力します（任意）。"
				/>

				<ProcessStepsField
					label="業務プロセス"
					value={knowledge.processSteps}
					onChange={(value) => onFieldChange("processSteps", value)}
					helperText="通常ステップに加えて、分岐ごとの複数ステップと出口先を設定できます（任意）。"
				/>

				<KeySourceListField
					label="インプット"
					value={knowledge.input}
					onChange={(value) => onFieldChange("input", value)}
					namePlaceholder="入力の名前"
					sourcePlaceholder="ソース"
					helperText="開始時に必要な情報を名前/ソースで整理します。"
				/>

				<KeySourceListField
					label="アウトプット"
					value={knowledge.output}
					onChange={(value) => onFieldChange("output", value)}
					namePlaceholder="出力の名前"
					sourcePlaceholder="ソース"
					helperText="完了後の成果物を名前/ソースで整理します。"
				/>

				<ConceptIdsField
					label="概念"
					value={knowledge.conceptIdsYaml}
					onChange={(value) => onFieldChange("conceptIdsYaml", value)}
					concepts={concepts}
					helperText="この業務で扱う概念（データや用語）を選択します（任意）。"
				/>
			</CardContent>
		</Card>
	);
}
