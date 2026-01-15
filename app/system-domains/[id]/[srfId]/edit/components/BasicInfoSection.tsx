"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
	designDocNo: string;
	category: SrfCategory;
	status: SrfStatus;
	title: string;
	summary: string;
	onDesignDocNoChange: (value: string) => void;
	onCategoryChange: (value: SrfCategory) => void;
	onStatusChange: (value: SrfStatus) => void;
	onTitleChange: (value: string) => void;
	onSummaryChange: (value: string) => void;
}

// ============================================
// コンポーネント
// ============================================

export function BasicInfoSection({
	systemFunctionId,
	designDocNo,
	category,
	status,
	title,
	summary,
	onDesignDocNoChange,
	onCategoryChange,
	onStatusChange,
	onTitleChange,
	onSummaryChange,
}: BasicInfoSectionProps) {
	return (
		<Card className="rounded-md border border-slate-200/60 bg-white mb-4">
			<CardContent className="p-6">
				<h2 className="text-[20px] font-semibold text-slate-900 mb-4">
					基本情報
				</h2>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>システム機能ID</Label>
						<Input value={systemFunctionId} disabled />
						<p className="text-xs text-slate-500">IDは変更できません</p>
					</div>

					<div className="space-y-2">
						<Label>
							設計書No<span className="text-rose-500">*</span>
						</Label>
						<Input
							value={designDocNo}
							onChange={(e) => onDesignDocNoChange(e.target.value)}
							placeholder="DD-TASK-001-001"
						/>
					</div>

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
					<Label>
						機能概要<span className="text-rose-500">*</span>
					</Label>
					<Textarea
						value={summary}
						onChange={(e) => onSummaryChange(e.target.value)}
						placeholder="機能の概要を入力"
						className="min-h-[100px]"
					/>
				</div>
			</CardContent>
		</Card>
	);
}
