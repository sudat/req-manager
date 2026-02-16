type FieldLabelProps = {
	children: React.ReactNode;
};

export function FieldLabel({ children }: FieldLabelProps) {
	return (
		<div className="w-full px-2 py-1 text-center text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded uppercase tracking-wide">
			{children}
		</div>
	);
}
