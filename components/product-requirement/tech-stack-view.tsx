"use client";

import { Label } from "@/components/ui/label";
import { HierarchicalViewer } from "@/components/forms/hierarchical-editor/viewer";
import { yamlToHierarchical } from "@/lib/utils/hierarchical-editor";

type TechStackViewProps = {
	techStackProfile: string | null;
	codingConventions: string | null;
	forbiddenChoices: string | null;
};

function HierarchicalFieldView({ label, content }: { label: string; content: string | null }) {
	const hierarchicalValue = content ? yamlToHierarchical(content) : null;

	return (
		<div className="space-y-2">
			<Label className="text-[13px] font-medium text-slate-700">{label}</Label>
			{hierarchicalValue ? (
				<div className="p-3 bg-slate-50 rounded-md border border-slate-200">
					<HierarchicalViewer value={hierarchicalValue} />
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
}: TechStackViewProps) {
	return (
		<div className="space-y-6">
			<HierarchicalFieldView label="技術スタック" content={techStackProfile} />
			<HierarchicalFieldView label="コーディング規約" content={codingConventions} />
			<HierarchicalFieldView label="除外・禁止事項" content={forbiddenChoices} />
		</div>
	);
}
