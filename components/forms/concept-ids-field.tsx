"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConceptBadgeList } from "@/components/ui/concept-badge";
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
				<span className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">{label}</span>
				<Button
					type="button"
					variant="outline"
					className="h-8 text-[12px]"
					onClick={() => setDialogState({ type: "concepts", reqId: "concept-selector" })}
				>
					追加
				</Button>
			</div>
			{helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
			<ConceptBadgeList
				ids={selectedIds}
				conceptMap={conceptMap}
				onRemove={toggleConcept}
				emptyMessage="未選択"
			/>
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
				onUpdateRequirement={handleUpdateRequirement}
			/>
		</div>
	);
}
