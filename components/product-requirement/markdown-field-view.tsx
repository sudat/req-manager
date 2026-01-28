"use client";

import { Label } from "@/components/ui/label";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

type MarkdownFieldViewProps = {
	label: string;
	content: string;
};

export function MarkdownFieldView({ label, content }: MarkdownFieldViewProps) {
	return (
		<div className="space-y-2">
			<Label className="text-sm font-medium text-slate-700">{label}</Label>
			<div className="rounded-md border border-slate-200 bg-slate-50 p-4">
				<MarkdownRenderer content={content} />
			</div>
		</div>
	);
}
