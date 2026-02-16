"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TaskBasicInfoCard } from "../components/TaskBasicInfoCard";
import { useBasicInfoForm } from "../hooks/useBasicInfoForm";
import { useMasterData } from "../hooks/useMasterData";
import type { TaskKnowledge } from "@/lib/domain";

export default function TaskEditBasicPage({
	params,
}: {
	params: Promise<{ id: string; taskId: string }>;
}) {
	const { id: businessKey, taskId } = use(params);
	const router = useRouter();
	const storageKey = `task-basic-info:${businessKey}:${taskId}`;

	const {
		loading,
		saving,
		error,
		existingTask,
		taskName,
		setTaskName,
		taskSummary,
		setTaskSummary,
		triggerDescription,
		setTriggerDescription,
		triggerTaskIds,
		setTriggerTaskIds,
		frequency,
		setFrequency,
		frequencyDescription,
		setFrequencyDescription,
		processSteps,
		setProcessSteps,
		input,
		setInput,
		output,
		setOutput,
		conceptIdsYaml,
		setConceptIdsYaml,
		handleSave,
	} = useBasicInfoForm({
		taskId,
		bizId: businessKey,
		storageKey,
	});

	const { concepts, tasks } = useMasterData();

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
			</div>
		);
	}

	if (error || !existingTask) {
		return (
			<div className="p-8">
				<div className="text-center text-rose-600">
					エラー: {error || "タスクが見つかりません"}
				</div>
			</div>
		);
	}

	return (
		<div className="p-8">
			<Link
				href={`/business/${businessKey}/${taskId}`}
				className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
			>
				<ArrowLeft className="h-4 w-4" />
				業務タスク詳細に戻る
			</Link>

			<div className="mb-6">
				<h1 className="text-2xl font-bold text-slate-900">
					編集: {existingTask.taskName} - 基本情報
				</h1>
			</div>

			<div className="max-w-[1400px]">
				<TaskBasicInfoCard
					knowledge={{
						...existingTask,
						taskName,
						taskSummary,
						triggerDescription,
						triggerTaskIds,
						frequency,
						frequencyDescription,
						processSteps,
						input,
						output,
						conceptIdsYaml,
					}}
					onFieldChange={(key, value) => {
						switch (key) {
							case "taskName":
								setTaskName(value as string);
								break;
						case "taskSummary":
							setTaskSummary(value as string);
							break;
						case "triggerDescription":
								setTriggerDescription(value as string);
								break;
							case "triggerTaskIds":
								setTriggerTaskIds(value as string[]);
								break;
							case "frequency":
								setFrequency(value as TaskKnowledge['frequency']);
								break;
							case "frequencyDescription":
								setFrequencyDescription(value as string);
								break;
							case "processSteps":
								setProcessSteps(value as string);
								break;
							case "input":
								setInput(value as string);
								break;
							case "output":
								setOutput(value as string);
								break;
							case "conceptIdsYaml":
								setConceptIdsYaml(value as string);
								break;
						}
					}}
					concepts={concepts}
					tasks={tasks}
				/>

				<div className="mt-6 flex items-center gap-3">
					<Button
						onClick={() => handleSave(() => toast.success("基本情報を保存しました"))}
						disabled={saving}
					>
						{saving ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								保存中...
							</>
						) : (
							"保存"
						)}
					</Button>
					<Button
						variant="outline"
						onClick={() => router.push(`/business/${businessKey}/${taskId}`)}
						disabled={saving}
					>
						キャンセル
					</Button>
				</div>

				{error && (
					<div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-700">
						{error}
					</div>
				)}
			</div>
		</div>
	);
}
