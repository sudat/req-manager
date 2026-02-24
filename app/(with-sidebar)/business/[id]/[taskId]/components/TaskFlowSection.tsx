"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { SchemaViewer } from "@/components/schema/SchemaViewer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FlowMode = "task" | "business";

type FlowResponse = {
	mermaidCode: string;
	warnings?: string[];
};

type TaskFlowSectionProps = {
	taskId: string;
	businessArea: string;
	projectId?: string;
	projectLoading?: boolean;
};

export function TaskFlowSection({
	taskId,
	businessArea,
	projectId,
	projectLoading = false,
}: TaskFlowSectionProps) {
	const [mode, setMode] = useState<FlowMode>("task");
	const [mermaidCode, setMermaidCode] = useState("");
	const [warnings, setWarnings] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (projectLoading) return;
		if (!projectId) {
			setLoading(false);
			setError("プロジェクトが選択されていません。");
			setMermaidCode("");
			setWarnings([]);
			return;
		}

		let active = true;
		const controller = new AbortController();

		const fetchFlow = async () => {
			try {
				setLoading(true);
				setError(null);

				const endpoint =
					mode === "task"
						? `/api/schema/flow/task?projectId=${encodeURIComponent(projectId)}&taskId=${encodeURIComponent(taskId)}`
						: `/api/schema/flow/business?projectId=${encodeURIComponent(projectId)}&businessArea=${encodeURIComponent(businessArea)}`;

				const response = await fetch(endpoint, { signal: controller.signal });
				const data = (await response.json()) as FlowResponse & { error?: string };

				if (!response.ok) {
					throw new Error(data.error || "フロー図の取得に失敗しました。");
				}

				if (!active) return;
				setMermaidCode(data.mermaidCode ?? "");
				setWarnings(data.warnings ?? []);
			} catch (fetchError) {
				if (!active) return;
				if (fetchError instanceof Error && fetchError.name === "AbortError") {
					return;
				}
				setError(
					fetchError instanceof Error
						? fetchError.message
						: "フロー図の取得中にエラーが発生しました。"
				);
				setMermaidCode("");
				setWarnings([]);
			} finally {
				if (active) setLoading(false);
			}
		};

		fetchFlow();

		return () => {
			active = false;
			controller.abort();
		};
	}, [businessArea, mode, projectId, projectLoading, taskId]);

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between border-l-4 border-brand-600 pl-3">
				<h2 className="text-[18px] font-semibold text-slate-900">業務フロー</h2>
			</div>

			<Tabs
				value={mode}
				onValueChange={(value) => setMode(value as FlowMode)}
				className="space-y-3"
			>
				<TabsList className="grid w-[300px] grid-cols-2">
					<TabsTrigger value="task">BT内フロー</TabsTrigger>
					<TabsTrigger value="business">全体フロー</TabsTrigger>
				</TabsList>
			</Tabs>

			<div className="rounded-md border border-slate-200 bg-white p-4">
				{loading ? (
					<div className="flex min-h-[360px] items-center justify-center text-slate-600">
						<Loader2 className="mr-2 h-5 w-5 animate-spin" />
						フロー図を生成しています...
					</div>
				) : error ? (
					<div className="flex min-h-[120px] items-center rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
						<AlertTriangle className="mr-2 h-4 w-4 shrink-0" />
						{error}
					</div>
				) : (
					<div className="min-h-[360px]">
						<SchemaViewer code={mermaidCode} />
					</div>
				)}
			</div>

			{warnings.length > 0 && (
				<details className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
					<summary className="cursor-pointer text-[13px] font-medium text-amber-700">
						警告 ({warnings.length}件)
					</summary>
					<ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-amber-700">
						{warnings.map((warning, index) => (
							<li key={`${warning}-${index}`}>{warning}</li>
						))}
					</ul>
				</details>
			)}
		</section>
	);
}
