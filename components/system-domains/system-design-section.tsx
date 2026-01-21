"use client";

import { Badge } from "@/components/ui/badge";
import { SectionCard, EmptyState } from "./section-card";
import type { SystemDesignItem } from "@/lib/domain";
import { getDesignCategoryLabel } from "@/lib/data/system-functions";

interface SystemDesignSectionProps {
	systemDesign: SystemDesignItem[];
}

export function SystemDesignSection({ systemDesign }: SystemDesignSectionProps): React.ReactNode {
	return (
		<SectionCard title="システム設計" count={systemDesign.length}>
			{systemDesign.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-3">
					{systemDesign.map((item) => (
						<DesignItem key={item.id} item={item} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

function DesignItem({ item }: { item: SystemDesignItem }): React.ReactNode {
	return (
		<div className="rounded-md border border-slate-200 bg-slate-50/50 p-6">
			<div className="flex items-center gap-2 mb-2">
				<Badge
					variant="outline"
					className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2.5 py-1"
				>
					{getDesignCategoryLabel(item.category)}
				</Badge>
				<span className="text-[11px] text-slate-400 font-mono">{item.id}</span>
				{item.priority === "high" && (
					<Badge className="border-red-200/60 bg-red-50 text-red-700 text-[11px] font-medium px-2.5 py-1">
						重要
					</Badge>
				)}
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
