"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard, EmptyState, SectionLabel } from "./section-card";
import type { DesignDocument, DdType } from "@/lib/domain";
import { parseStructuredDetails } from "@/lib/utils/design-documents/structured-compat";
import { StructuredSpecViewer } from "@/components/system-domains/structured-spec-viewer";
import {
	DD_TYPE_LABELS,
	DD_TYPE_COLORS,
} from "@/lib/domain/enums";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface DesignDocumentSectionProps {
	items: DesignDocument[];
	loading: boolean;
	error: string | null;
	srfId?: string;
	systemDomainId?: string;
}

export function DesignDocumentSection({
	items,
	loading,
	error,
	srfId,
	systemDomainId,
}: DesignDocumentSectionProps): ReactNode {
	const editButton = srfId && systemDomainId ? (
		<Link href={`/system/${systemDomainId}/${srfId}/edit/design-documents`}>
			<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[12px]">
				<Pencil className="h-3.5 w-3.5" />
				編集
			</Button>
		</Link>
	) : null;

	if (loading) {
		return (
			<SectionCard title="DD（Design Document）" action={editButton}>
				<div className="text-[13px] text-slate-400">読み込み中...</div>
			</SectionCard>
		);
	}

	if (error) {
		return (
			<SectionCard title="DD（Design Document）" action={editButton}>
				<div className="text-[13px] text-rose-600">{error}</div>
			</SectionCard>
		);
	}

	return (
		<SectionCard title="DD（Design Document）" count={items.length} action={editButton}>
			{items.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-4">
					{items.map((item) => (
						<DesignDocumentItem key={item.id} item={item} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

function DesignDocumentItem({ item }: { item: DesignDocument }): ReactNode {
	const [isOpen, setIsOpen] = useState(false);
	const typeLabel =
		DD_TYPE_LABELS[item.type as DdType] ?? item.type;
	const typeColor =
		DD_TYPE_COLORS[item.type as DdType] ??
		"border-slate-200 bg-slate-50 text-slate-700";
	const entryPoints = item.entryPoints ?? [];
	const { structuredSpec, parseError } = parseStructuredDetails(item.details);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div className="rounded-md border border-slate-200 bg-white shadow-sm">
				<CollapsibleTrigger className="w-full flex flex-wrap items-start justify-between gap-3 px-4 py-4 hover:bg-slate-50/50 cursor-pointer transition-colors">
					<div className="flex items-center gap-2 flex-wrap flex-1">
						{/* IDバッジ - グレー系 */}
						<Badge className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2.5 py-1 font-mono">
							{item.id}
						</Badge>
						{/* 種別バッジ */}
						<Badge
							variant="outline"
							className={`${typeColor} text-[12px] font-medium px-2.5 py-1`}
						>
							{typeLabel}
						</Badge>
						{/* DD名 */}
						<span className="text-[14px] font-semibold text-slate-900">
							{item.name || "名称未設定"}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<ChevronDown
							className={cn(
								"h-5 w-5 text-slate-400 transition-transform duration-200",
								isOpen ? "rotate-180" : ""
							)}
						/>
					</div>
				</CollapsibleTrigger>

				<CollapsibleContent className="p-5 space-y-4">
					{/* 概要 */}
					<div className="text-[13px] text-slate-600">{item.summary}</div>

					{item.designPolicy && (
						<div className="space-y-2">
							<SectionLabel>設計方針</SectionLabel>
							<div className="text-[12px] text-slate-600 whitespace-pre-wrap">
								{item.designPolicy}
							</div>
						</div>
					)}

					{parseError && (
						<div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
							構造化データの読み込みに失敗しました: {parseError}
						</div>
					)}

				{structuredSpec && (
					<div className="space-y-2">
						<SectionLabel>構造化設計</SectionLabel>
						<StructuredSpecViewer spec={structuredSpec} entryPoints={entryPoints} />
					</div>
				)}
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}
