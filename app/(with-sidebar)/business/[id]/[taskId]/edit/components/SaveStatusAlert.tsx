"use client";

import { Loader2, AlertCircle } from "lucide-react";

type SaveStatusAlertProps = {
	isLoading: boolean;
	saveError: string | null;
};

/**
 * 保存状態アラートコンポーネント
 * ローディング中・エラー時の表示を行う
 */
export function SaveStatusAlert({ isLoading, saveError }: SaveStatusAlertProps) {
	return (
		<>
			{/* ローディング表示 */}
			{isLoading && (
				<div className="mb-6 flex items-center gap-2 text-[13px] text-slate-500">
					<Loader2 className="h-4 w-4 animate-spin" />
					データを読み込み中...
				</div>
			)}

			{/* エラー表示 */}
			{saveError && (
				<div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2">
					<AlertCircle className="h-4 w-4 text-rose-600 mt-0.5" />
					<div className="text-[13px] text-rose-700">保存エラー: {saveError}</div>
				</div>
			)}
		</>
	);
}
