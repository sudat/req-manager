"use client";

import { SearchX, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type TaskNotFoundProps = {
	taskId: string;
	businessKey: string;
};

export function TaskNotFound({ taskId, businessKey }: TaskNotFoundProps) {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-4">
			<div className="bg-slate-100 rounded-full p-6 mb-6">
				<SearchX className="h-12 w-12 text-slate-400" />
			</div>
			<h2 className="text-xl font-semibold text-slate-900 mb-2">
				業務タスクが見つかりません
			</h2>
			<p className="text-sm text-slate-500 text-center max-w-md mb-2">
				指定された業務タスク「<span className="font-mono text-slate-700">{taskId}</span>」は存在しないか、削除された可能性があります。
			</p>
			<div className="flex items-center gap-2 text-xs text-slate-400 mb-8">
				<span className="font-mono bg-slate-100 px-2 py-1 rounded">{businessKey}</span>
				<span>/</span>
				<span className="font-mono bg-slate-100 px-2 py-1 rounded">{taskId}</span>
			</div>
			<div className="flex gap-3">
				<Link href={`/business/${businessKey}`}>
					<Button variant="outline" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						一覧に戻る
					</Button>
				</Link>
				<Link href={`/chat?screen=BT&bdId=${businessKey}&btId=${taskId}`}>
					<Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
						<Sparkles className="h-4 w-4" />
						AIで新規作成
					</Button>
				</Link>
			</div>
		</div>
	);
}

type TaskLoadingStatusProps = {
	loading: boolean;
	error: string | null;
	task: unknown | null;
};

export function TaskLoadingStatus({ loading, error, task }: TaskLoadingStatusProps) {
	if (loading) {
		return null;
	}
	if (error) {
		return <p className="text-[13px] text-rose-600 mb-3">{error}</p>;
	}
	return null;
}
