"use client";

import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { parseISO, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";
import { cn } from "@/lib/utils";

type StructuredAcceptanceCriteriaInputProps = {
	values: AcceptanceCriterionJson[];
	onChange: (values: AcceptanceCriterionJson[]) => void;
	className?: string;
};

const pad3 = (value: number) => String(value).padStart(3, "0");

const normalizeOptional = (value: string): string | null =>
	value.trim().length === 0 ? null : value;

const hasDetails = (item: AcceptanceCriterionJson): boolean =>
	!!(
		item.verification_method ||
		item.status ||
		item.verified_by ||
		item.verified_at ||
		item.evidence
	);

function getNextId(values: AcceptanceCriterionJson[]): string {
	const used = new Set(values.map((item) => item.id));
	let index = values.length;
	while (used.has(`AC-${pad3(index + 1)}`)) {
		index += 1;
	}
	return `AC-${pad3(index + 1)}`;
}

export function StructuredAcceptanceCriteriaInput({
	values,
	onChange,
	className,
}: StructuredAcceptanceCriteriaInputProps) {
	const [expandedIds, setExpandedIds] = useState<string[]>(
		values.filter(hasDetails).map((item) => item.id)
	);

	const handleAdd = () => {
		const next: AcceptanceCriterionJson = {
			id: getNextId(values),
			description: "",
			verification_method: null,
			status: null,
			verified_by: null,
			verified_at: null,
			evidence: null,
		};
		onChange([...values, next]);
	};

	const handleRemove = (index: number) => {
		onChange(values.filter((_, i) => i !== index));
	};

	const toggleDetails = (id: string) => {
		setExpandedIds((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		);
	};

	const updateItem = (index: number, patch: Partial<AcceptanceCriterionJson>) => {
		const next = values.map((item, i) => (i === index ? { ...item, ...patch } : item));
		onChange(next);
	};

	return (
		<div className={cn("space-y-2", className)}>
			<Label className="text-[12px] font-medium text-slate-500">
				受入条件（構造化）
			</Label>
			<div className="space-y-2">
				{values.map((item, index) => {
					const isExpanded = expandedIds.includes(item.id);
					return (
						<div
							key={item.id}
							className="rounded-md border border-slate-200 bg-white p-3 space-y-2"
						>
							<div className="flex items-center gap-2">
								<span className="text-[11px] font-mono text-slate-400">
									{item.id}
								</span>
								<Input
									value={item.description}
									onChange={(e) =>
										updateItem(index, { description: e.target.value })
									}
									placeholder="受入条件の説明"
									className="h-9 text-[14px]"
								/>
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									className="h-9 w-9 shrink-0"
									onClick={() => handleRemove(index)}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>

							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 text-[12px] text-slate-500 gap-1"
								onClick={() => toggleDetails(item.id)}
							>
								<ChevronDown
									className={cn(
										"h-4 w-4 transition-transform",
										isExpanded ? "rotate-180" : ""
									)}
								/>
								詳細
							</Button>

							{isExpanded && (
								<div className="grid gap-3 md:grid-cols-2">
									<div className="space-y-1">
										<Label className="text-[11px] text-slate-500">
											検証方法
										</Label>
										<Input
											value={item.verification_method ?? ""}
											onChange={(e) =>
												updateItem(index, {
													verification_method: normalizeOptional(e.target.value),
												})
											}
											placeholder="例: 目視確認"
											className="h-9 text-[13px]"
										/>
									</div>
									<div className="space-y-1">
										<Label className="text-[11px] text-slate-500">ステータス</Label>
										<Input
											value={item.status ?? ""}
											onChange={(e) =>
												updateItem(index, { status: normalizeOptional(e.target.value) })
											}
											placeholder="例: 未検証"
											className="h-9 text-[13px]"
										/>
									</div>
									<div className="space-y-1">
										<Label className="text-[11px] text-slate-500">確認者</Label>
										<Input
											value={item.verified_by ?? ""}
											onChange={(e) =>
												updateItem(index, {
													verified_by: normalizeOptional(e.target.value),
												})
											}
											placeholder="例: QAチーム"
											className="h-9 text-[13px]"
										/>
									</div>
									<div className="space-y-1">
										<Label className="text-[11px] text-slate-500">確認日</Label>
										<DatePicker
											value={item.verified_at ? parseISO(item.verified_at) : undefined}
											onChange={(date) =>
												updateItem(index, {
													verified_at: date ? format(date, "yyyy-MM-dd") : null,
												})
											}
											placeholder="例: 2026-01-19"
										/>
									</div>
									<div className="space-y-1 md:col-span-2">
										<Label className="text-[11px] text-slate-500">エビデンス</Label>
										<Textarea
											value={item.evidence ?? ""}
											onChange={(e) =>
												updateItem(index, {
													evidence: normalizeOptional(e.target.value),
												})
											}
											placeholder="例: テスト結果URL"
											className="min-h-[72px] text-[13px]"
										/>
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="w-full gap-2 text-[12px]"
				onClick={handleAdd}
			>
				<Plus className="h-4 w-4" />
				条件を追加
			</Button>
		</div>
	);
}
