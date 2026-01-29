/**
 * 品質目標編集
 */

"use client";

import { MarkdownTextareaEdit } from "./markdown-textarea-edit";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface QualityGoalsEditProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function QualityGoalsEdit({ value, onChange, error }: QualityGoalsEditProps) {
	const config = PRODUCT_REQUIREMENT_FIELD_CONFIGS.qualityGoals;
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
