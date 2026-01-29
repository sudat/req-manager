/**
 * UXガイドライン編集
 */

"use client";

import { MarkdownTextareaEdit } from "./markdown-textarea-edit";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface UxGuidelinesEditProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function UxGuidelinesEdit({ value, onChange, error }: UxGuidelinesEditProps) {
	const config = PRODUCT_REQUIREMENT_FIELD_CONFIGS.uxGuidelines;
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
