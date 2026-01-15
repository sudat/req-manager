"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { MarkdownGuide } from "./MarkdownGuide";
import type { TaskKnowledge } from "@/lib/domain";

type TaskBasicInfoCardProps = {
	knowledge: TaskKnowledge;
	onFieldChange: <K extends keyof TaskKnowledge>(key: K, value: TaskKnowledge[K]) => void;
};

/**
 * タスク基本情報カードコンポーネント
 */
export function TaskBasicInfoCard({ knowledge, onFieldChange }: TaskBasicInfoCardProps) {
	return (
		<Card className="rounded-md border border-slate-200">
			<CardContent className="p-3 space-y-3">
				<div className="flex items-center gap-3 text-[12px] text-slate-500">
					<span className="font-mono">{knowledge.bizId}</span>
					<span className="text-slate-300">/</span>
					<span className="font-mono">{knowledge.taskId}</span>
				</div>

				<FormField
					type="input"
					label="業務タスク"
					value={knowledge.taskName}
					onChange={(v) => onFieldChange("taskName", v)}
					inputClassName="text-[16px] font-semibold"
				/>

				<FormField
					type="textarea"
					label="業務概要"
					value={knowledge.taskSummary}
					onChange={(v) => onFieldChange("taskSummary", v)}
				/>

				<MarkdownGuide />

				<div className="grid gap-3 md:grid-cols-3">
					<FormField
						type="input"
						label="担当者"
						value={knowledge.person ?? ""}
						onChange={(v) => onFieldChange("person", v)}
					/>
					<FormField
						type="input"
						label="インプット"
						value={knowledge.input ?? ""}
						onChange={(v) => onFieldChange("input", v)}
					/>
					<FormField
						type="input"
						label="アウトプット"
						value={knowledge.output ?? ""}
						onChange={(v) => onFieldChange("output", v)}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
