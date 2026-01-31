import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type LabeledTextareaProps = {
	label: string;
	required?: boolean;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	minHeight?: string;
};

/**
 * ラベル付きTextareaコンポーネント
 *
 * Label + Textarea の組み合わせを統一的に提供する。
 */
export function LabeledTextarea({
	label,
	required = false,
	value,
	onChange,
	placeholder,
	className,
	minHeight,
}: LabeledTextareaProps) {
	const textareaClassName = minHeight
		? `${minHeight} ${className || "text-[14px]"}`
		: className || "min-h-[100px] text-[14px]";

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
				className={textareaClassName}
			/>
		</div>
	);
}
