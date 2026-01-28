/**
 * 品質目標表示
 */

"use client";

import { MarkdownTextareaView } from "./markdown-textarea-view";

interface QualityGoalsViewProps {
	value: string;
}

export function QualityGoalsView({ value }: QualityGoalsViewProps) {
	return <MarkdownTextareaView label="品質目標" value={value} />;
}
