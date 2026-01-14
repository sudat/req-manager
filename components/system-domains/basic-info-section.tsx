"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLabel } from "./section-card";
import type { SystemFunction } from "@/lib/mock/data/types";

interface BasicInfoSectionProps {
	srf: SystemFunction;
}

export function BasicInfoSection({ srf }: BasicInfoSectionProps): React.ReactNode {
	return (
		<Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
			<CardContent className="p-0">
				<div className="px-4 py-2.5 border-b border-slate-100">
					<h2 className="text-[15px] font-semibold text-slate-900">基本情報</h2>
				</div>
				<div className="p-4 space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<InfoBox label="システム機能ID" value={srf.id} mono />
						<InfoBox label="設計書No" value={srf.designDocNo} />
					</div>

					<div className="flex gap-3">
						<LabeledBadge label="機能分類" value={srf.category} />
						<LabeledBadge label="ステータス" value={srf.status} />
					</div>

					<div className="space-y-1.5">
						<SectionLabel>機能名</SectionLabel>
						<div className="text-[16px] font-semibold text-slate-900">
							{srf.title}
						</div>
					</div>

					<div className="space-y-1.5">
						<SectionLabel>説明</SectionLabel>
						<div className="text-[13px] text-slate-700 leading-relaxed">
							{srf.summary}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function InfoBox({ label, value, mono }: { label: string; value: string; mono?: boolean }): React.ReactNode {
	const textClass = mono ? "mt-1 text-[14px] font-semibold text-slate-900 font-mono" : "mt-1 text-[13px] font-semibold text-slate-900";
	return (
		<div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
			<SectionLabel>{label}</SectionLabel>
			<div className={textClass}>{value}</div>
		</div>
	);
}

function LabeledBadge({ label, value }: { label: string; value: string }): React.ReactNode {
	return (
		<div>
			<SectionLabel className="mb-1.5">{label}</SectionLabel>
			<Badge
				variant="outline"
				className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
			>
				{value}
			</Badge>
		</div>
	);
}
