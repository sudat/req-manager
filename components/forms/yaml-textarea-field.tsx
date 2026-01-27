"use client";

import type { ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
		<div className="space-y-1.5">
			<Label className="text-[12px] font-medium text-slate-500">
				{label}
				{required && <span className="text-rose-500">*</span>}
			</Label>
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
