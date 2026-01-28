/**
 * デザインシステム編集
 */

"use client";

import { MarkdownTextareaEdit } from "./markdown-textarea-edit";

interface DesignSystemEditProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function DesignSystemEdit({ value, onChange, error }: DesignSystemEditProps) {
	return (
		<MarkdownTextareaEdit
			label="デザインシステム"
			value={value}
			onChange={onChange}
			placeholder="カラー、タイポグラフィ、コンポーネント方針&#10;&#10;例:&#10;- カラー: ブルー系をプライマリカラー&#10;- タイポグラフィ: Noto Sans JP、基本14px&#10;- コンポーネント: shadcn/uiベース"
			error={error}
		/>
	);
}
