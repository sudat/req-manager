/**
 * ターゲットユーザー編集
 */

"use client";

import { MarkdownTextareaEdit } from "./markdown-textarea-edit";

interface TargetUsersEditProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function TargetUsersEdit({ value, onChange, error }: TargetUsersEditProps) {
	return (
		<MarkdownTextareaEdit
			label="ターゲットユーザー"
			value={value}
			onChange={onChange}
			placeholder="ペルソナ、利用シーン、前提知識など&#10;&#10;例:&#10;- ペルソナ: 20代〜40代のビジネスパーソン&#10;- 利用シーン: 通勤中や休憩時間にスマートフォンで閲覧&#10;- 前提知識: 基本的なスマートフォン操作に習熟している"
			error={error}
		/>
	);
}
