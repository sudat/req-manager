"use client";

import type { ReactNode } from "react";
import { FileCode2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionCard, EmptyState, SectionLabel } from "./section-card";
import type { ImplUnitSd } from "@/lib/domain";
import { toYamlText } from "@/lib/utils/yaml";
import {
	IMPL_UNIT_TYPE_LABELS,
	IMPL_UNIT_TYPE_COLORS,
	type ImplUnitType,
} from "@/lib/domain/enums";

interface ImplUnitSdSectionProps {
	items: ImplUnitSd[];
	loading: boolean;
	error: string | null;
}

export function ImplUnitSdSection({
	items,
	loading,
	error,
}: ImplUnitSdSectionProps): ReactNode {
	if (loading) {
		return (
			<SectionCard title="実装単位SD(IU)">
				<div className="text-[13px] text-slate-400">読み込み中...</div>
			</SectionCard>
		);
	}

	if (error) {
		return (
			<SectionCard title="実装単位SD(IU)">
				<div className="text-[13px] text-rose-600">{error}</div>
			</SectionCard>
		);
	}

	return (
		<SectionCard title="実装単位SD(IU)" count={items.length}>
			{items.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-4">
					{items.map((item) => (
						<ImplUnitSdItem key={item.id} item={item} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

function ImplUnitSdItem({ item }: { item: ImplUnitSd }): ReactNode {
	const typeLabel =
		IMPL_UNIT_TYPE_LABELS[item.type as ImplUnitType] ?? item.type;
	const typeColor =
		IMPL_UNIT_TYPE_COLORS[item.type as ImplUnitType] ??
		"border-slate-200 bg-slate-50 text-slate-700";
	const entryPoints = item.entryPoints ?? [];
	const detailsText = toYamlText(item.details ?? {}).trim();

	return (
		<div className="rounded-md border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-1 flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<h3 className="text-[15px] font-semibold text-slate-900">
							{item.name || "名称未設定"}
						</h3>
						<Badge
							variant="outline"
							className={`${typeColor} text-[12px] font-medium px-2.5 py-1`}
						>
							{typeLabel}
						</Badge>
					</div>
				</div>
				<span className="text-[10px] text-slate-400 font-mono">{item.id}</span>
			</div>

			{/* エントリポイントを名称直下に配置（最も重要な情報） */}
			<div className="space-y-2">
				<SectionLabel>エントリポイント</SectionLabel>
				{entryPoints.length === 0 ? (
					<div className="text-[12px] text-slate-400">未設定</div>
				) : (
					<div className="space-y-2">
						{entryPoints.map((entry, index) => (
							<div
								key={`${entry.path}-${index}`}
								className="flex items-start gap-2 text-[13px]"
							>
								<FileCode2 className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
								<div className="flex-1 space-y-0.5">
									<code className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
										{entry.path}
									</code>
									{(entry.type || entry.responsibility) && (
										<div className="text-[12px] text-slate-600 ml-1">
											{entry.type && (
												<span className="font-medium">({entry.type})</span>
											)}
											{entry.type && entry.responsibility && " "}
											{entry.responsibility && (
												<span className="text-slate-500">
													- {entry.responsibility}
												</span>
											)}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* 概要を3番目に配置 */}
			<div className="space-y-2">
				<SectionLabel>概要</SectionLabel>
				<div className="text-[13px] text-slate-600">{item.summary}</div>
			</div>

			{item.designPolicy && (
				<div className="space-y-2">
					<SectionLabel>設計方針</SectionLabel>
					<div className="text-[12px] text-slate-600 whitespace-pre-wrap">
						{item.designPolicy}
					</div>
				</div>
			)}

			{detailsText ? (
				<div className="space-y-2">
					<SectionLabel>details</SectionLabel>
					<pre className="text-[11px] text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-md p-3 border border-slate-200">
						{detailsText}
					</pre>
				</div>
			) : (
				<div className="text-[12px] text-slate-400">details 未設定</div>
			)}
		</div>
	);
}
