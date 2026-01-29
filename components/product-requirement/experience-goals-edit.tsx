/**
 * 体験目標編集
 */

"use client";

import { MarkdownTextareaEdit } from "./markdown-textarea-edit";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface ExperienceGoalsEditProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function ExperienceGoalsEdit({ value, onChange, error }: ExperienceGoalsEditProps) {
	const config = PRODUCT_REQUIREMENT_FIELD_CONFIGS.experienceGoals;
	return (
		<MarkdownTextareaEdit
			label={config.label}
			value={value}
			onChange={onChange}
			placeholder={config.placeholder}
			error={error}
		/>
	);
}
