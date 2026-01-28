/**
 * デザインシステム表示
 */

"use client";

import { MarkdownTextareaView } from "./markdown-textarea-view";

interface DesignSystemViewProps {
	value: string;
}

export function DesignSystemView({ value }: DesignSystemViewProps) {
	return <MarkdownTextareaView label="デザインシステム" value={value} />;
}
