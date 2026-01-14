"use client";

import { Card, CardContent } from "@/components/ui/card";

interface SectionCardProps {
	title: string;
	children: React.ReactNode;
}

export function SectionCard({ title, children }: SectionCardProps): React.ReactNode {
	return (
		<Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
			<div className="px-4 py-2.5 border-b border-slate-100">
				<h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
			</div>
			<CardContent className="p-4">{children}</CardContent>
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
