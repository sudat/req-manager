"use client";

import { MarkdownFieldView } from "./markdown-field-view";

type BasicInfoViewProps = {
	targetUsers: string;
	experienceGoals: string;
	qualityGoals: string;
	designSystem: string;
	uxGuidelines: string;
};

export function BasicInfoView({
	targetUsers,
	experienceGoals,
	qualityGoals,
	designSystem,
	uxGuidelines,
}: BasicInfoViewProps) {
	return (
		<div className="space-y-6">
			<MarkdownFieldView label="ターゲットユーザー" content={targetUsers} />
			<MarkdownFieldView label="体験目標" content={experienceGoals} />
			<MarkdownFieldView label="品質目標" content={qualityGoals} />
			<MarkdownFieldView label="デザインシステム" content={designSystem} />
			<MarkdownFieldView label="UXガイドライン" content={uxGuidelines} />
		</div>
	);
}
