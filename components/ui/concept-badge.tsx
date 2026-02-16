import { cn } from "@/lib/utils";
import { IdNameBadge, IdNameBadgeList } from "./id-name-badge";

interface ConceptBadgeProps {
	id: string;
	name?: string;
	href?: string;
	onRemove?: () => void;
	className?: string;
}

export function ConceptBadge({
	id,
	name,
	href,
	onRemove,
	className,
}: ConceptBadgeProps) {
	return (
		<IdNameBadge
			id={id}
			name={name}
			href={href}
			onRemove={onRemove}
			className={className}
		/>
	);
}

interface ConceptBadgeListProps {
	ids: string[];
	conceptMap: Map<string, string>;
	hrefBuilder?: (id: string) => string;
	onRemove?: (id: string) => void;
	emptyMessage?: string;
	className?: string;
}

export function ConceptBadgeList({
	ids,
	conceptMap,
	hrefBuilder,
	onRemove,
	emptyMessage = "—",
	className,
}: ConceptBadgeListProps) {
	if (ids.length === 0) {
		return <span className="text-[14px] text-slate-400">{emptyMessage}</span>;
	}

	const items = ids.map((id) => ({
		id,
		name: conceptMap.get(id),
		href: hrefBuilder?.(id),
	}));

	return (
		<IdNameBadgeList
			items={items}
			onRemove={onRemove}
			emptyMessage={emptyMessage}
			className={cn("flex flex-wrap gap-2", className)}
		/>
	);
}
