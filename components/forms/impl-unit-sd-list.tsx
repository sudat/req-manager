"use client";

import { type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImplUnitSdCard } from "@/components/forms/impl-unit-sd/ImplUnitSdCard";
import { nextSequentialId } from "@/lib/data/id";
import type { EntryPoint, ImplUnitType } from "@/lib/domain";

export type ImplUnitSdDraft = {
	id: string;
	name: string;
	type: ImplUnitType;
	summary: string;
	entryPoints: EntryPoint[];
	designPolicy: string;
	detailsYaml: string;
};

type ImplUnitSdListProps = {
	srfId: string;
	items: ImplUnitSdDraft[];
	onChange: (items: ImplUnitSdDraft[]) => void;
};

export function ImplUnitSdList({
	srfId,
	items,
	onChange,
}: ImplUnitSdListProps): ReactNode {
	const handleAdd = () => {
		const prefix = `IU-${srfId}-`;
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
				detailsYaml: "",
			},
		]);
	};

	const handleUpdate = (index: number, patch: Partial<ImplUnitSdDraft>) => {
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
						<CardTitle>実装単位SD（IU） ({items.length})</CardTitle>
						<CardDescription>
							SF配下の実装単位を定義します（entry_points / design_policy / details）。
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
						実装単位SDが登録されていません。
					</p>
				) : (
					items.map((item, index) => (
						<ImplUnitSdCard
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

