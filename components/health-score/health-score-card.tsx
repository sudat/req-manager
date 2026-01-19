"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HealthScoreSummary, HealthScoreWarning } from "@/lib/health-score";

type HealthScoreCardProps = {
	title?: string;
	summary: HealthScoreSummary | null;
	loading?: boolean;
	error?: string | null;
	maxIssues?: number;
	showStats?: boolean;
};

const levelLabels = {
	good: "良好",
	warning: "注意",
	critical: "要改善",
} as const;

const levelClassNames = {
	good: "border-emerald-200 bg-emerald-50 text-emerald-700",
	warning: "border-amber-200 bg-amber-50 text-amber-700",
	critical: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const severityLabels = {
	high: "高",
	medium: "中",
} as const;

const severityClassNames = {
	high: "border-rose-200 bg-rose-50 text-rose-700",
	medium: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

const warningClassNames: Record<HealthScoreWarning["severity"], string> = {
	critical: "border-rose-200 bg-rose-50 text-rose-700",
	warning: "border-amber-200 bg-amber-50 text-amber-700",
};

export function HealthScoreCard({
	title = "ヘルススコア",
	summary,
	loading = false,
	error = null,
	maxIssues,
	showStats = false,
}: HealthScoreCardProps): React.ReactNode {
	const issues = summary?.issues.filter((issue) => issue.total > 0) ?? [];
	const visibleIssues = maxIssues ? issues.slice(0, maxIssues) : issues;
	const remainingIssues = issues.length - visibleIssues.length;

	return (
		<Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
			<CardContent className="p-4 space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-[16px] font-semibold text-slate-900">{title}</h2>
					{summary && (
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className={`text-[11px] font-medium ${levelClassNames[summary.level]}`}
							>
								{levelLabels[summary.level]}
							</Badge>
							<span className="font-mono text-[18px] font-semibold text-slate-900">
								{summary.score}
							</span>
							<span className="text-[11px] text-slate-400">/100</span>
						</div>
					)}
				</div>

				{loading && <div className="text-[13px] text-slate-500">算出中...</div>}
				{error && <div className="text-[13px] text-rose-600">{error}</div>}
				{!loading && !error && !summary && (
					<div className="text-[13px] text-slate-500">データが不足しています。</div>
				)}

				{summary && (
					<>
						{summary.warnings.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{summary.warnings.map((warning) => (
									<Badge
										key={warning.id}
										variant="outline"
										className={`text-[11px] font-medium ${warningClassNames[warning.severity]}`}
									>
										{warning.label}
									</Badge>
								))}
							</div>
						)}

						{showStats && (
							<div className="flex flex-wrap gap-4 text-[12px] text-slate-500">
								<span>業務要件: {summary.stats.businessRequirements}</span>
								<span>システム要件: {summary.stats.systemRequirements}</span>
								<span>システム機能: {summary.stats.systemFunctions}</span>
								<span>エントリポイント: {summary.stats.entryPoints}</span>
							</div>
						)}

						<div className="space-y-1.5">
							<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
								検出ルール
							</div>
							{visibleIssues.length === 0 ? (
								<div className="text-[13px] text-slate-500">未検出</div>
							) : (
								<ul className="space-y-1.5">
									{visibleIssues.map((issue) => (
										<li
											key={issue.id}
											className="flex items-center justify-between text-[12px] text-slate-600"
										>
											<div className="flex items-center gap-2">
												<Badge
													variant="outline"
													className={`text-[10px] font-medium ${severityClassNames[issue.severity]}`}
												>
													{severityLabels[issue.severity]}
												</Badge>
												<span className="text-slate-700">{issue.label}</span>
											</div>
											<span className="font-mono text-[12px] text-slate-900">
												{issue.missing}/{issue.total}
											</span>
										</li>
									))}
								</ul>
							)}
							{remainingIssues > 0 && (
								<div className="text-[12px] text-slate-400">他 {remainingIssues} 件</div>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
