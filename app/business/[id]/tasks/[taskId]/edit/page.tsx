"use client"

import { use, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { FormField } from "@/components/forms/form-field";
import { RequirementListSection } from "@/components/forms/requirement-list-section";
import type { TaskKnowledge, Requirement } from "@/lib/mock/task-knowledge";
import { getDefaultTaskKnowledge } from "@/lib/mock/task-knowledge";
import {
	syncTaskBasicInfo,
	syncBusinessRequirements,
	syncSystemRequirements,
} from "@/lib/data/task-sync";
import {
	listBusinessRequirementsByTaskId,
} from "@/lib/data/business-requirements";
import {
	listSystemRequirementsByTaskId,
} from "@/lib/data/system-requirements";
import {
	fromBusinessRequirement,
	fromSystemRequirement,
} from "@/lib/data/requirement-mapper";

function nextSequentialId(prefix: string, existingIds: string[]): string {
	const used = new Set(existingIds);
	for (let i = 1; i < 1000; i++) {
		const candidate = `${prefix}-${String(i).padStart(3, "0")}`;
		if (!used.has(candidate)) return candidate;
	}
	return `${prefix}-${Date.now()}`;
}

export default function TaskDetailEditPage({
	params,
}: {
	params: Promise<{ id: string; taskId: string }>;
}): React.ReactElement {
	const { id, taskId } = use(params);
	const router = useRouter();

	const storageKey = `task-knowledge:${id}:${taskId}`;
	const defaultKnowledge = useMemo(
		() => getDefaultTaskKnowledge({ bizId: id, taskId }),
		[id, taskId],
	);

	const [knowledge, setKnowledge] = useState<TaskKnowledge>(defaultKnowledge);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// マウント時にDBから既存データを読み込む
	useEffect(() => {
		async function loadExistingData(): Promise<void> {
			setIsLoading(true);

			try {
				const { data: businessReqs } = await listBusinessRequirementsByTaskId(taskId);
				const { data: systemReqs } = await listSystemRequirementsByTaskId(taskId);

				const { listConcepts } = await import("@/lib/data/concepts");
				const { data: concepts } = await listConcepts();
				const conceptMap = new Map(concepts?.map((c) => [c.id, c.name]) ?? []);

				const loadedBusinessRequirements = businessReqs?.map((br) =>
					fromBusinessRequirement(br, conceptMap)
				) ?? [];

				const loadedSystemRequirements = systemReqs?.map((sr) =>
					fromSystemRequirement(sr, conceptMap)
				) ?? [];

				setKnowledge((prev) => ({
					...prev,
					businessRequirements: loadedBusinessRequirements.length > 0
						? loadedBusinessRequirements
						: prev.businessRequirements,
					systemRequirements: loadedSystemRequirements.length > 0
						? loadedSystemRequirements
						: prev.systemRequirements,
				}));
			} catch (e) {
				console.error("データ読み込みエラー:", e);
			} finally {
				setIsLoading(false);
			}
		}

		loadExistingData();
	}, [taskId]);

	const updateField = <K extends keyof TaskKnowledge>(key: K, value: TaskKnowledge[K]): void => {
		setKnowledge((prev) => ({ ...prev, [key]: value }));
	};

	const updateRequirement = (
		listKey: "businessRequirements" | "systemRequirements",
		reqId: string,
		patch: Partial<Requirement>
	): void => {
		setKnowledge((prev) => ({
			...prev,
			[listKey]: prev[listKey].map((r) => (r.id === reqId ? { ...r, ...patch } : r)),
		}));
	};

	const removeRequirement = (
		listKey: "businessRequirements" | "systemRequirements",
		reqId: string
	): void => {
		setKnowledge((prev) => ({
			...prev,
			[listKey]: prev[listKey].filter((r) => r.id !== reqId),
		}));
	};

	const addRequirement = (type: Requirement["type"]): void => {
		setKnowledge((prev) => {
			const listKey = type === "業務要件" ? "businessRequirements" : "systemRequirements";
			const existingIds = [...prev.businessRequirements, ...prev.systemRequirements].map((r) => r.id);
			const prefix = type === "業務要件" ? `BR-${taskId}` : `SR-${taskId}`;
			const newId = nextSequentialId(prefix, existingIds);

			const nextReq: Requirement = {
				id: newId,
				type,
				title: "",
				summary: "",
				concepts: [],
				impacts: [],
				acceptanceCriteria: [],
				related: [],
			};

			return {
				...prev,
				[listKey]: [...prev[listKey], nextReq],
			};
		});
	};

	const handleSave = async (): Promise<void> => {
		setIsSaving(true);
		setSaveError(null);

		try {
			// LocalStorageにバックアップ
			try {
				window.localStorage.setItem(storageKey, JSON.stringify(knowledge));
			} catch {
				// LocalStorage保存失敗は無視
			}

			// タスク基本情報を同期
			const taskError = await syncTaskBasicInfo(
				taskId,
				knowledge.taskName,
				knowledge.taskSummary,
				knowledge.person ?? "",
				knowledge.input ?? "",
				knowledge.output ?? "",
			);
			if (taskError) {
				setSaveError(taskError);
				return;
			}

			// 業務要件を同期
			const bizError = await syncBusinessRequirements(taskId, knowledge.businessRequirements);
			if (bizError) {
				setSaveError(bizError);
				return;
			}

			// システム要件を同期
			const sysError = await syncSystemRequirements(taskId, knowledge.systemRequirements);
			if (sysError) {
				setSaveError(sysError);
				return;
			}

			// 成功時はLocalStorageをクリア
			try {
				window.localStorage.removeItem(storageKey);
			} catch {
				// クリア失敗は無視
			}

			router.push(`/business/${id}/tasks/${taskId}`);
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : String(e));
		} finally {
			setIsSaving(false);
		}
	};

	const handleReset = (): void => {
		try {
			window.localStorage.removeItem(storageKey);
		} catch {
			// noop
		}
		setKnowledge(defaultKnowledge);
		setSaveError(null);
	};

	return (
		<div className="flex-1 min-h-screen bg-white">
			<div className="mx-auto max-w-[1400px] px-8 py-6">
				{/* ヘッダー: 戻るリンク・アクションボタン */}
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
					<Link
						href={`/business/${id}/tasks/${taskId}`}
						className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900"
					>
						<ArrowLeft className="h-4 w-4" />
						業務タスク詳細に戻る
					</Link>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							className="h-8 gap-2 text-[14px]"
							onClick={handleReset}
							disabled={isLoading || isSaving}
						>
							<RotateCcw className="h-4 w-4" />
							リセット
						</Button>
						<Button
							className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800"
							onClick={handleSave}
							disabled={isLoading || isSaving}
						>
							{isSaving ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									保存中...
								</>
							) : (
								<>
									<Save className="h-4 w-4" />
									保存
								</>
							)}
						</Button>
					</div>
				</div>

				<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">業務タスク編集</h1>

				{/* ローディング表示 */}
				{isLoading && (
					<div className="mb-6 flex items-center gap-2 text-[13px] text-slate-500">
						<Loader2 className="h-4 w-4 animate-spin" />
						データを読み込み中...
					</div>
				)}

				{/* エラー表示 */}
				{saveError && (
					<div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2">
						<AlertCircle className="h-4 w-4 text-rose-600 mt-0.5" />
						<div className="text-[13px] text-rose-700">保存エラー: {saveError}</div>
					</div>
				)}

				{/* 基本情報カード */}
				<Card className="rounded-md border border-slate-200">
					<CardContent className="p-3 space-y-3">
						<div className="flex items-center gap-3 text-[12px] text-slate-500">
							<span className="font-mono">{knowledge.bizId}</span>
							<span className="text-slate-300">/</span>
							<span className="font-mono">{knowledge.taskId}</span>
						</div>

						<FormField
							type="input"
							label="業務タスク"
							value={knowledge.taskName}
							onChange={(v) => updateField("taskName", v)}
							inputClassName="text-[16px] font-semibold"
						/>

						<FormField
							type="textarea"
							label="業務概要"
							value={knowledge.taskSummary}
							onChange={(v) => updateField("taskSummary", v)}
						/>

						<div className="grid gap-3 md:grid-cols-3">
							<FormField
								type="input"
								label="担当者"
								value={knowledge.person ?? ""}
								onChange={(v) => updateField("person", v)}
							/>
							<FormField
								type="input"
								label="インプット"
								value={knowledge.input ?? ""}
								onChange={(v) => updateField("input", v)}
							/>
							<FormField
								type="input"
								label="アウトプット"
								value={knowledge.output ?? ""}
								onChange={(v) => updateField("output", v)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* 業務要件セクション */}
				<RequirementListSection
					title="業務要件"
					requirements={knowledge.businessRequirements}
					onAdd={() => addRequirement("業務要件")}
					onUpdate={(reqId, patch) => updateRequirement("businessRequirements", reqId, patch)}
					onRemove={(reqId) => removeRequirement("businessRequirements", reqId)}
				/>
			</div>
		</div>
	);
}
