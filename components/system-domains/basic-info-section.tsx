"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { SystemFunction } from "@/lib/domain";

interface FunctionSummaryCardProps {
	srf: SystemFunction;
	domainId: string;
}

export function FunctionSummaryCard({ srf, domainId }: FunctionSummaryCardProps): React.ReactNode {
	return (
		<Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
			<CardContent className="p-3 space-y-2">
				<div className="flex items-center gap-3 text-[12px] text-slate-500">
					<span className="font-mono">{domainId}</span>
					<span className="text-slate-300">/</span>
					<span className="font-mono">{srf.id}</span>
				</div>

				<h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
					{srf.title}
				</h2>

				<p className="text-[14px] text-slate-700 leading-relaxed">
					{srf.summary}
				</p>

				<div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-slate-100 text-[13px]">
					<div>
						<span className="text-slate-500">機能分類</span>
						<span className="ml-2 text-slate-900">{srf.category}</span>
					</div>
					<div>
						<span className="text-slate-500">ステータス</span>
						<span className="ml-2 text-slate-900">{srf.status}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
