"use client";

import { SectionCard, EmptyState } from "./section-card";
import type { CodeRef } from "@/lib/mock/task-knowledge";

interface ImplementationSectionProps {
	codeRefs: CodeRef[];
}

export function ImplementationSection({ codeRefs }: ImplementationSectionProps): React.ReactNode {
	return (
		<SectionCard title="実装" count={codeRefs.length}>
			{codeRefs.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-3">
					{codeRefs.map((ref, index) => (
						<CodeRefItem key={index} codeRef={ref} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

function CodeRefItem({ codeRef }: { codeRef: CodeRef }): React.ReactNode {
	return (
		<div className="rounded-md border border-slate-200 bg-white p-3">
			<div className="space-y-2">
				{codeRef.paths.map((path, i) => (
					<div key={i} className="rounded-md bg-slate-50 p-3">
						<code className="text-[13px] text-slate-800 font-mono">{path}</code>
					</div>
				))}
			</div>
		</div>
	);
}
