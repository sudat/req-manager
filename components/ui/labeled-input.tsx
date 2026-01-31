import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LabeledInputProps = {
	label: string;
	required?: boolean;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
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
}: LabeledInputProps) {
	return (
		<div className="space-y-1.5">
			<Label className="text-[12px] font-medium text-slate-500">
				{label}
				{required && <span className="text-rose-500">*</span>}
			</Label>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={className}
			/>
		</div>
	);
}
