"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
	const [openIds, setOpenIds] = useState<Set<string>>(new Set());

	if (!items || items.length === 0) {
		return <div className="text-[13px] text-slate-400">{emptyMessage}</div>;
	}

	const handleOpenChange = (id: string, isOpen: boolean) => {
		setOpenIds((prev) => {
			const next = new Set(prev);
			if (isOpen) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	};

	return (
		<div className="space-y-2">
			{items.map((item) => {
				const isOpen = openIds.has(item.id);
				const isTemplate = isTemplateAC(item);
				const hasContent =
					item.givenText || item.whenText || item.thenText;

				return (
					<Collapsible
						key={item.id}
						open={isOpen}
						onOpenChange={(open) => handleOpenChange(item.id, open)}
					>
						<div className="rounded-md border border-slate-200 bg-white p-3 space-y-2">
							{/* ヘッダー: AC ID + シナリオ名 + 展開トグル */}
							{hasContent ? (
								<CollapsibleTrigger asChild>
									<div className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 rounded -m-3 p-3 transition-colors">
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
										<ChevronDown
											className={cn(
												"shrink-0 h-4 w-4 transition-transform duration-200 text-slate-500",
												isOpen ? "rotate-180" : ""
											)}
										/>
									</div>
								</CollapsibleTrigger>
							) : (
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
								</div>
							)}

							{/* GWT詳細（展開時のみ表示） */}
							{hasContent && (
								<CollapsibleContent className="space-y-0">
									<div
										className={cn(
											"rounded border border-slate-200 p-2 text-[11px] text-slate-600 space-y-2 mt-2",
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
								</CollapsibleContent>
							)}

							{/* 検証方法 */}
							{item.verification_method && (
								<div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
									<span>検証方法: {item.verification_method}</span>
								</div>
							)}
						</div>
					</Collapsible>
				);
			})}
		</div>
	);
}
