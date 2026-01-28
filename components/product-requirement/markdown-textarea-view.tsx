/**
 * マークダウンテキストエリア（共通ビューコンポーネント）
 */

"use client";

import { Label } from "@/components/ui/label";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

interface MarkdownTextareaViewProps {
	label: string;
	value: string;
}

export function MarkdownTextareaView({ label, value }: MarkdownTextareaViewProps) {
	return (
		<div className="space-y-2">
			<Label className="text-[13px] font-medium text-slate-700">{label}</Label>
			<div className="p-4 bg-slate-50 rounded-md border border-slate-200">
				<MarkdownRenderer content={value} />
			</div>
		</div>
	);
}
