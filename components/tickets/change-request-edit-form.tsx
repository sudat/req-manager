"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ChangeRequestPriority, ChangeRequestStatus } from "@/lib/domain/value-objects";
import type { SelectedRequirement } from "@/components/tickets/impact-scope-selector";
import { ImpactScopeSelector } from "@/components/tickets/impact-scope-selector";

// ========================================
// Type Definitions
// ========================================

export interface ChangeRequestEditFormProps {
	// フォーム値
	title: string;
	onTitleChange: (value: string) => void;
	description: string;
	onDescriptionChange: (value: string) => void;
	background: string;
	onBackgroundChange: (value: string) => void;
	expectedBenefit: string;
	onExpectedBenefitChange: (value: string) => void;
	status: ChangeRequestStatus;
	onStatusChange: (value: ChangeRequestStatus) => void;
	priority: ChangeRequestPriority;
	onPriorityChange: (value: ChangeRequestPriority) => void;

	// 影響範囲
	selectedRequirements: SelectedRequirement[];
	onSelectionChange: (requirements: SelectedRequirement[]) => void;

	// UI状態
	submitting: boolean;
	error: string | null;
	changeRequestId: string;

	// アクション
	onSubmit: (e: React.FormEvent) => void | Promise<void>;
}

// ========================================
// Component
// ========================================

/**
 * 変更要求編集フォームコンポーネント
 */
export function ChangeRequestEditForm({
	title,
	onTitleChange,
	description,
	onDescriptionChange,
	background,
	onBackgroundChange,
	expectedBenefit,
	onExpectedBenefitChange,
	status,
	onStatusChange,
	priority,
	onPriorityChange,
	selectedRequirements,
	onSelectionChange,
	submitting,
	error,
	changeRequestId,
	onSubmit,
}: ChangeRequestEditFormProps) {
	return (
		<form onSubmit={onSubmit} className="space-y-6">
			{/* 基本情報カード */}
			<Card className="p-6">
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>
							タイトル<span className="text-rose-500">*</span>
						</Label>
						<Input
							value={title}
							onChange={(e) => onTitleChange(e.target.value)}
							required
							disabled={submitting}
						/>
					</div>

					<div className="space-y-2">
						<Label>背景・目的</Label>
						<Textarea
							value={background}
							onChange={(e) => onBackgroundChange(e.target.value)}
							className="min-h-[100px]"
							disabled={submitting}
						/>
					</div>

					<div className="space-y-2">
						<Label>説明</Label>
						<Textarea
							value={description}
							onChange={(e) => onDescriptionChange(e.target.value)}
							className="min-h-[100px]"
							disabled={submitting}
						/>
					</div>

					<div className="space-y-2">
						<Label>期待効果</Label>
						<Textarea
							value={expectedBenefit}
							onChange={(e) => onExpectedBenefitChange(e.target.value)}
							className="min-h-[80px]"
							disabled={submitting}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>ステータス</Label>
							<Select
								value={status}
								onValueChange={(v) => onStatusChange(v as ChangeRequestStatus)}
								disabled={submitting}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="open">オープン</SelectItem>
									<SelectItem value="review">レビュー中</SelectItem>
									<SelectItem value="approved">承認済</SelectItem>
									<SelectItem value="applied">適用済</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>優先度</Label>
							<Select
								value={priority}
								onValueChange={(v) => onPriorityChange(v as ChangeRequestPriority)}
								disabled={submitting}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="low">低</SelectItem>
									<SelectItem value="medium">中</SelectItem>
									<SelectItem value="high">高</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</Card>

			{/* エラー表示 */}
			{error && (
				<Card className="p-4 border-rose-200 bg-rose-50">
					<p className="text-sm text-rose-600">{error}</p>
				</Card>
			)}

			{/* 影響範囲セレクタ */}
			<div className="space-y-2">
				<Label>影響範囲の選択</Label>
				<ImpactScopeSelector
					changeRequestId={changeRequestId}
					initialSelection={selectedRequirements}
					onSelectionChange={onSelectionChange}
					readonly={submitting}
				/>
			</div>

			{/* アクションボタン */}
			<div className="flex gap-3">
				<Link href={`/tickets/${changeRequestId}`}>
					<Button type="button" variant="outline" disabled={submitting}>
						キャンセル
					</Button>
				</Link>
				<Button
					type="submit"
					className="bg-slate-900 hover:bg-slate-800"
					disabled={submitting}
				>
					{submitting ? "保存中..." : "保存"}
				</Button>
			</div>
		</form>
	);
}
