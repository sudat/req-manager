"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DesignDocumentCard } from "@/components/forms/design-document/DesignDocumentCard";
import { nextSequentialId } from "@/lib/data/id";
import type { EntryPoint, DdType } from "@/lib/domain";
import { createEmptyStructuredDesignDocumentSpec, type StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";
import type { DdDependencyDraft, DdCallerDraft } from "@/lib/domain/dd-dependency";

export type DesignDocumentDraft = {
	id: string;
	name: string;
	type: DdType;
	summary: string;
	entryPoints: EntryPoint[];
	designPolicy: string;
	dependencies: DdDependencyDraft[];
	callers: DdCallerDraft[];
	structuredSpec?: StructuredDesignDocumentSpec;
	structuredSpecParseError?: string;
};

type DesignDocumentListProps = {
	srfId: string;
	items: DesignDocumentDraft[];
	onChange: (items: DesignDocumentDraft[]) => void;
	modelDDs?: DesignDocumentDraft[];
	allDDs?: DesignDocumentDraft[];
	allSFs?: { id: string; title: string; domainName?: string }[];
};

const EMPTY_SYSTEM_FUNCTIONS: { id: string; title: string; domainName?: string }[] = [];

export function DesignDocumentList({
	srfId,
	items,
	onChange,
	modelDDs,
	allDDs,
	allSFs,
}: DesignDocumentListProps): ReactNode {
	const resolvedAllDDs = useMemo(() => allDDs ?? items, [allDDs, items]);
	const resolvedModelDDs = useMemo(() => modelDDs ?? items, [modelDDs, items]);
	const resolvedAllSFs = useMemo(() => allSFs ?? EMPTY_SYSTEM_FUNCTIONS, [allSFs]);

	const handleAdd = useCallback(() => {
		const prefix = `DD-${srfId}-`;
		const nextId = nextSequentialId(prefix, items.map((item) => item.id));
		onChange([
			...items,
			{
				id: nextId,
				name: "",
				type: "screen",
				summary: "",
				entryPoints: [],
				designPolicy: "",
				dependencies: [],
				callers: [],
				structuredSpec: createEmptyStructuredDesignDocumentSpec("screen"),
				structuredSpecParseError: undefined,
			},
		]);
	}, [items, onChange, srfId]);

	const handleUpdate = useCallback(
		(itemId: string, patch: Partial<DesignDocumentDraft>) => {
			onChange(
				items.map((item) =>
					item.id === itemId ? { ...item, ...patch } : item
				)
			);
		},
		[items, onChange]
	);

	const handleDelete = useCallback(
		(itemId: string) => {
			onChange(items.filter((item) => item.id !== itemId));
		},
		[items, onChange]
	);

	return (
		<Card>
			<CardContent className="py-4">
				{/* Header */}
				<div className="flex items-center justify-between pb-2 border-b border-slate-100">
					<div className="flex items-center gap-2">
						<h3 className="text-[14px] font-semibold text-slate-900">
							DD（Design Document）
						</h3>
						<Badge variant="outline" className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0">
							{items.length}
						</Badge>
					</div>
					<Button type="button" variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={handleAdd}>
						<Plus className="h-4 w-4" />
						追加
					</Button>
				</div>

				{/* Content */}
				<div className="space-y-0">
					{items.length === 0 ? (
						<p className="text-muted-foreground text-center py-8">
							DDが登録されていません。
						</p>
					) : (
						items.map((item, index) => (
							<div key={item.id}>
								{index > 0 && (
									<div className="border-t-2 border-slate-300 my-2" />
								)}
								<DesignDocumentCard
									item={item}
									onUpdate={handleUpdate}
									onDelete={handleDelete}
									allDDs={resolvedAllDDs}
									modelDDs={resolvedModelDDs}
									allSFs={resolvedAllSFs}
								/>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}
