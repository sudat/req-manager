import { CardSkeleton } from "@/components/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RequirementsSectionProps<T> = {
	title: string;
	items: T[];
	loading: boolean;
	error: string | null;
	emptyMessage?: string;
	renderItem: (item: T) => React.ReactNode;
};

export function RequirementsSection<T extends { id: string }>({
	title,
	items,
	loading,
	error,
	emptyMessage = "まだ登録されていません。",
	renderItem,
}: RequirementsSectionProps<T>) {
	return (
		<Card className="mt-4 rounded-md border border-slate-200/60 bg-white shadow-sm hover:border-slate-300/60 transition-colors">
			<CardContent className="p-6 space-y-3">
				<div className="flex items-center gap-2 pb-3 border-b border-slate-100">
					<h3 className="section-heading border-0 p-0 text-[18px]">{title}</h3>
					<Badge
						variant="outline"
						className="font-mono text-[11px] border-brand-200 bg-brand-50 text-brand-700 px-2.5 py-1"
					>
						{items.length}
					</Badge>
				</div>

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
			</CardContent>
		</Card>
	);
}
