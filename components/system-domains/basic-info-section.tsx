"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { SystemFunction } from "@/lib/domain";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Layers2, CircleCheck } from "lucide-react";

const statusLabels: Record<string, string> = {
	not_implemented: "未実装",
	implementing: "実装中",
	testing: "テスト中",
	implemented: "実装済",
};

const categoryLabels: Record<string, string> = {
	screen: "画面",
	internal: "内部",
	interface: "IF",
};

interface FunctionSummaryCardProps {
	srf: SystemFunction;
	domainId: string;
}

export function FunctionSummaryCard({ srf, domainId }: FunctionSummaryCardProps): React.ReactNode {
	return (
		<Card className="rounded-md border border-slate-200/60 shadow-sm hover:border-slate-300/60 transition-colors">
			<CardContent className="p-6 space-y-3">
				<div className="id-label--brand">
					<span>{domainId}</span>
					<span className="text-slate-300 mx-1">/</span>
					<span>{srf.id}</span>
				</div>

				<h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
					{srf.title}
				</h2>

				<div className="text-[14px] text-slate-700 leading-relaxed">
					<MarkdownRenderer content={srf.summary} />
				</div>

				{srf.designPolicy && srf.designPolicy.trim().length > 0 && (
					<div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
						<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
							設計方針
						</div>
						<div className="text-[13px] text-slate-700 leading-relaxed">
							<MarkdownRenderer content={srf.designPolicy} />
						</div>
					</div>
				)}

				<div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
					<div className="flex items-center gap-2 text-[13px]">
						<Layers2 className="h-4 w-4 text-slate-400" />
						<span className="text-slate-500">機能分類</span>
						<span className="text-slate-900">{categoryLabels[srf.category]}</span>
					</div>
					<div className="flex items-center gap-2 text-[13px]">
						<CircleCheck className="h-4 w-4 text-slate-400" />
						<span className="text-slate-500">ステータス</span>
						<span className="text-slate-900">{statusLabels[srf.status]}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
