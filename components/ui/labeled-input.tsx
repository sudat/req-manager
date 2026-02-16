import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LabeledInputProps = {
	label: string;
	required?: boolean;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	helperText?: string;
};

/**
 * ラベル付きInputコンポーネント
 *
 * Label + Input の組み合わせを統一的に提供する。
 */
export function LabeledInput({
	label,
	required = false,
	value,
	onChange,
	placeholder,
	className,
	helperText,
}: LabeledInputProps) {
	return (
		<div className="space-y-1.5">
			<Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">
				{label}
				{required && <span className="text-rose-500">*</span>}
			</Label>
			{helperText && <p className="text-[12px] text-slate-500">{helperText}</p>}
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={className}
			/>
		</div>
	);
}
