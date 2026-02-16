"use client";

import type { ReactNode } from "react";
import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field-label";
import { EmptyState, SectionLabel } from "./section-card";
import type { DesignDocument, DdType } from "@/lib/domain";
import { parseStructuredDetails } from "@/lib/utils/design-documents/structured-compat";
import { StructuredSpecViewer } from "@/components/system-domains/structured-spec-viewer";
import { DD_TYPE_LABELS, DD_TYPE_COLORS } from "@/lib/domain/enums";
import {
	DD_CALLER_TYPE_LABELS,
	DD_DEPENDENCY_CALL_TYPE_LABELS,
} from "@/lib/domain/dd-dependency";
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
	const editButton =
		srfId && systemDomainId ? (
			<Link href={`/system/${systemDomainId}/${srfId}/edit/design-documents`}>
				<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[12px]">
					<Pencil className="h-3.5 w-3.5" />
					編集
				</Button>
			</Link>
		) : null;

	if (loading) {
		return <div className="text-[13px] text-slate-400">読み込み中...</div>;
	}

	if (error) {
		return <div className="text-[13px] text-rose-600">{error}</div>;
	}

	return (
		<div className="space-y-4">
			{items.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-4">
					{items.map((item) => (
						<DesignDocumentItem key={item.id} item={item} />
					))}
				</div>
			)}
		</div>
	);
}

function DesignDocumentItem({ item }: { item: DesignDocument }): ReactNode {
	const [isOpen, setIsOpen] = useState(false);
	const scrollPosRef = useRef(0);
	const typeLabel = DD_TYPE_LABELS[item.type as DdType] ?? item.type;
	const typeColor =
		DD_TYPE_COLORS[item.type as DdType] ??
		"border-slate-200 bg-slate-50 text-slate-700";
	const entryPoints = item.entryPoints ?? [];
	const { structuredSpec, parseError } = parseStructuredDetails(item.details);
	const callers = item.callers ?? [];

	const handleOpenChange = (open: boolean) => {
		if (open) {
			scrollPosRef.current = window.scrollY;
		}
		setIsOpen(open);
		requestAnimationFrame(() => {
			window.scrollTo(0, scrollPosRef.current);
		});
	};

	return (
		<Collapsible open={isOpen} onOpenChange={handleOpenChange}>
			<div className="rounded-md border border-slate-200 bg-white shadow-sm">
				<CollapsibleTrigger className="w-full flex flex-wrap items-start justify-between gap-3 px-4 py-4 hover:bg-slate-50/50 cursor-pointer transition-colors">
					<div className="flex items-center gap-2 flex-wrap flex-1">
						{/* IDバッジ - blue系 */}
						<Badge className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2.5 py-1 font-mono">
							{item.id}
						</Badge>
						{/* 種別バッジ - emerald系 */}
						<Badge
							variant="outline"
							className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[12px] font-medium px-2.5 py-1"
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
								isOpen ? "rotate-180" : "",
							)}
						/>
					</div>
				</CollapsibleTrigger>

				<CollapsibleContent className="p-4 space-y-3">
					{/* 基本方針ブロック */}
					<div className="space-y-3">
						{/* 概要 */}
						{item.summary && (
							<div className="text-[15px] font-medium text-slate-700 leading-relaxed">
								{item.summary}
							</div>
						)}

						{item.designPolicy && (
							<div className="flex gap-4">
								<div className="w-20 flex-shrink-0">
									<FieldLabel>設計方針</FieldLabel>
								</div>
								<div className="flex-1 text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed">
									{item.designPolicy}
								</div>
							</div>
						)}

						{/* 呼び出し元セクション */}
						{callers.length > 0 && (
							<div className="flex gap-4">
								<div className="w-20 flex-shrink-0">
									<FieldLabel>呼び出し元</FieldLabel>
								</div>
								<div className="flex-1 space-y-2">
									{callers.map((caller) => {
										const key = `${caller.callerType}-${caller.callerDdId ?? "user"}-${caller.callType ?? "none"}`;
										return (
											<div
												key={key}
												className="flex items-center gap-2 text-[13px] text-slate-600"
											>
												<Badge className="text-[12px] px-2 py-0.5 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200">
													{DD_CALLER_TYPE_LABELS[caller.callerType]}
												</Badge>
												{caller.callerType === "system" &&
													caller.callerDdId && (
														<>
															<Badge className="text-[12px] px-2 py-0.5 gap-1.5 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200">
																<span className="font-mono">
																	{caller.callerDdId}
																</span>
																{caller.callerName && (
																	<span>{caller.callerName}</span>
																)}
															</Badge>
															{caller.callType && (
																<Badge className="text-[12px] px-2 py-0.5 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200">
																	{
																		DD_DEPENDENCY_CALL_TYPE_LABELS[
																			caller.callType
																		]
																	}
																</Badge>
															)}
														</>
													)}
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{parseError && (
						<div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
							構造化データの読み込みに失敗しました: {parseError}
						</div>
					)}

					{structuredSpec && (
						<div className="space-y-2">
							<StructuredSpecViewer
								spec={structuredSpec}
								entryPoints={entryPoints}
							/>
						</div>
					)}
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}
