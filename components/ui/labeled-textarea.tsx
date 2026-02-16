import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LabeledTextareaProps = {
	label: string;
	required?: boolean;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	minHeight?: string;
	showMarkdownBadge?: boolean;
	helperText?: string;
};

export function LabeledTextarea({
	label,
	required = false,
	value,
	onChange,
	placeholder,
	className,
	minHeight,
	showMarkdownBadge = false,
	helperText,
}: LabeledTextareaProps) {
	const textareaClassName = minHeight
		? `${minHeight} ${className || "text-[14px]"}`
		: className || "min-h-[100px] text-[14px]";

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">
					{label}
					{required && <span className="text-rose-500">*</span>}
				</Label>
				{showMarkdownBadge && (
					<Badge
						variant="outline"
						className="text-[10px] px-1.5 py-0 h-5 border-blue-200 bg-blue-50 text-blue-700"
					>
						Markdown
					</Badge>
				)}
			</div>
			{helperText && <p className="text-[12px] text-slate-500">{helperText}</p>}
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={textareaClassName}
			/>
		</div>
	);
}
