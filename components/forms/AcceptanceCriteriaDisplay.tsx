"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";

type AcceptanceCriteriaDisplayProps = {
	items: AcceptanceCriterionJson[];
	emptyMessage?: string;
};

/**
 * テンプレート文字列かどうかを検出
 * - プレースホルダー `[...]` が含まれる
 * - YAML構造キーワード（description:, preconditions:, trigger:, expected_outcomes:）が含まれる
 */
const isTemplateText = (text: string | undefined): boolean => {
	if (!text || text.trim().length === 0) return false;
	return (
		/\[.*?\]/.test(text) ||
		/\b(description|preconditions|trigger|expected_outcomes):\s*["']?\[/.test(text)
	);
};

const isTemplateAC = (item: AcceptanceCriterionJson): boolean =>
	isTemplateText(item.givenText) ||
	isTemplateText(item.whenText) ||
	isTemplateText(item.thenText);

export function AcceptanceCriteriaDisplay({
	items,
	emptyMessage = "未登録",
}: AcceptanceCriteriaDisplayProps): React.ReactNode {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	if (!items || items.length === 0) {
		return <div className="text-[13px] text-slate-400">{emptyMessage}</div>;
	}

	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	return (
		<div className="space-y-2">
			{items.map((item) => {
				const isExpanded = expandedIds.has(item.id);
				const isTemplate = isTemplateAC(item);
				const hasContent =
					item.givenText || item.whenText || item.thenText;

				return (
					<div
						key={item.id}
						className="rounded-md border border-slate-200 bg-white p-3 space-y-2"
					>
						{/* ヘッダー: AC ID + シナリオ名 + 展開トグル */}
						<div className="flex items-start gap-2">
							<span className="text-[11px] font-mono text-slate-400 shrink-0 mt-0.5">
								{item.id}
							</span>
							<div className="flex-1 min-w-0">
								<div className="text-[13px] text-slate-700">
									{item.description}
								</div>
								{isTemplate && (
									<div className="flex items-center gap-1 mt-1">
										<span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
											⚠️ 詳細未設定
										</span>
									</div>
								)}
							</div>
							{hasContent && (
								<button
									type="button"
									onClick={() => toggleExpand(item.id)}
									className="shrink-0 flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
								>
									<ChevronDown
										className={cn(
											"h-4 w-4 transition-transform",
											isExpanded ? "rotate-180" : ""
										)}
									/>
									<span className="hidden sm:inline">
										{isExpanded ? "折りたたむ" : "展開"}
									</span>
								</button>
							)}
						</div>

						{/* GWT詳細（展開時のみ表示） */}
						{isExpanded && hasContent && (
							<div
								className={cn(
									"rounded border border-slate-200 p-2 text-[11px] text-slate-600 space-y-2",
									isTemplate ? "bg-slate-100" : "bg-slate-50"
								)}
							>
								{item.givenText && item.givenText.trim().length > 0 && (
									<div>
										<div className="text-[10px] font-semibold text-slate-500 mb-1">
											Given
										</div>
										<pre className="whitespace-pre-wrap">
											{item.givenText}
										</pre>
									</div>
								)}
								{item.whenText && item.whenText.trim().length > 0 && (
									<div>
										<div className="text-[10px] font-semibold text-slate-500 mb-1">
											When
										</div>
										<pre className="whitespace-pre-wrap">
											{item.whenText}
										</pre>
									</div>
								)}
								{item.thenText && item.thenText.trim().length > 0 && (
									<div>
										<div className="text-[10px] font-semibold text-slate-500 mb-1">
											Then
										</div>
										<pre className="whitespace-pre-wrap">
											{item.thenText}
										</pre>
									</div>
								)}
							</div>
						)}

						{/* 検証方法 */}
						{item.verification_method && (
							<div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
								<span>検証方法: {item.verification_method}</span>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
