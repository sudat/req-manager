"use client";

import { type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>DD（Design Document） ({items.length})</CardTitle>
						<CardDescription>
							SF配下のDDを定義します（entry_points / design_policy / details）。
						</CardDescription>
					</div>
					<Button type="button" onClick={handleAdd}>
						<Plus className="h-4 w-4 mr-2" />
						追加
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{items.length === 0 ? (
					<p className="text-muted-foreground text-center py-8">
						DDが登録されていません。
					</p>
				) : (
					items.map((item, index) => (
						<DesignDocumentCard
							key={item.id}
							item={item}
							onUpdate={(patch) => handleUpdate(index, patch)}
							onDelete={() => handleDelete(index)}
						/>
					))
				)}
			</CardContent>
		</Card>
	);
}
