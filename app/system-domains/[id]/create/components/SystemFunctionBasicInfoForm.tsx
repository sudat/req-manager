"use client";

import type { SrfCategory, SrfStatus } from "@/lib/domain";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type SystemFunctionBasicInfoFormProps = {
	nextId: string;
	title: string;
	summary: string;
	category: SrfCategory;
	status: SrfStatus;
	onTitleChange: (title: string) => void;
	onSummaryChange: (summary: string) => void;
	onCategoryChange: (category: SrfCategory) => void;
	onStatusChange: (status: SrfStatus) => void;
};

/**
 * システム機能基本情報フォームコンポーネント
 */
export function SystemFunctionBasicInfoForm({
	nextId,
	title,
	summary,
	category,
	status,
	onTitleChange,
	onSummaryChange,
	onCategoryChange,
	onStatusChange,
}: SystemFunctionBasicInfoFormProps) {
	return (
		<>
			<div className="space-y-2">
				<Label>システム機能ID</Label>
				<Input value={nextId} disabled />
				<p className="text-xs text-slate-500">システム機能IDは保存時に自動採番されます</p>
			</div>

			<div className="space-y-2">
				<Label>
					機能名<span className="text-rose-500">*</span>
				</Label>
				<Input
					value={title}
					onChange={(event) => onTitleChange(event.target.value)}
					placeholder="例：請求書発行機能"
					required
				/>
			</div>

			<div className="space-y-2">
				<Label>
					機能概要<span className="text-rose-500">*</span>
				</Label>
				<Textarea
					value={summary}
					onChange={(event) => onSummaryChange(event.target.value)}
					placeholder="機能概要を入力"
					className="min-h-[120px]"
					required
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>機能分類</Label>
					<Select value={category} onValueChange={(value) => onCategoryChange(value as SrfCategory)}>
						<SelectTrigger>
							<SelectValue placeholder="機能分類を選択" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="screen">画面</SelectItem>
							<SelectItem value="internal">内部</SelectItem>
							<SelectItem value="interface">IF</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>ステータス</Label>
					<Select value={status} onValueChange={(value) => onStatusChange(value as SrfStatus)}>
						<SelectTrigger>
							<SelectValue placeholder="ステータスを選択" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="implemented">実装済</SelectItem>
							<SelectItem value="implementing">実装中</SelectItem>
							<SelectItem value="testing">テスト中</SelectItem>
							<SelectItem value="not_implemented">未実装</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
		</>
	);
}
