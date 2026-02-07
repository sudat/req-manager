import { Bot, FilePlus, MessagesSquare } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import type { BrDraft, BtDraft, ChatMessage, DraftCommitState, SfDraft, SrDraft, DdDraft } from "./types";

type ChatMessagesProps = {
	messages: ChatMessage[];
	isLoading?: boolean;
	onToggleHistory?: () => void;
	onNewChat?: () => void;
	onCommitDraft?: (payload: {
		messageId: string;
		type: "bt" | "br" | "sf" | "sr" | "dd";
		code: string;
		content: BtDraft | BrDraft | SfDraft | SrDraft | DdDraft;
	}) => void;
	getCommitState?: (
		messageId: string,
		type: "bt" | "br" | "sf" | "sr" | "dd",
		code: string,
	) => DraftCommitState | undefined;
};

/**
 * チャットメッセージ表示エリア
 *
 * ユーザーとアシスタントのメッセージを時系列で表示する。
 */
export function ChatMessages({
	messages,
	isLoading,
	onToggleHistory,
	onNewChat,
	onCommitDraft,
	getCommitState,
}: ChatMessagesProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	// アクションボタンを共通化
	const actionButtons = (
		<TooltipProvider>
			<div className="absolute top-3 left-3 z-10 flex gap-2">
				{onToggleHistory && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={onToggleHistory}
								className="h-9 w-9 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
								aria-label="チャット履歴を開く"
							>
								<MessagesSquare className="h-5 w-5 text-slate-600" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>チャット履歴</TooltipContent>
					</Tooltip>
				)}
				{onNewChat && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={onNewChat}
								className="h-9 w-9 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
								aria-label="新規チャットを開始"
							>
								<FilePlus className="h-5 w-5 text-slate-600" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>新規チャット</TooltipContent>
					</Tooltip>
				)}
			</div>
		</TooltipProvider>
	);

	if (messages.length === 0 && !isLoading) {
		return (
			<div className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center px-6 py-12">
				{/* アクションボタン - 左上に配置（空状態でも表示） */}
				{(onToggleHistory || onNewChat) && actionButtons}
				<div className="text-center max-w-md">
					<Bot className="h-12 w-12 text-slate-300 mx-auto mb-4" />
					<h3 className="text-[16px] font-medium text-slate-700 mb-2">
						AI要件アシスタント
					</h3>
					<p className="text-[13px] text-slate-500">
						業務タスク、業務要件、システム要件の登録や品質チェックをお手伝いします。
						<br />
						メッセージを入力するか、クイックアクションからお選びください。
					</p>
				</div>
			</div>
		);
	}

	// ストリーミング中のアシスタントメッセージがあるか判定
	const hasStreamingMessage = messages.some(
		(m) => m.role === "assistant" && m.isStreaming,
	);

	return (
		<div ref={containerRef} className="relative px-6 py-4">
			{/* アクションボタン - 左上に配置 */}
			{(onToggleHistory || onNewChat) && actionButtons}
			<div className="max-w-3xl mx-auto pt-8">
				{messages.map((message, index) => {
					const prevMessage = index > 0 ? messages[index - 1] : null;
					const isRoleChanged =
						prevMessage && prevMessage.role !== message.role;
					return (
						<div
							key={message.id}
							className={cn(
								"transition-all duration-300 ease-out",
								isRoleChanged ? "mt-8" : "mt-4",
							)}
						>
							<MessageBubble
								message={message}
								onCommitDraft={onCommitDraft}
								getCommitState={getCommitState}
							/>
						</div>
					);
				})}
				{isLoading && !hasStreamingMessage && (
					<div className="flex gap-3">
						<div className="flex-shrink-0">
							<div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center">
								<Bot className="h-4 w-4 text-white" />
							</div>
						</div>
						<div className="flex-1">
							<div className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-100">
								<div className="flex gap-1">
									<div
										className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
										style={{ animationDelay: "0ms" }}
									/>
									<div
										className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
										style={{ animationDelay: "150ms" }}
									/>
									<div
										className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
										style={{ animationDelay: "300ms" }}
									/>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
