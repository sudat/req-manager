/**
 * プリミティブ値エディタ
 *
 * string/number/boolean/null 値の入力UIコンポーネント
 */

"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { HierarchicalValue } from "@/lib/utils/hierarchical-editor";

type PrimitiveType = "string" | "number" | "boolean" | "null";

interface PrimitiveEditorProps {
	value: Extract<HierarchicalValue, { type: PrimitiveType }>;
	onChange: (value: HierarchicalValue) => void;
	className?: string;
}

const TYPE_OPTIONS: { value: PrimitiveType; label: string }[] = [
	{ value: "string", label: "Text" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "null", label: "Null" },
];

export function PrimitiveEditor({ value, onChange, className }: PrimitiveEditorProps) {
	const handleTypeChange = (newType: PrimitiveType) => {
		if (newType === value.type) return;

		switch (newType) {
			case "string":
				onChange({ type: "string", value: String(value.value) });
				break;
			case "number": {
				const num = Number(value.value);
				onChange({ type: "number", value: isNaN(num) ? 0 : num });
				break;
			}
			case "boolean":
				onChange({ type: "boolean", value: Boolean(value.value) });
				break;
			case "null":
				onChange({ type: "null", value: null });
				break;
		}
	};

	const handleValueChange = (newValue: string | number | boolean) => {
		switch (value.type) {
			case "string":
				onChange({ type: "string", value: String(newValue) });
				break;
			case "number":
				onChange({ type: "number", value: Number(newValue) });
				break;
			case "boolean":
				onChange({ type: "boolean", value: Boolean(newValue) });
				break;
			case "null":
				// null 型は値変更不可
				break;
		}
	};

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			{/* タイプ選択 */}
			<div className="flex-shrink-0">
				<Select
					value={value.type}
					onValueChange={(v) => handleTypeChange(v as PrimitiveType)}
				>
					<SelectTrigger className="h-8 w-[100px] text-[13px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TYPE_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value} className="text-[13px]">
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* 値入力 */}
			<div className="flex-1 min-w-0">
				{value.type === "string" && (
					<Input
						type="text"
						value={value.value}
						onChange={(e) => handleValueChange(e.target.value)}
						className="h-8 text-[13px]"
						placeholder="テキストを入力"
					/>
				)}

				{value.type === "number" && (
					<Input
						type="number"
						value={value.value}
						onChange={(e) => handleValueChange(e.target.value)}
						className="h-8 text-[13px]"
						placeholder="0"
						step="any"
					/>
				)}

				{value.type === "boolean" && (
					<div className="flex items-center h-8">
						<Switch
							checked={value.value}
							onCheckedChange={(checked) => handleValueChange(checked)}
						/>
						<Label className="ml-2 text-[13px] text-slate-600">
							{value.value ? "true" : "false"}
						</Label>
					</div>
				)}

				{value.type === "null" && (
					<div className="flex items-center h-8 text-[13px] text-slate-400 italic">
						null
					</div>
				)}
			</div>
		</div>
	);
}
