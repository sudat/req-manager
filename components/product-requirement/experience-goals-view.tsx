/**
 * 体験目標表示
 */

"use client";

import { MarkdownTextareaView } from "./markdown-textarea-view";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface ExperienceGoalsViewProps {
	value: string;
}

export function ExperienceGoalsView({ value }: ExperienceGoalsViewProps) {
	return (
		<MarkdownTextareaView
			label={PRODUCT_REQUIREMENT_FIELD_CONFIGS.experienceGoals.label}
			value={value}
		/>
	);
}
