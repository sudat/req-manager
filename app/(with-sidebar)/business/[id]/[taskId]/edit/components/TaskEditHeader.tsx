"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, RotateCcw, Loader2 } from "lucide-react";

type TaskEditHeaderProps = {
	bizId: string;
	taskId: string;
	isLoading: boolean;
	isSaving: boolean;
	canSave: boolean;
	onReset: () => void;
	onSave: () => void;
};

/**
 * タスク編集ページのヘッダーコンポーネント
 * 戻るリンク・リセットボタン・保存ボタンを含む
 */
export function TaskEditHeader({
	bizId,
	taskId,
	isLoading,
	isSaving,
	canSave,
	onReset,
	onSave,
}: TaskEditHeaderProps) {
	return (
		<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
			<Link
				href={`/business/${bizId}/${taskId}`}
				className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900"
			>
				<ArrowLeft className="h-4 w-4" />
				業務タスク詳細に戻る
			</Link>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					className="h-8 gap-2 text-[14px]"
					onClick={onReset}
					disabled={isLoading || isSaving}
				>
					<RotateCcw className="h-4 w-4" />
					リセット
				</Button>
				<Button
					className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800"
					onClick={onSave}
					disabled={isLoading || isSaving || !canSave}
				>
					{isSaving ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							保存中...
						</>
					) : (
						<>
							<Save className="h-4 w-4" />
							保存
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
