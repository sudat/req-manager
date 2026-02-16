import type { ReactNode } from "react";
import { CardSkeleton } from "@/components/skeleton";

type RequirementsSectionProps<T> = {
	items: T[];
	loading: boolean;
	error: string | null;
	emptyMessage?: string;
	renderItem: (item: T) => ReactNode;
};

export function RequirementsSection<T extends { id: string }>({
	items,
	loading,
	error,
	emptyMessage = "まだ登録されていません。",
	renderItem,
}: RequirementsSectionProps<T>) {
	return (
		<div className="space-y-4">
			{loading && (
				<>
					<CardSkeleton />
					{items.length > 1 && <CardSkeleton />}
				</>
			)}
			{!loading && error && <div className="text-[14px] text-rose-600">{error}</div>}
			{!loading && !error && items.length === 0 && (
				<div className="text-[14px] text-slate-500">{emptyMessage}</div>
			)}
			{!loading && !error && items.map(renderItem)}
		</div>
	);
}
