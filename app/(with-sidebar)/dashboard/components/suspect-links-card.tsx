"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listSuspectLinks } from "@/lib/data/requirement-links";
import { useProject } from "@/components/project/project-context";
import type { RequirementLink } from "@/lib/domain";

export interface SuspectLinksCardProps {
	projectId: string;
}

/**
 * 疑義リンク件数カード（Phase 4.7）
 *
 * 機能:
 * - listSuspectLinks()で件数を取得
 * - 既存のHealth Scoreカードのデザインに合わせる
 * - クリックで /links?filter=suspect へ遷移
 * - ローディング・エラー状態表示
 */
export function SuspectLinksCard({ projectId }: SuspectLinksCardProps): React.ReactNode {
	const [suspectLinks, setSuspectLinks] = useState<RequirementLink[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		async function fetchSuspectLinks(): Promise<void> {
			setLoading(true);
			setError(null);

			try {
				const links = await listSuspectLinks(projectId);
				if (!active) return;

				setSuspectLinks(links);
				setLoading(false);
			} catch (e) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
				setLoading(false);
			}
		}

		fetchSuspectLinks();
		return () => {
			active = false;
		};
	}, [projectId]);

	if (loading) {
		return (
			<Card className="rounded-md border border-slate-200 bg-white">
				<CardHeader className="border-b border-slate-100 px-4 py-3">
					<CardTitle className="text-[15px] font-semibold text-slate-900">
						疑義リンク
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4">
					<div className="flex items-center justify-center h-20">
						<div className="text-[12px] text-slate-400">読み込み中...</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="rounded-md border border-slate-200 bg-white">
				<CardHeader className="border-b border-slate-100 px-4 py-3">
					<CardTitle className="text-[15px] font-semibold text-slate-900">
						疑義リンク
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4">
					<div className="text-[12px] text-rose-600">{error}</div>
				</CardContent>
			</Card>
		);
	}

	const count = suspectLinks.length;
	const hasSuspectLinks = count > 0;

	return (
		<Link href="/links?filter=suspect" className="block">
			<Card
				className={`rounded-md border bg-white transition-colors ${
					hasSuspectLinks
						? "border-amber-200 hover:border-amber-300 hover:bg-amber-50/30"
						: "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
				}`}
			>
				<CardHeader className="border-b border-slate-100 px-4 py-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-[15px] font-semibold text-slate-900">
							疑義リンク
						</CardTitle>
						{hasSuspectLinks && (
							<Badge
								variant="outline"
								className="border-amber-200/60 bg-amber-50 text-amber-700 text-[12px] font-medium px-2 py-0.5"
							>
								{count}件
							</Badge>
						)}
					</div>
					<p className="text-[11px] text-slate-500 mt-0.5">
						要確認のBR↔SRリンク
					</p>
				</CardHeader>
				<CardContent className="p-4">
					{hasSuspectLinks ? (
						<div className="space-y-2">
							{/* 最新の疑義リンクを最大3件表示 */}
							{suspectLinks.slice(0, 3).map((link) => (
								<div
									key={link.id}
									className="flex items-start gap-2 text-[12px] text-slate-600"
								>
									<AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<div className="font-mono text-[11px] text-slate-500">
											{link.sourceType.toUpperCase()}({link.sourceId}) →{" "}
											{link.targetType.toUpperCase()}({link.targetId})
										</div>
										{link.suspectReason && (
											<div className="text-slate-600 truncate">
												{link.suspectReason}
											</div>
										)}
									</div>
								</div>
							))}
							{count > 3 && (
								<div className="text-[11px] text-slate-400 pt-1">
									他 {count - 3} 件...
								</div>
							)}
							<div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium mt-2">
								詳細を確認
								<ExternalLink className="h-3 w-3" />
							</div>
						</div>
					) : (
						<div className="flex items-center justify-center h-20">
							<div className="text-[12px] text-slate-400">
								疑義リンクはありません
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	);
}
