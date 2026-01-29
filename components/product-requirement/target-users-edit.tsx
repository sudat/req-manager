/**
 * ターゲットユーザー編集
 */

"use client";

import { MarkdownTextareaEdit } from "./markdown-textarea-edit";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface TargetUsersEditProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function TargetUsersEdit({ value, onChange, error }: TargetUsersEditProps) {
	const config = PRODUCT_REQUIREMENT_FIELD_CONFIGS.targetUsers;
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
