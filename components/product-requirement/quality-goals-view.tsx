/**
 * 品質目標表示
 */

"use client";

import { MarkdownTextareaView } from "./markdown-textarea-view";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface QualityGoalsViewProps {
	value: string;
}

export function QualityGoalsView({ value }: QualityGoalsViewProps) {
	return (
		<MarkdownTextareaView
			label={PRODUCT_REQUIREMENT_FIELD_CONFIGS.qualityGoals.label}
			value={value}
		/>
	);
}
