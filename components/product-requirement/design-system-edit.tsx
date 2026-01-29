/**
 * デザインシステム編集
 */

"use client";

import { MarkdownTextareaEdit } from "./markdown-textarea-edit";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface DesignSystemEditProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function DesignSystemEdit({ value, onChange, error }: DesignSystemEditProps) {
	const config = PRODUCT_REQUIREMENT_FIELD_CONFIGS.designSystem;
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
