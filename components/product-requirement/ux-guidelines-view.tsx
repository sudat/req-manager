/**
 * UXガイドライン表示
 */

"use client";

import { MarkdownTextareaView } from "./markdown-textarea-view";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface UxGuidelinesViewProps {
	value: string;
}

export function UxGuidelinesView({ value }: UxGuidelinesViewProps) {
	return (
		<MarkdownTextareaView
			label={PRODUCT_REQUIREMENT_FIELD_CONFIGS.uxGuidelines.label}
			value={value}
		/>
	);
}
