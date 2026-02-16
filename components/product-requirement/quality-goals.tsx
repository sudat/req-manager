/**
 * 品質目標（統合コンポーネント）
 */

"use client";

import { MarkdownTextarea } from "./markdown-textarea";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface QualityGoalsProps {
	isEditing: boolean;
	value: string;
	onChange?: (value: string) => void;
	error?: string;
}

export function QualityGoals({ isEditing, value, onChange, error }: QualityGoalsProps) {
	const config = PRODUCT_REQUIREMENT_FIELD_CONFIGS.qualityGoals;
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
