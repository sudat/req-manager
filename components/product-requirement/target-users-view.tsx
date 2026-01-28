/**
 * ターゲットユーザー表示
 */

"use client";

import { MarkdownTextareaView } from "./markdown-textarea-view";

interface TargetUsersViewProps {
	value: string;
}

export function TargetUsersView({ value }: TargetUsersViewProps) {
	return <MarkdownTextareaView label="ターゲットユーザー" value={value} />;
}
