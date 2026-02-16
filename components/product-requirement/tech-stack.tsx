"use client";

import { Label } from "@/components/ui/label";
import { HierarchicalEditor } from "@/components/forms/hierarchical-editor";
import { HierarchicalViewer } from "@/components/forms/hierarchical-editor/viewer";
import { yamlToHierarchical } from "@/lib/utils/hierarchical-editor";
import { PRODUCT_REQUIREMENT_DEFAULT_KEY_LABELS } from "@/lib/product-requirement/key-label-defaults";

type TechStackProps = {
	isEditing: boolean;
	techStackProfile: string | null;
	codingConventions: string | null;
	forbiddenChoices: string | null;
	// 編集用コールバック（isEditing=true時に必要）
	onTechStackProfileChange?: (value: string) => void;
	onCodingConventionsChange?: (value: string) => void;
	onForbiddenChoicesChange?: (value: string) => void;
	onClearFieldError?: (key: string) => void;
	onKeyLabelAdd?: (key: string, logicalLabel: string) => void;
	// 閲覧用（isEditing=false時に使用）
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
					<HierarchicalViewer value={hierarchicalValue} keyLabelMap={keyLabelMap} />
				</div>
			) : (
				<div className="p-4 bg-slate-50 rounded-md border border-slate-200">
					<span className="text-slate-400 italic text-[13px]">未設定</span>
				</div>
			)}
		</div>
	);
}

export function TechStack({
	isEditing,
	techStackProfile,
	codingConventions,
	forbiddenChoices,
	onTechStackProfileChange,
	onCodingConventionsChange,
	onForbiddenChoicesChange,
	onClearFieldError,
	onKeyLabelAdd,
	keyLabelMap,
}: TechStackProps) {
	const techStackText = techStackProfile ?? "";
	const conventionsText = codingConventions ?? "";
	const forbiddenText = forbiddenChoices ?? "";

	if (!isEditing) {
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

	return (
		<div className="space-y-6">
			<HierarchicalEditor
				label="技術スタック"
				value={techStackText}
				onChange={(value) => {
					onTechStackProfileChange?.(value);
					onClearFieldError?.("techStackProfileText");
				}}
				placeholder={"例: frontend:\n  framework: Next.js\n  language: TypeScript"}
				required
				helperText="技術スタックを階層的に入力できます。既存のデータは自動的に変換されます。"
				onKeyAdd={onKeyLabelAdd}
			/>
			<HierarchicalEditor
				label="コーディング規約"
				value={conventionsText}
				onChange={(value) => {
					onCodingConventionsChange?.(value);
					onClearFieldError?.("codingConventionsText");
				}}
				placeholder={"例: naming:\n  files: kebab-case\n  functions: camelCase"}
				helperText="コーディング規約を階層的に入力できます。"
				onKeyAdd={onKeyLabelAdd}
			/>
			<HierarchicalEditor
				label="除外・禁止事項"
				value={forbiddenText}
				onChange={(value) => {
					onForbiddenChoicesChange?.(value);
					onClearFieldError?.("forbiddenChoicesText");
				}}
				placeholder={"例: must_not_use:\n  libraries:\n    - jQuery\n  patterns:\n    - var"}
				helperText="禁止ライブラリやパターンを階層的に入力できます。"
				onKeyAdd={onKeyLabelAdd}
			/>
		</div>
	);
}
