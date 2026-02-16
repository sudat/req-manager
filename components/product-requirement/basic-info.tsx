"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MarkdownFieldView } from "./markdown-field-view";

type BasicInfoProps = {
	isEditing: boolean;
	targetUsers: string;
	experienceGoals: string;
	qualityGoals: string;
	designSystem: string;
	uxGuidelines: string;
	fieldErrors?: Record<string, string>;
	onTargetUsersChange?: (value: string) => void;
	onExperienceGoalsChange?: (value: string) => void;
	onQualityGoalsChange?: (value: string) => void;
	onDesignSystemChange?: (value: string) => void;
	onUxGuidelinesChange?: (value: string) => void;
	onClearFieldError?: (key: string) => void;
};

export function BasicInfo({
	isEditing,
	targetUsers,
	experienceGoals,
	qualityGoals,
	designSystem,
	uxGuidelines,
	fieldErrors = {},
	onTargetUsersChange,
	onExperienceGoalsChange,
	onQualityGoalsChange,
	onDesignSystemChange,
	onUxGuidelinesChange,
	onClearFieldError,
}: BasicInfoProps) {
	if (!isEditing) {
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

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Label>ターゲットユーザー</Label>
				<Textarea
					value={targetUsers}
					onChange={(e) => {
						onTargetUsersChange?.(e.target.value);
						onClearFieldError?.("targetUsers");
					}}
					className="min-h-[120px]"
					placeholder="ペルソナ、利用シーン、前提知識など"
				/>
				{fieldErrors.targetUsers && (
					<p className="text-xs text-rose-600">{fieldErrors.targetUsers}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label>体験目標</Label>
				<Textarea
					value={experienceGoals}
					onChange={(e) => {
						onExperienceGoalsChange?.(e.target.value);
						onClearFieldError?.("experienceGoals");
					}}
					className="min-h-[120px]"
					placeholder="ユーザーが得たい価値や行動変容"
				/>
				{fieldErrors.experienceGoals && (
					<p className="text-xs text-rose-600">{fieldErrors.experienceGoals}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label>品質目標</Label>
				<Textarea
					value={qualityGoals}
					onChange={(e) => {
						onQualityGoalsChange?.(e.target.value);
						onClearFieldError?.("qualityGoals");
					}}
					className="min-h-[120px]"
					placeholder="性能、可用性、セキュリティなど"
				/>
				{fieldErrors.qualityGoals && (
					<p className="text-xs text-rose-600">{fieldErrors.qualityGoals}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label>デザインシステム</Label>
				<Textarea
					value={designSystem}
					onChange={(e) => {
						onDesignSystemChange?.(e.target.value);
						onClearFieldError?.("designSystem");
					}}
					className="min-h-[120px]"
					placeholder="カラー、タイポグラフィ、コンポーネント方針"
				/>
				{fieldErrors.designSystem && (
					<p className="text-xs text-rose-600">{fieldErrors.designSystem}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label>UXガイドライン</Label>
				<Textarea
					value={uxGuidelines}
					onChange={(e) => {
						onUxGuidelinesChange?.(e.target.value);
						onClearFieldError?.("uxGuidelines");
					}}
					className="min-h-[120px]"
					placeholder="操作性、フィードバック、エラー表示方針"
				/>
				{fieldErrors.uxGuidelines && (
					<p className="text-xs text-rose-600">{fieldErrors.uxGuidelines}</p>
				)}
			</div>
		</div>
	);
}
