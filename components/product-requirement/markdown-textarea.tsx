/**
 * マークダウンテキストエリア（統合コンポーネント）
 *
 * 編集/閲覧モードを切り替えられるマークダウンテキストエリア
 */

"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

interface MarkdownTextareaProps {
	isEditing: boolean;
	label: string;
	value: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	error?: string;
	minHeight?: string;
}

export function MarkdownTextarea({
	isEditing,
	label,
	value,
	onChange,
	placeholder,
	error,
	minHeight = "min-h-[300px]",
}: MarkdownTextareaProps) {
	if (!isEditing) {
		return (
			<div className="space-y-2">
				<Label className="text-[13px] font-medium text-slate-700">{label}</Label>
				<div className="p-4 bg-slate-50 rounded-md border border-slate-200">
					<MarkdownRenderer content={value} />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="text-[13px] font-medium text-slate-700">{label}</Label>
				<Badge
					variant="outline"
					className="text-[10px] px-1.5 py-0 h-5 border-blue-200 bg-blue-50 text-blue-700"
				>
					Markdown
				</Badge>
			</div>
			<Textarea
				value={value}
				onChange={(e) => onChange?.(e.target.value)}
				className={minHeight}
				placeholder={placeholder}
			/>
			{error && <p className="text-xs text-rose-600">{error}</p>}
		</div>
	);
}
