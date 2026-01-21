"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface SectionCardProps {
	title: string;
	children: React.ReactNode;
	count?: number;
}

export function SectionCard({ title, children, count }: SectionCardProps): React.ReactNode {
	return (
		<Card className="mt-4 rounded-md border border-slate-200/60 shadow-sm hover:border-slate-300/60 transition-colors">
			<CardContent className="p-6">
				<div className="flex items-center gap-2 pb-3 border-b border-slate-100">
					<h2 className="section-heading border-0 p-0 text-[18px]">{title}</h2>
					{count !== undefined && (
						<Badge variant="outline" className="font-mono text-[11px] border-brand-200 bg-brand-50 text-brand-700 px-2.5 py-1">
							{count}
						</Badge>
					)}
				</div>
				<div className="pt-3">{children}</div>
			</CardContent>
		</Card>
	);
}

export function EmptyState({ message }: { message: string }): React.ReactNode {
	return <div className="text-[13px] text-slate-500">{message}</div>;
}

export function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }): React.ReactNode {
	return (
		<div className={`text-[11px] font-semibold text-slate-400 uppercase tracking-wide ${className}`}>
			{children}
		</div>
	);
}
