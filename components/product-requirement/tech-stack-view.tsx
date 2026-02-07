"use client";

import { Label } from "@/components/ui/label";
import { HierarchicalViewer } from "@/components/forms/hierarchical-editor/viewer";
import { yamlToHierarchical } from "@/lib/utils/hierarchical-editor";
import { PRODUCT_REQUIREMENT_DEFAULT_KEY_LABELS } from "@/lib/product-requirement/key-label-defaults";

type TechStackViewProps = {
	techStackProfile: string | null;
	codingConventions: string | null;
	forbiddenChoices: string | null;
	keyLabelMap?: Record<string, string>;
};

function HierarchicalFieldView({
	label,
	content,
	keyLabelMap,
}: {
	label: string;
	content: string | null;
	keyLabelMap: Record<string, string>;
}) {
	const hierarchicalValue = content ? yamlToHierarchical(content) : null;

	return (
		<div className="space-y-2">
			<Label className="text-[13px] font-medium text-slate-700">{label}</Label>
			{hierarchicalValue ? (
				<div className="p-3 bg-slate-50 rounded-md border border-slate-200">
					<HierarchicalViewer
						value={hierarchicalValue}
						keyLabelMap={keyLabelMap}
					/>
				</div>
			) : (
				<div className="p-4 bg-slate-50 rounded-md border border-slate-200">
					<span className="text-slate-400 italic text-[13px]">未設定</span>
				</div>
			)}
		</div>
	);
}

export function TechStackView({
	techStackProfile,
	codingConventions,
	forbiddenChoices,
	keyLabelMap,
}: TechStackViewProps) {
	const mergedKeyLabelMap = {
		...PRODUCT_REQUIREMENT_DEFAULT_KEY_LABELS,
		...(keyLabelMap ?? {}),
	};

	return (
		<div className="space-y-6">
			<HierarchicalFieldView
				label="技術スタック"
				content={techStackProfile}
				keyLabelMap={mergedKeyLabelMap}
			/>
			<HierarchicalFieldView
				label="コーディング規約"
				content={codingConventions}
				keyLabelMap={mergedKeyLabelMap}
			/>
			<HierarchicalFieldView
				label="除外・禁止事項"
				content={forbiddenChoices}
				keyLabelMap={mergedKeyLabelMap}
			/>
		</div>
	);
}
