/**
 * UXガイドライン（統合コンポーネント）
 */

"use client";

import { MarkdownTextarea } from "./markdown-textarea";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface UxGuidelinesProps {
	isEditing: boolean;
	value: string;
	onChange?: (value: string) => void;
	error?: string;
}

export function UxGuidelines({ isEditing, value, onChange, error }: UxGuidelinesProps) {
	const config = PRODUCT_REQUIREMENT_FIELD_CONFIGS.uxGuidelines;
	return (
		<MarkdownTextarea
			isEditing={isEditing}
			label={config.label}
			value={value}
			onChange={onChange}
			placeholder={config.placeholder}
			error={error}
		/>
	);
}
