/**
 * 体験目標表示
 */

"use client";

import { MarkdownTextareaView } from "./markdown-textarea-view";

interface ExperienceGoalsViewProps {
	value: string;
}

export function ExperienceGoalsView({ value }: ExperienceGoalsViewProps) {
	return <MarkdownTextareaView label="体験目標" value={value} />;
}
