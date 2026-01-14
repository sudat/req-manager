"use client"

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
};

type InputFieldProps = FormFieldProps & {
	type: "input";
	inputClassName?: string;
};

type TextareaFieldProps = FormFieldProps & {
	type: "textarea";
	minHeight?: string;
};

export type FormFieldConfig = InputFieldProps | TextareaFieldProps;

export function FormField(props: FormFieldConfig): React.ReactElement {
	const { label, value, onChange, placeholder, className = "" } = props;

	if (props.type === "textarea") {
		return (
			<div className={`space-y-1.5 ${className}`}>
				<Label className="text-[12px] font-medium text-slate-500">{label}</Label>
				<Textarea
					className={`text-[14px] ${props.minHeight ?? "min-h-[90px]"}`}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
				/>
			</div>
		);
	}

	return (
		<div className={`space-y-1.5 ${className}`}>
			<Label className="text-[12px] font-medium text-slate-500">{label}</Label>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={props.inputClassName ?? "text-[14px]"}
				placeholder={placeholder}
			/>
		</div>
	);
}
