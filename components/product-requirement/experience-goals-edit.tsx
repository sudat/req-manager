/**
 * 体験目標編集
 */

"use client";

import { MarkdownTextareaEdit } from "./markdown-textarea-edit";

interface ExperienceGoalsEditProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function ExperienceGoalsEdit({ value, onChange, error }: ExperienceGoalsEditProps) {
	return (
		<MarkdownTextareaEdit
			label="体験目標"
			value={value}
			onChange={onChange}
			placeholder="ユーザーが得たい価値や行動変容&#10;&#10;例:&#10;- ストレスなくタスクを完遂できる&#10;- 次のアクションが明確にわかる&#10;- 操作に迷わない直感的なUI"
			error={error}
		/>
	);
}
