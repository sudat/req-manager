"use client";

import { HierarchicalEditor } from "@/components/forms/hierarchical-editor";

type TechStackEditProps = {
	techStackProfileText: string;
	codingConventionsText: string;
	forbiddenChoicesText: string;
	onTechStackProfileChange: (value: string) => void;
	onCodingConventionsChange: (value: string) => void;
	onForbiddenChoicesChange: (value: string) => void;
	onClearFieldError: (key: string) => void;
	onKeyLabelAdd: (key: string, logicalLabel: string) => void;
};

export function TechStackEdit({
	techStackProfileText,
	codingConventionsText,
	forbiddenChoicesText,
	onTechStackProfileChange,
	onCodingConventionsChange,
	onForbiddenChoicesChange,
	onClearFieldError,
	onKeyLabelAdd,
}: TechStackEditProps) {
	return (
		<div className="space-y-6">
			<HierarchicalEditor
				label="技術スタック"
				value={techStackProfileText}
				onChange={(value) => {
					onTechStackProfileChange(value);
					onClearFieldError("techStackProfileText");
				}}
				placeholder={"例: frontend:\n  framework: Next.js\n  language: TypeScript"}
				required
				helperText="技術スタックを階層的に入力できます。既存のデータは自動的に変換されます。"
				onKeyAdd={onKeyLabelAdd}
			/>
			<HierarchicalEditor
				label="コーディング規約"
				value={codingConventionsText}
				onChange={(value) => {
					onCodingConventionsChange(value);
					onClearFieldError("codingConventionsText");
				}}
				placeholder={"例: naming:\n  files: kebab-case\n  functions: camelCase"}
				helperText="コーディング規約を階層的に入力できます。"
				onKeyAdd={onKeyLabelAdd}
			/>
			<HierarchicalEditor
				label="除外・禁止事項"
				value={forbiddenChoicesText}
				onChange={(value) => {
					onForbiddenChoicesChange(value);
					onClearFieldError("forbiddenChoicesText");
				}}
				placeholder={"例: must_not_use:\n  libraries:\n    - jQuery\n  patterns:\n    - var"}
				helperText="禁止ライブラリやパターンを階層的に入力できます。"
				onKeyAdd={onKeyLabelAdd}
			/>
		</div>
	);
}
