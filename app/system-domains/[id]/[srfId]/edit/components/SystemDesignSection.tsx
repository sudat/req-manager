"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { getDesignCategoryLabel } from "@/lib/data/system-functions";
import type {
	DesignItemCategory,
	SystemDesignItem,
} from "@/lib/mock/data/types";
import type { NewDesignItem } from "../hooks/useSystemFunctionForm";

// ============================================
// 型定義
// ============================================

interface SystemDesignSectionProps {
	systemDesign: SystemDesignItem[];
	newDesignItem: NewDesignItem;
	onNewDesignItemChange: (item: NewDesignItem) => void;
	onAddDesignItem: () => void;
	onRemoveDesignItem: (itemId: string) => void;
}

// ============================================
// サブコンポーネント: 設計項目カード
// ============================================

interface DesignItemCardProps {
	item: SystemDesignItem;
	onRemove: () => void;
}

function DesignItemCard({ item, onRemove }: DesignItemCardProps) {
	return (
		<div className="rounded-md border border-slate-200 bg-slate-50/50 p-4">
			<div className="flex items-start justify-between mb-2">
				<div className="flex items-center gap-2">
					<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
						{getDesignCategoryLabel(item.category)}
					</span>
					<span className="text-[11px] text-slate-400 font-mono">{item.id}</span>
					{item.priority === "high" && (
						<span className="text-[11px] font-medium text-red-600">重要</span>
					)}
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onRemove}
					className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
			<div className="text-[13px] font-medium text-slate-900 mb-1">
				{item.title}
			</div>
			<div className="text-[13px] text-slate-600 leading-relaxed">
				{item.description}
			</div>
		</div>
	);
}

// ============================================
// サブコンポーネント: 新規設計項目フォーム
// ============================================

interface AddDesignItemFormProps {
	newDesignItem: NewDesignItem;
	onChange: (item: NewDesignItem) => void;
	onAdd: () => void;
}

function AddDesignItemForm({
	newDesignItem,
	onChange,
	onAdd,
}: AddDesignItemFormProps) {
	const canAdd = newDesignItem.title && newDesignItem.description;

	return (
		<div className="border-t border-slate-200 pt-4">
			<h3 className="text-[13px] font-semibold text-slate-900 mb-3">
				設計項目を追加
			</h3>
			<div className="grid gap-3 md:grid-cols-2">
				<div className="space-y-1">
					<Label className="text-xs">カテゴリ</Label>
					<Select
						value={newDesignItem.category}
						onValueChange={(value) =>
							onChange({
								...newDesignItem,
								category: value as DesignItemCategory,
							})
						}
					>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="database">データベース設計</SelectItem>
							<SelectItem value="api">API設計</SelectItem>
							<SelectItem value="logic">ビジネスロジック</SelectItem>
							<SelectItem value="ui">UI/画面設計</SelectItem>
							<SelectItem value="integration">外部連携</SelectItem>
							<SelectItem value="batch">バッチ処理</SelectItem>
							<SelectItem value="error_handling">エラーハンドリング</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					<Label className="text-xs">優先度</Label>
					<Select
						value={newDesignItem.priority}
						onValueChange={(value) =>
							onChange({
								...newDesignItem,
								priority: value as "high" | "medium" | "low",
							})
						}
					>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="high">高</SelectItem>
							<SelectItem value="medium">中</SelectItem>
							<SelectItem value="low">低</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="mt-3 space-y-1">
				<Label className="text-xs">タイトル</Label>
				<Input
					value={newDesignItem.title}
					onChange={(e) =>
						onChange({ ...newDesignItem, title: e.target.value })
					}
					placeholder="設計項目のタイトル"
					className="h-9"
				/>
			</div>

			<div className="mt-3 space-y-1">
				<Label className="text-xs">説明</Label>
				<Textarea
					value={newDesignItem.description}
					onChange={(e) =>
						onChange({
							...newDesignItem,
							description: e.target.value,
						})
					}
					placeholder="設計項目の説明"
					className="min-h-[80px]"
				/>
			</div>

			<div className="mt-3">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onAdd}
					disabled={!canAdd}
					className="h-8"
				>
					<Plus className="h-4 w-4 mr-1" />
					追加
				</Button>
			</div>
		</div>
	);
}

// ============================================
// メインコンポーネント
// ============================================

export function SystemDesignSection({
	systemDesign,
	newDesignItem,
	onNewDesignItemChange,
	onAddDesignItem,
	onRemoveDesignItem,
}: SystemDesignSectionProps) {
	return (
		<Card className="rounded-md border border-slate-200/60 bg-white mb-4">
			<CardContent className="p-6">
				<h2 className="text-[15px] font-semibold text-slate-900 mb-4">
					システム設計
				</h2>

				{/* 既存の設計項目一覧 */}
				<div className="space-y-3 mb-4">
					{systemDesign.map((item) => (
						<DesignItemCard
							key={item.id}
							item={item}
							onRemove={() => onRemoveDesignItem(item.id)}
						/>
					))}
					{systemDesign.length === 0 && (
						<div className="text-[13px] text-slate-500 text-center py-8">
							設計項目がありません
						</div>
					)}
				</div>

				{/* 新規設計項目追加フォーム */}
				<AddDesignItemForm
					newDesignItem={newDesignItem}
					onChange={onNewDesignItemChange}
					onAdd={onAddDesignItem}
				/>
			</CardContent>
		</Card>
	);
}
