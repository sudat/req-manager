"use client";

import { type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { YamlTextareaField } from "@/components/forms/yaml-textarea-field";
import { EntryPointsInlineEditor } from "@/components/forms/entry-points/EntryPointsInlineEditor";
import { useYamlValidation } from "@/hooks/use-yaml-validation";
import type { ImplUnitType } from "@/lib/domain";
import type { ImplUnitSdDraft } from "@/components/forms/impl-unit-sd-list";
import { IMPL_UNIT_TYPE_LABELS } from "@/lib/domain/enums";

type ImplUnitSdCardProps = {
	item: ImplUnitSdDraft;
	onUpdate: (patch: Partial<ImplUnitSdDraft>) => void;
	onDelete: () => void;
};

const IMPL_UNIT_TYPES: { value: ImplUnitType; label: string }[] = [
	{ value: "screen", label: IMPL_UNIT_TYPE_LABELS.screen },
	{ value: "api", label: IMPL_UNIT_TYPE_LABELS.api },
	{ value: "batch", label: IMPL_UNIT_TYPE_LABELS.batch },
	{ value: "external_if", label: IMPL_UNIT_TYPE_LABELS.external_if },
];

export function ImplUnitSdCard({
	item,
	onUpdate,
	onDelete,
}: ImplUnitSdCardProps): ReactNode {
	const yamlDiag = useYamlValidation(item.detailsYaml);

	return (
		<Card className="rounded-md border border-slate-200">
			<CardContent className="p-4 space-y-4">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1">
						<div className="text-[11px] text-slate-400 font-mono">ID</div>
						<div className="text-[13px] font-mono text-slate-600">{item.id}</div>
					</div>
					<Button
						variant="outline"
						size="icon"
						title="削除"
						aria-label={`${item.name || "実装単位SD"} を削除`}
						className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
						onClick={onDelete}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>

				<div className="grid gap-3 md:grid-cols-[2fr_1fr]">
					<div className="space-y-1.5">
						<Label className="text-[12px] font-medium text-slate-500">
							実装単位名<span className="text-rose-500">*</span>
						</Label>
						<Input
							value={item.name}
							onChange={(e) => onUpdate({ name: e.target.value })}
							placeholder="例: 請求書PDF生成バッチ"
							className="text-[14px]"
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-[12px] font-medium text-slate-500">
							種別<span className="text-rose-500">*</span>
						</Label>
						<Select
							value={item.type}
							onValueChange={(value) => onUpdate({ type: value as ImplUnitType })}
						>
							<SelectTrigger className="text-[14px]">
								<SelectValue placeholder="種別を選択" />
							</SelectTrigger>
							<SelectContent>
								{IMPL_UNIT_TYPES.map((t) => (
									<SelectItem key={t.value} value={t.value}>
										{t.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label className="text-[12px] font-medium text-slate-500">
						概要<span className="text-rose-500">*</span>
					</Label>
					<Textarea
						value={item.summary}
						onChange={(e) => onUpdate({ summary: e.target.value })}
						placeholder="入出力と責務の概要を記述"
						className="min-h-[90px] text-[14px]"
					/>
				</div>

				<EntryPointsInlineEditor
					entryPoints={item.entryPoints}
					onChange={(entryPoints) => onUpdate({ entryPoints })}
				/>

				<div className="space-y-1.5">
					<Label className="text-[12px] font-medium text-slate-500">
						設計方針
					</Label>
					<Textarea
						value={item.designPolicy}
						onChange={(e) => onUpdate({ designPolicy: e.target.value })}
						placeholder="横断的な設計方針を記述"
						className="min-h-[90px] text-[14px]"
					/>
				</div>

				<YamlTextareaField
					label="details（YAML）"
					value={item.detailsYaml}
					onChange={(value) => onUpdate({ detailsYaml: value })}
					diag={yamlDiag}
					minHeight="min-h-[140px]"
					placeholder="api_definition:, data_model: などをYAMLで記述"
				/>
			</CardContent>
		</Card>
	);
}
