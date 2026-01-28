/**
 * UXガイドライン表示
 */

"use client";

import { MarkdownTextareaView } from "./markdown-textarea-view";

interface UxGuidelinesViewProps {
	value: string;
}

export function UxGuidelinesView({ value }: UxGuidelinesViewProps) {
	return <MarkdownTextareaView label="UXガイドライン" value={value} />;
}
