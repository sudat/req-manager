/**
 * デザインシステム（統合コンポーネント）
 */

"use client";

import { MarkdownTextarea } from "./markdown-textarea";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface DesignSystemProps {
	isEditing: boolean;
	value: string;
	onChange?: (value: string) => void;
	error?: string;
}

export function DesignSystem({ isEditing, value, onChange, error }: DesignSystemProps) {
	const config = PRODUCT_REQUIREMENT_FIELD_CONFIGS.designSystem;
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
