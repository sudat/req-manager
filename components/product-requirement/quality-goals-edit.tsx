/**
 * 品質目標編集
 */

"use client";

import { MarkdownTextareaEdit } from "./markdown-textarea-edit";

interface QualityGoalsEditProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function QualityGoalsEdit({ value, onChange, error }: QualityGoalsEditProps) {
	return (
		<MarkdownTextareaEdit
			label="品質目標"
			value={value}
			onChange={onChange}
			placeholder="性能、可用性、セキュリティなど&#10;&#10;例:&#10;- ページ読み込み: 2秒以内&#10;- エラー率: 0.1%以下&#10;- データ保護: GDPR準拠"
			error={error}
		/>
	);
}
