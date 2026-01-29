/**
 * デザインシステム表示
 */

"use client";

import { MarkdownTextareaView } from "./markdown-textarea-view";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface DesignSystemViewProps {
	value: string;
}

export function DesignSystemView({ value }: DesignSystemViewProps) {
	return (
		<MarkdownTextareaView
			label={PRODUCT_REQUIREMENT_FIELD_CONFIGS.designSystem.label}
			value={value}
		/>
	);
}
