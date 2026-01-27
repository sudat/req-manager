"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Requirement, SelectionDialogState, SelectableItem, SelectionDialogType } from "@/lib/domain/forms";
import { useFilteredItems } from "./hooks/useFilteredItems";
import { useToggleHandlers } from "./hooks/useToggleHandlers";

type SelectionDialogProps = {
	dialogState: SelectionDialogState;
	onClose: () => void;
	activeRequirement: Requirement | null;
	concepts: SelectableItem[];
	systemFunctions: SelectableItem[];
	systemDomains: SelectableItem[];
	businessRequirements: SelectableItem[];
	systemRequirements?: SelectableItem[];
	deliverables?: SelectableItem[];
	onUpdateRequirement: (reqId: string, patch: Partial<Requirement>) => void;
};

function getDialogTitle(type: SelectionDialogType): string {
	switch (type) {
		case "concepts":
			return "関連概念を選択";
		case "system":
			return "関連システム機能を選択";
		case "domain":
			return "システム領域を選択";
		case "business":
			return "業務要件を選択";
		case "systemRequirements":
			return "関連システム要件を選択";
		case "deliverables":
			return "関連成果物を選択";
		default:
			return "";
	}
}

type CheckboxListProps = {
	items: SelectableItem[];
	emptyMessage: string;
	isChecked: (id: string) => boolean;
	onToggle: (id: string, checked: boolean) => void;
};

function CheckboxList({
	items,
	emptyMessage,
	isChecked,
	onToggle,
}: CheckboxListProps) {
	if (items.length === 0) {
		return <p className="text-[13px] text-slate-500">{emptyMessage}</p>;
	}

	return (
		<>
			{items.map((item) => (
				<label
					key={item.id}
					className="flex items-center gap-2 text-[14px] text-slate-700"
				>
					<input
						type="checkbox"
						checked={isChecked(item.id)}
						onChange={(e) => onToggle(item.id, e.target.checked)}
						className="h-4 w-4 rounded border-slate-300"
					/>
					<span className="font-mono text-[11px] text-slate-500 shrink-0">{item.id}</span>
					<span className="truncate" title={`${item.id}: ${item.name}`}>
						{item.name}
					</span>
				</label>
			))}
		</>
	);
}

export function SelectionDialog({
	dialogState,
	onClose,
	activeRequirement,
	concepts,
	systemFunctions,
	systemDomains,
	businessRequirements,
	systemRequirements = [],
	deliverables = [],
	onUpdateRequirement,
}: SelectionDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// フィルタ処理
	const filteredConcepts = useFilteredItems(concepts, searchQuery);
	const filteredSystemFunctions = useFilteredItems(systemFunctions, searchQuery);
	const filteredSystemDomains = useFilteredItems(systemDomains, searchQuery);
	const filteredBusinessRequirements = useFilteredItems(businessRequirements, searchQuery);
	const filteredSystemRequirements = useFilteredItems(systemRequirements, searchQuery);
	const filteredDeliverables = useFilteredItems(deliverables, searchQuery);

	// トグルハンドラー
	const {
		handleConceptToggle,
		handleSystemFunctionToggle,
		handleDomainToggle,
		handleBusinessRequirementToggle,
		handleSystemRequirementToggle,
		handleDeliverableToggle,
	} = useToggleHandlers(activeRequirement, onUpdateRequirement);

	function handleOpenChange(open: boolean): void {
		if (!open) {
			setSearchQuery("");
			onClose();
		}
	}

	return (
		<Dialog open={!!dialogState} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-[520px] max-h-[70vh] overflow-hidden">
				<DialogHeader>
					<DialogTitle className="text-[16px]">
						{dialogState && getDialogTitle(dialogState.type)}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<Input
						placeholder="ID/名称で検索..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>

					<div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
						{dialogState?.type === "concepts" && activeRequirement && (
							<CheckboxList
								items={filteredConcepts}
								emptyMessage="該当する概念がありません。"
								isChecked={(id) => activeRequirement.conceptIds.includes(id)}
								onToggle={handleConceptToggle}
							/>
						)}

						{dialogState?.type === "system" && activeRequirement && (
							<CheckboxList
								items={filteredSystemFunctions}
								emptyMessage="該当するシステム機能がありません。"
								isChecked={(id) => activeRequirement.srfId === id}
								onToggle={handleSystemFunctionToggle}
							/>
						)}

						{dialogState?.type === "domain" && activeRequirement && (
							<CheckboxList
								items={filteredSystemDomains}
								emptyMessage="該当するシステム領域がありません。"
								isChecked={(id) => activeRequirement.systemDomainIds.includes(id)}
								onToggle={handleDomainToggle}
							/>
						)}

						{dialogState?.type === "business" && activeRequirement && (
							<CheckboxList
								items={filteredBusinessRequirements}
								emptyMessage="該当する業務要件がありません。"
								isChecked={(id) => activeRequirement.businessRequirementIds.includes(id)}
								onToggle={handleBusinessRequirementToggle}
							/>
						)}

						{dialogState?.type === "systemRequirements" && activeRequirement && (
							<CheckboxList
								items={filteredSystemRequirements}
								emptyMessage="該当するシステム要件がありません。"
								isChecked={(id) => activeRequirement.relatedSystemRequirementIds.includes(id)}
								onToggle={handleSystemRequirementToggle}
							/>
						)}

						{dialogState?.type === "deliverables" && activeRequirement && (
							<CheckboxList
								items={filteredDeliverables}
								emptyMessage="該当する成果物がありません。"
								isChecked={(id) => (activeRequirement.relatedDeliverableIds ?? []).includes(id)}
								onToggle={handleDeliverableToggle}
							/>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
