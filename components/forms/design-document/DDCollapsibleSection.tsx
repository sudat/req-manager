"use client";

import { memo, useCallback, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DDCollapsibleSectionProps = {
	title: string;
	description?: string;
	isOpen: boolean;
	onToggle: () => void;
	requiredBadge?: string;
	children: ReactNode;
	className?: string;
};

function DDCollapsibleSectionComponent({
	title,
	description,
	isOpen,
	onToggle,
	requiredBadge,
	children,
	className,
}: DDCollapsibleSectionProps): ReactNode {
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onToggle();
			}
		},
		[onToggle]
	);

	return (
		<div className={cn("rounded-md border border-slate-200 overflow-hidden", className)}>
			<button
				type="button"
				onClick={onToggle}
				onKeyDown={handleKeyDown}
				className={cn(
					"w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer",
					"transition-colors duration-150",
					isOpen ? "bg-slate-50" : "hover:bg-slate-50"
				)}
			>
				<ChevronRight
					className={cn(
						"h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200",
						isOpen && "rotate-90"
					)}
				/>
				<span className="text-[13px] font-medium text-slate-700 truncate">
					{title}
				</span>
				{requiredBadge && (
					<Badge
						variant="outline"
						className="text-[10px] px-1.5 py-0 h-[18px] border-slate-200 bg-slate-50 text-slate-500 shrink-0"
					>
						{requiredBadge}
					</Badge>
				)}
				{description && !isOpen && (
					<span className="text-[11px] text-slate-400 truncate hidden sm:inline">
						{description}
					</span>
				)}
			</button>
			{isOpen && (
				<div className="px-3 pb-3 pt-2 border-t border-slate-100 bg-white">
					{children}
				</div>
			)}
		</div>
	);
}

export const DDCollapsibleSection = memo(DDCollapsibleSectionComponent);
DDCollapsibleSection.displayName = "DDCollapsibleSection";
