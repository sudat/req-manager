"use client";

import type { ThreadSummary } from "./types";

type ThreadHistoryPanelProps = {
	isOpen: boolean;
	threads: ThreadSummary[];
	currentThreadId: string;
	onSelect: (threadId: string) => void;
	onClose: () => void;
};

/**
 * チャット履歴サイドバーパネル
 *
 * オーバーレイ＋スライドインアニメーション付きの履歴一覧を表示する。
 */
export function ThreadHistoryPanel({
	isOpen,
	threads,
	currentThreadId,
	onSelect,
	onClose,
}: ThreadHistoryPanelProps) {
	return (
		<div
			className={[
				"absolute inset-0 z-40 transition-opacity duration-300 ease-out",
				isOpen
					? "opacity-100 pointer-events-auto"
					: "opacity-0 pointer-events-none",
			].join(" ")}
			onClick={onClose}
			role="presentation"
		>
			<div className="absolute inset-0 bg-slate-900/5" />
			<div
				className={[
					"absolute left-0 top-0 h-full w-[280px] border-r border-slate-200 bg-white shadow-xl",
					"transform transition-transform duration-300 ease-out",
					isOpen ? "translate-x-0" : "-translate-x-full",
				].join(" ")}
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-label="チャット履歴"
			>
				<div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
					<div className="text-[13px] font-semibold text-slate-900">
						チャット履歴
					</div>
				</div>
				<div className="p-2">
					{threads.length === 0 ? (
						<div className="px-3 py-4 text-[12px] text-slate-500">
							まだ履歴がありません
						</div>
					) : (
						<div className="space-y-1">
							{threads.map((t) => (
								<button
									key={t.threadId}
									type="button"
									onClick={() => onSelect(t.threadId)}
									className={[
										"w-full rounded-md px-3 py-2 text-left transition",
										t.threadId === currentThreadId
											? "bg-slate-100"
											: "hover:bg-slate-50",
									].join(" ")}
								>
									<div className="text-[12px] font-medium text-slate-900 line-clamp-1">
										{t.title}
									</div>
									<div className="text-[11px] text-slate-500 font-mono">
										{new Date(t.updatedAt).toLocaleString()}
									</div>
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
