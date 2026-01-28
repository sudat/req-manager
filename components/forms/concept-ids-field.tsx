"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectionDialog } from "@/components/forms/SelectionDialog";
import type { Requirement, SelectionDialogState, SelectableItem } from "@/lib/domain/forms";
import { buildYamlIdList, parseYamlIdList } from "@/lib/utils/yaml";

type ConceptIdsFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	concepts: SelectableItem[];
	helperText?: string;
};

export function ConceptIdsField({
	label,
	value,
	onChange,
	concepts,
	helperText,
}: ConceptIdsFieldProps): ReactNode {
	const parsed = useMemo(() => parseYamlIdList(value), [value]);
	const [selectedIds, setSelectedIds] = useState<string[]>(parsed.value);
	const [dialogState, setDialogState] = useState<SelectionDialogState>(null);

	useEffect(() => {
		setSelectedIds(parsed.value);
	}, [parsed.value]);

	const conceptMap = useMemo(
		() => new Map(concepts.map((c) => [c.id, c.name])),
		[concepts]
	);

	const toggleConcept = (id: string) => {
		const next = selectedIds.includes(id)
			? selectedIds.filter((item) => item !== id)
			: [...selectedIds, id];
		setSelectedIds(next);
		onChange(buildYamlIdList(next));
	};

	const activeRequirement: Requirement | null = useMemo(() => {
		if (!dialogState) return null;
		return {
			id: "concept-selector",
			type: "業務要件",
			title: "",
			summary: "",
			goal: "",
			constraints: "",
			owner: "",
			conceptIds: selectedIds,
			srfIds: [],
			systemDomainIds: [],
			acceptanceCriteria: [],
			acceptanceCriteriaJson: [],
			businessRequirementIds: [],
			relatedSystemRequirementIds: [],
		};
	}, [dialogState, selectedIds]);

	const handleUpdateRequirement = (_reqId: string, patch: Partial<Requirement>) => {
		if (!patch.conceptIds) return;
		setSelectedIds(patch.conceptIds);
		onChange(buildYamlIdList(patch.conceptIds));
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-[12px] font-medium text-slate-500">{label}</span>
				<Button
					type="button"
					variant="outline"
					className="h-8 text-[12px]"
					onClick={() => setDialogState({ type: "concepts", reqId: "concept-selector" })}
				>
					追加
				</Button>
			</div>
			<div className="flex flex-wrap gap-2">
				{selectedIds.length === 0 && (
					<span className="text-[12px] text-slate-400">未選択</span>
				)}
				{selectedIds.map((id) => (
					<Badge key={id} variant="secondary" className="gap-1 text-[11px]">
						<span className="font-mono">{id}</span>
						{conceptMap.get(id) && (
							<span className="text-slate-600">{conceptMap.get(id)}</span>
						)}
						<button
							type="button"
							className="ml-1 text-slate-500 hover:text-slate-900"
							onClick={() => toggleConcept(id)}
							aria-label={`${id} を削除`}
						>
							×
						</button>
					</Badge>
				))}
			</div>
			{helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
			{parsed.error && (
				<p className="text-[12px] text-rose-600">
					既存のYAMLに構文エラーがあります。再保存すると上書きされます。
				</p>
			)}

			<SelectionDialog
				dialogState={dialogState}
				onClose={() => setDialogState(null)}
				activeRequirement={activeRequirement}
				concepts={concepts}
				systemFunctions={[]}
				systemDomains={[]}
				businessRequirements={[]}
				systemRequirements={[]}
				deliverables={[]}
				onUpdateRequirement={handleUpdateRequirement}
			/>
		</div>
	);
}
