"use client";

import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { YamlTextareaField } from "@/components/forms/yaml-textarea-field";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";
import type { SystemRequirementCategory } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { templateByCategory } from "@/lib/utils/system-functions/generate-acceptance-criteria";

type StructuredAcceptanceCriteriaInputProps = {
	values: AcceptanceCriterionJson[];
	onChange: (values: AcceptanceCriterionJson[]) => void;
	className?: string;
	category?: SystemRequirementCategory;
	idPrefix?: string;
};

const pad3 = (value: number) => String(value).padStart(3, "0");

const normalizeOptional = (value: string): string | null =>
	value.trim().length === 0 ? null : value;

const hasDetails = (item: AcceptanceCriterionJson): boolean =>
	!!item.verification_method ||
	(item.givenText?.trim()?.length ?? 0) > 0 ||
	(item.whenText?.trim()?.length ?? 0) > 0 ||
	(item.thenText?.trim()?.length ?? 0) > 0;

function getNextId(values: AcceptanceCriterionJson[], idPrefix: string): string {
	const used = new Set(values.map((item) => item.id));
	let index = 1;
	while (used.has(`${idPrefix}${pad3(index)}`)) {
		index += 1;
	}
	return `${idPrefix}${pad3(index)}`;
}

export function StructuredAcceptanceCriteriaInput({
	values,
	onChange,
	className,
	category,
	idPrefix = "AC-",
}: StructuredAcceptanceCriteriaInputProps) {
	const [expandedIds, setExpandedIds] = useState<string[]>(
		values.filter(hasDetails).map((item) => item.id)
	);
	const template = templateByCategory(category);

	const handleAdd = () => {
		const next: AcceptanceCriterionJson = {
			id: getNextId(values, idPrefix),
			description: "",
			verification_method: null,
			givenText: "",
			whenText: "",
			thenText: "",
		};
		onChange([...values, next]);
		setExpandedIds((prev) => (prev.includes(next.id) ? prev : [...prev, next.id]));
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

	const applyTemplate = (index: number) => {
		updateItem(index, {
			givenText: template.givenText,
			whenText: template.whenText,
			thenText: template.thenText,
		});
	};

	return (
		<div className={cn("space-y-2", className)}>
			<Label className="text-[12px] font-medium text-slate-500">
				受入基準（GWT）
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

							<div className="flex items-center gap-2">
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
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-7 text-[11px]"
									onClick={() => {
										applyTemplate(index);
										setExpandedIds((prev) =>
											prev.includes(item.id) ? prev : [...prev, item.id]
										);
									}}
								>
									テンプレート適用
								</Button>
							</div>

							{isExpanded && (
								<div className="grid gap-3 md:grid-cols-1">
									<YamlTextareaField
										label="Given"
										value={item.givenText ?? ""}
										onChange={(value) => updateItem(index, { givenText: value })}
										minHeight="min-h-[110px]"
										placeholder={template.givenText}
										helperText="YAMLで前提条件を記述します。"
									/>
									<YamlTextareaField
										label="When"
										value={item.whenText ?? ""}
										onChange={(value) => updateItem(index, { whenText: value })}
										minHeight="min-h-[100px]"
										placeholder={template.whenText}
										helperText="YAMLで操作・トリガーを記述します。"
									/>
									<YamlTextareaField
										label="Then"
										value={item.thenText ?? ""}
										onChange={(value) => updateItem(index, { thenText: value })}
										minHeight="min-h-[110px]"
										placeholder={template.thenText}
										helperText="YAMLで期待結果を記述します。"
									/>
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
