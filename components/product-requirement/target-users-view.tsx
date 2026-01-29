/**
 * ターゲットユーザー表示
 */

"use client";

import { MarkdownTextareaView } from "./markdown-textarea-view";
import { PRODUCT_REQUIREMENT_FIELD_CONFIGS } from "./field-configs";

interface TargetUsersViewProps {
	value: string;
}

export function TargetUsersView({ value }: TargetUsersViewProps) {
	return (
		<MarkdownTextareaView
			label={PRODUCT_REQUIREMENT_FIELD_CONFIGS.targetUsers.label}
			value={value}
		/>
	);
}
