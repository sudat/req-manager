/**
 * 体験目標（統合コンポーネント）
 */

"use client";

import { MarkdownTextarea } from "./markdown-textarea";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface ExperienceGoalsProps {
	isEditing: boolean;
	value: string;
	onChange?: (value: string) => void;
	error?: string;
}

export function ExperienceGoals({ isEditing, value, onChange, error }: ExperienceGoalsProps) {
	const config = PRODUCT_REQUIREMENT_FIELD_CONFIGS.experienceGoals;
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
