"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { SrfCategory, SrfStatus } from "@/lib/domain";

// ============================================
// 型定義
// ============================================

interface BasicInfoSectionProps {
	systemFunctionId: string;
	category: SrfCategory;
	status: SrfStatus;
	title: string;
	summary: string;
	designPolicy: string;
	onCategoryChange: (value: SrfCategory) => void;
	onStatusChange: (value: SrfStatus) => void;
	onTitleChange: (value: string) => void;
	onSummaryChange: (value: string) => void;
	onDesignPolicyChange: (value: string) => void;
}

// ============================================
// コンポーネント
// ============================================

export function BasicInfoSection({
	systemFunctionId,
	category,
	status,
	title,
	summary,
	designPolicy,
	onCategoryChange,
	onStatusChange,
	onTitleChange,
	onSummaryChange,
	onDesignPolicyChange,
}: BasicInfoSectionProps) {
	return (
		<div className="space-y-4">
			<div className="border-l-4 border-brand-600 pl-3 mb-8">
				<h2 className="text-[18px] font-semibold text-slate-900">
					基本情報
				</h2>
			</div>
			
			{/* IDは全幅 */}
			<div className="space-y-2">
				<Label>システム機能ID</Label>
				<Input value={systemFunctionId} disabled />
			</div>
			
			{/* 分類とステータスは2カラム */}
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>
						機能分類<span className="text-rose-500">*</span>
					</Label>
					<Select
						value={category}
						onValueChange={(value) => onCategoryChange(value as SrfCategory)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="screen">画面（screen）</SelectItem>
							<SelectItem value="internal">内部処理（internal）</SelectItem>
							<SelectItem value="interface">
								インターフェース（interface）
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>
						ステータス<span className="text-rose-500">*</span>
					</Label>
					<Select
						value={status}
						onValueChange={(value) => onStatusChange(value as SrfStatus)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="not_implemented">未実装</SelectItem>
							<SelectItem value="implementing">実装中</SelectItem>
							<SelectItem value="testing">テスト中</SelectItem>
							<SelectItem value="implemented">実装済</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

				<div className="mt-4 space-y-2">
					<Label>
						機能名<span className="text-rose-500">*</span>
					</Label>
					<Input
						value={title}
						onChange={(e) => onTitleChange(e.target.value)}
						placeholder="例：請求書発行機能"
					/>
				</div>

				<div className="mt-4 space-y-2">
					<div className="flex items-center justify-between">
						<Label>
							機能概要<span className="text-rose-500">*</span>
						</Label>
						<Badge
							variant="outline"
							className="text-[10px] px-1.5 py-0 h-5 border-blue-200 bg-blue-50 text-blue-700"
						>
							Markdown
						</Badge>
					</div>
					<Textarea
						value={summary}
						onChange={(e) => onSummaryChange(e.target.value)}
						placeholder="機能の概要を入力"
						className="min-h-[100px]"
					/>
				</div>

				<div className="mt-4 space-y-2">
					<div className="flex items-center justify-between">
						<Label>設計方針</Label>
						<Badge
							variant="outline"
							className="text-[10px] px-1.5 py-0 h-5 border-blue-200 bg-blue-50 text-blue-700"
						>
							Markdown
						</Badge>
					</div>
					<Textarea
						value={designPolicy}
						onChange={(e) => onDesignPolicyChange(e.target.value)}
						placeholder="複数のDDにまたがる設計方針を入力"
						className="min-h-[120px]"
					/>
				</div>
		</div>
	);
}
