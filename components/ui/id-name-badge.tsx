import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IdNameBadgeProps {
	id: string;
	name?: string;
	href?: string;
	onRemove?: () => void;
	className?: string;
}

export function IdNameBadge({
	id,
	name,
	href,
	onRemove,
	className,
}: IdNameBadgeProps) {
	const content = (
		<Badge
			variant="secondary"
			className={cn(
				"px-2.5 py-1 text-[13px] font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200",
				className,
			)}
		>
			<span className="font-mono text-slate-500">{id}</span>
			{name && (
				<span className="text-slate-900 ml-1.5 pl-1.5 border-l border-slate-300">
					{name}
				</span>
			)}
			{onRemove && (
				<button
					type="button"
					className="ml-2 text-slate-400 hover:text-rose-500 transition-colors"
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						onRemove();
					}}
					aria-label={`${id} を削除`}
				>
					×
				</button>
			)}
		</Badge>
	);

	if (href) {
		return (
			<a href={href} className="inline-block">
				{content}
			</a>
		);
	}

	return content;
}

interface IdNameBadgeListProps {
	items: Array<{ id: string; name?: string; href?: string }>;
	onRemove?: (id: string) => void;
	emptyMessage?: string;
	className?: string;
}

export function IdNameBadgeList({
	items,
	onRemove,
	emptyMessage = "—",
	className,
}: IdNameBadgeListProps) {
	if (items.length === 0) {
		return <span className="text-[14px] text-slate-400">{emptyMessage}</span>;
	}

	return (
		<div className={cn("flex flex-wrap gap-2", className)}>
			{items.map((item) => (
				<IdNameBadge
					key={item.id}
					id={item.id}
					name={item.name}
					href={item.href}
					onRemove={onRemove ? () => onRemove(item.id) : undefined}
				/>
			))}
		</div>
	);
}
