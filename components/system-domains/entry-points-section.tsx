"use client";

import { SectionCard, EmptyState, SectionLabel } from "./section-card";
import type { EntryPoint } from "@/lib/domain";

interface EntryPointsSectionProps {
	entryPoints: EntryPoint[];
}

export function EntryPointsSection({
	entryPoints,
}: EntryPointsSectionProps): React.ReactNode {
	return (
		<SectionCard title="エントリポイント" count={entryPoints.length}>
			{entryPoints.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-3">
					{entryPoints.map((entry) => (
						<div
							key={entry.path}
							className="rounded-md border border-slate-200 bg-white p-6 space-y-2"
						>
							<SectionLabel>Path</SectionLabel>
							<code className="text-[12px] text-slate-800 font-mono">
								{entry.path}
							</code>
							<div className="flex flex-wrap gap-4 text-[12px] text-slate-600">
								<span>種別: {entry.type ?? "—"}</span>
								<span>責務: {entry.responsibility ?? "—"}</span>
							</div>
						</div>
					))}
				</div>
			)}
		</SectionCard>
	);
}
