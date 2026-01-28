/**
 * UXガイドライン編集
 */

"use client";

import { MarkdownTextareaEdit } from "./markdown-textarea-edit";

interface UxGuidelinesEditProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function UxGuidelinesEdit({ value, onChange, error }: UxGuidelinesEditProps) {
	return (
		<MarkdownTextareaEdit
			label="UXガイドライン"
			value={value}
			onChange={onChange}
			placeholder="操作性、フィードバック、エラー表示方針&#10;&#10;例:&#10;- 操作: 3クリック以内で目的を達成&#10;- フィードバック: 即座の視覚的フィードバック&#10;- エラー: エラー原因と解決策を明示"
			error={error}
		/>
	);
}
