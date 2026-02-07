"use client";

import type { ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { YamlValidationResult } from "@/lib/utils/yaml";

type YamlTextareaFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	minHeight?: string;
	required?: boolean;
	diag?: YamlValidationResult;
	helperText?: string;
};

export function YamlTextareaField({
	label,
	value,
	onChange,
	placeholder,
	minHeight = "min-h-[140px]",
	required = false,
	diag,
	helperText,
}: YamlTextareaFieldProps): ReactNode {
	const hasError = diag ? !diag.ok : false;

	return (
		<div className="space-y-1.5 relative">
			<div className="flex items-center justify-between">
				<Label className="text-[12px] font-medium text-slate-500">
					{label}
					{required && <span className="text-rose-500">*</span>}
				</Label>
				<Badge
					variant="outline"
					className="text-[10px] px-1.5 py-0 h-5 border-amber-200 bg-amber-50 text-amber-700"
				>
					YAML
				</Badge>
			</div>
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={`font-mono text-[12px] ${minHeight} ${hasError ? "border-rose-400 focus-visible:ring-rose-200" : ""}`}
				aria-invalid={hasError}
			/>
			{helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
			{hasError && diag?.message && (
				<p className="text-[12px] text-rose-600">{diag.message}</p>
			)}
		</div>
	);
}
