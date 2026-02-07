"use client";

import { type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DesignDocumentCard } from "@/components/forms/design-document/DesignDocumentCard";
import { nextSequentialId } from "@/lib/data/id";
import type { EntryPoint, DdType } from "@/lib/domain";
import { createEmptyStructuredDesignDocumentSpec, type StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";

export type DesignDocumentDraft = {
	id: string;
	name: string;
	type: DdType;
	summary: string;
	entryPoints: EntryPoint[];
	designPolicy: string;
	detailsYaml?: string;
	structuredSpec?: StructuredDesignDocumentSpec;
	structuredSpecParseError?: string;
};

type DesignDocumentListProps = {
	srfId: string;
	items: DesignDocumentDraft[];
	onChange: (items: DesignDocumentDraft[]) => void;
};

export function DesignDocumentList({
	srfId,
	items,
	onChange,
}: DesignDocumentListProps): ReactNode {
	const handleAdd = () => {
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
				structuredSpec: createEmptyStructuredDesignDocumentSpec("screen"),
				structuredSpecParseError: undefined,
			},
		]);
	};

	const handleUpdate = (index: number, patch: Partial<DesignDocumentDraft>) => {
		const next = [...items];
		next[index] = { ...next[index], ...patch };
		onChange(next);
	};

	const handleDelete = (index: number) => {
		onChange(items.filter((_, i) => i !== index));
	};

	return (
		<Card>
			<CardContent className="pt-6">
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
									<div className="border-t-2 border-slate-300 my-8" />
								)}
								<DesignDocumentCard
									item={item}
									onUpdate={(patch) => handleUpdate(index, patch)}
									onDelete={() => handleDelete(index)}
								/>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}
