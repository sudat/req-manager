/**
 * ターゲットユーザー（統合コンポーネント）
 */

"use client";

import { MarkdownTextarea } from "./markdown-textarea";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface TargetUsersProps {
	isEditing: boolean;
	value: string;
	onChange?: (value: string) => void;
	error?: string;
}

export function TargetUsers({ isEditing, value, onChange, error }: TargetUsersProps) {
	const config = PRODUCT_REQUIREMENT_FIELD_CONFIGS.targetUsers;
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
