"use client";

import { useMemo, type ReactNode } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";

type RequiredFieldStatus = {
	key: string;
	label: string;
	filled: boolean;
};

type DDCardProgressProps = {
	name: string;
	type: string;
	summary: string;
	structuredSpec?: StructuredDesignDocumentSpec | null;
};

function hasInputFields(
	structuredSpec?: StructuredDesignDocumentSpec | null
): boolean {
	if (!structuredSpec?.inputSchema) return false;

	const input = structuredSpec.inputSchema;

	if (input.fields && input.fields.length > 0) return true;

	if ("elements" in input && input.elements && input.elements.length > 0) return true;
	if ("dataFields" in input && input.dataFields && input.dataFields.length > 0) return true;
	if ("query" in input && input.query && input.query.length > 0) return true;
	if ("body" in input && input.body && input.body.length > 0) return true;
	if ("parameters" in input && input.parameters && input.parameters.length > 0) return true;
	if ("payload" in input && input.payload && input.payload.length > 0) return true;

	return false;
}

function hasModelAttributes(
	structuredSpec?: StructuredDesignDocumentSpec | null
): boolean {
	if (structuredSpec?.typeDetail?.ioType !== "model") return false;
	return (structuredSpec.typeDetail.attributes?.length ?? 0) > 0;
}

function calculateRequiredFields(
	name: string,
	type: string,
	summary: string,
	structuredSpec?: StructuredDesignDocumentSpec | null
): RequiredFieldStatus[] {
	const isModel = type === "model";

	const baseFields: RequiredFieldStatus[] = [
		{
			key: "name",
			label: "DD名",
			filled: !!name?.trim(),
		},
		{
			key: "type",
			label: "種別",
			filled: !!type,
		},
		{
			key: "summary",
			label: "概要",
			filled: !!summary?.trim(),
		},
	];

	if (isModel) {
		baseFields.push({
			key: "attributes",
			label: "属性定義",
			filled: hasModelAttributes(structuredSpec),
		});
	} else {
		baseFields.push({
			key: "inputSchema",
			label: "入力スキーマ",
			filled: hasInputFields(structuredSpec),
		});
	}

	return baseFields;
}

export function DDCardProgress({
	name,
	type,
	summary,
	structuredSpec,
}: DDCardProgressProps): ReactNode {
	const requiredFields = useMemo(
		() => calculateRequiredFields(name, type, summary, structuredSpec),
		[name, type, summary, structuredSpec]
	);

	const completedCount = useMemo(
		() => requiredFields.filter((f) => f.filled).length,
		[requiredFields]
	);
	const totalCount = requiredFields.length;
	const percentage = Math.round((completedCount / totalCount) * 100);

	const missingFields = useMemo(
		() => requiredFields.filter((f) => !f.filled),
		[requiredFields]
	);

	const isComplete = completedCount === totalCount;

	return (
		<TooltipProvider delayDuration={200}>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex items-center gap-2 cursor-default">
						<span className="text-[11px] text-slate-500 shrink-0">
							必須: {completedCount}/{totalCount}
						</span>
						<div className="w-[80px] h-1.5 bg-slate-200 rounded-full overflow-hidden">
							<div
								className={`h-full transition-all duration-300 ${
									isComplete ? "bg-emerald-500" : "bg-slate-400"
								}`}
								style={{ width: `${percentage}%` }}
							/>
						</div>
						<span className="text-[11px] text-slate-500 w-[32px] text-right">
							{percentage}%
						</span>
					</div>
				</TooltipTrigger>
				{missingFields.length > 0 && (
					<TooltipContent
						side="top"
						className="text-xs bg-slate-800 text-white border-slate-700"
					>
						<div className="font-medium mb-1">未入力:</div>
						<ul className="space-y-0.5">
							{missingFields.map((field) => (
								<li key={field.key}>・{field.label}</li>
							))}
						</ul>
					</TooltipContent>
				)}
			</Tooltip>
		</TooltipProvider>
	);
}
