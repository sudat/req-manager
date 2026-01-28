/**
 * マークダウンテキストエリア（共通コンポーネント）
 *
 * 各フィールド用のシンプルなテキストエリアコンポーネント
 */

"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MarkdownTextareaEditProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string;
	minHeight?: string;
}

export function MarkdownTextareaEdit({
	label,
	value,
	onChange,
	placeholder,
	error,
	minHeight = "min-h-[300px]",
}: MarkdownTextareaEditProps) {
	return (
		<div className="space-y-2">
			<Label className="text-[13px] font-medium text-slate-700">{label}</Label>
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={minHeight}
				placeholder={placeholder}
			/>
			{error && <p className="text-xs text-rose-600">{error}</p>}
		</div>
	);
}
