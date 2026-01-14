"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { FormField } from "./form-field";
import type { Requirement } from "@/lib/mock/task-knowledge";

const splitCsv = (value: string): string[] =>
	value
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean);

const joinCsv = (values: string[]): string => values.join(", ");

const splitLines = (value: string): string[] =>
	value
		.split("\n")
		.map((v) => v.trim())
		.filter(Boolean);

const joinLines = (values: string[]): string => values.join("\n");

type RequirementCardProps = {
	requirement: Requirement;
	onUpdate: (patch: Partial<Requirement>) => void;
	onRemove: () => void;
};

export function RequirementCard({
	requirement,
	onUpdate,
	onRemove,
}: RequirementCardProps): React.ReactElement {
	const handleConceptsChange = (value: string): void => {
		const names = splitCsv(value);
		onUpdate({
			concepts: names.map((name, i) => ({ id: `concept-${i}`, name })),
		});
	};

	return (
		<Card className="rounded-md border border-slate-200">
			<CardContent className="p-3 space-y-3">
				{/* ヘッダー: ID・タイプ・削除ボタン */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-2">
						<span className="font-mono text-[11px] text-slate-400">{requirement.id}</span>
						<Badge
							variant="outline"
							className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
						>
							{requirement.type}
						</Badge>
					</div>
					<Button
						variant="outline"
						size="icon"
						title="削除"
						className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
						onClick={onRemove}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>

				{/* タイトル */}
				<FormField
					type="input"
					label="タイトル"
					value={requirement.title}
					onChange={(v) => onUpdate({ title: v })}
				/>

				{/* 概要 */}
				<FormField
					type="textarea"
					label="概要"
					value={requirement.summary}
					onChange={(v) => onUpdate({ summary: v })}
				/>

				{/* 関連概念・システム機能 */}
				<div className="grid gap-3 md:grid-cols-2">
					<FormField
						type="input"
						label="関連概念（カンマ区切り）"
						value={requirement.concepts?.map((c) => c.name).join(", ") ?? ""}
						onChange={handleConceptsChange}
					/>
					<FormField
						type="input"
						label="関連システム機能"
						value={requirement.srfId ?? ""}
						onChange={(v) => onUpdate({ srfId: v })}
						placeholder="例: SRF-001"
					/>
				</div>

				{/* 影響領域・関連要件 */}
				<div className="grid gap-3 md:grid-cols-2">
					<FormField
						type="input"
						label="影響領域（カンマ区切り）"
						value={joinCsv(requirement.impacts)}
						onChange={(v) => onUpdate({ impacts: splitCsv(v) })}
					/>
					<FormField
						type="input"
						label="関連要件（カンマ区切り）"
						value={joinCsv(requirement.related)}
						onChange={(v) => onUpdate({ related: splitCsv(v) })}
					/>
				</div>

				{/* 受入条件 */}
				<FormField
					type="textarea"
					label="受入条件（1行=1条件）"
					value={joinLines(requirement.acceptanceCriteria)}
					onChange={(v) => onUpdate({ acceptanceCriteria: splitLines(v) })}
					minHeight="min-h-[110px]"
				/>
			</CardContent>
		</Card>
	);
}
