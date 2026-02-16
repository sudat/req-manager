"use client";

import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
	message: string;
	createHref: string;
	aiChatHref?: string;
	icon?: React.ReactNode;
}

/**
 * 空状態表示コンポーネント
 * データがない場合にアクションを誘導する
 */
export function EmptyState({ message, createHref, aiChatHref, icon }: EmptyStateProps) {
	const router = useRouter();

	return (
		<div className="flex flex-col items-center justify-center py-16">
			{icon || <FileText className="h-12 w-12 text-slate-300 mb-4" />}
			<p className="text-slate-600 mb-6">{message}</p>
			<div className="flex gap-3">
				{aiChatHref && (
					<Button
						onClick={() => router.push(aiChatHref)}
						className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
					>
						AIで追加
					</Button>
				)}
				<Button variant="outline" onClick={() => router.push(createHref)}>
					手動で追加
				</Button>
			</div>
		</div>
	);
}
