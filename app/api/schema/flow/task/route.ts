import { NextResponse } from "next/server";
import { getTaskById } from "@/lib/data/tasks";
import {
	isProcessFlowV2Yaml,
	parseYamlProcessFlow,
	parseYamlProcessSteps,
} from "@/lib/utils/yaml";
import {
	taskProcessFlowToMermaidFlow,
	taskProcessStepsToMermaidFlow,
} from "@/lib/utils/business-flow/task-flow-to-mermaid";

/**
 * 業務タスク単体フローのMermaid DSLを取得するAPI
 *
 * @param request - リクエスト（projectId, taskId をクエリで受け取る）
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId");
		const taskId = searchParams.get("taskId");

		if (!projectId) {
			return NextResponse.json(
				{ error: "プロジェクトIDが必要です" },
				{ status: 400 }
			);
		}
		if (!taskId) {
			return NextResponse.json(
				{ error: "業務タスクIDが必要です" },
				{ status: 400 }
			);
		}

		const { data: task, error } = await getTaskById(taskId, projectId);
		if (error) {
			console.error("Failed to fetch task:", error);
			return NextResponse.json(
				{ error: "業務タスクの取得に失敗しました" },
				{ status: 500 }
			);
		}
		if (!task) {
			return NextResponse.json(
				{ error: "業務タスクが見つかりません" },
				{ status: 404 }
			);
		}

		const processStepsText = task.processSteps ?? "";
		const isV2Flow = isProcessFlowV2Yaml(processStepsText);

		let warnings: string[] = [];
		let mermaidCode = "";
		if (isV2Flow) {
			const parsedFlow = parseYamlProcessFlow(processStepsText);
			const result = taskProcessFlowToMermaidFlow(parsedFlow.value, {
				taskId: task.id,
				taskName: task.name,
			});
			mermaidCode = result.mermaidCode;
			warnings = [...result.warnings];
			if (parsedFlow.error) {
				warnings.unshift(`YAML構文エラー: ${parsedFlow.error}`);
			}
		} else {
			const parsedProcessSteps = parseYamlProcessSteps(processStepsText);
			const result = taskProcessStepsToMermaidFlow(parsedProcessSteps.value, {
				taskId: task.id,
				taskName: task.name,
			});
			mermaidCode = result.mermaidCode;
			warnings = [...result.warnings];
			if (parsedProcessSteps.error) {
				warnings.unshift(`YAML構文エラー: ${parsedProcessSteps.error}`);
			}
		}

		return NextResponse.json({
			mermaidCode,
			warnings,
			taskInfo: {
				id: task.id,
				name: task.name,
			},
		});
	} catch (error) {
		console.error("Task flow generation error:", error);
		return NextResponse.json(
			{ error: "業務タスクフローの生成に失敗しました" },
			{ status: 500 }
		);
	}
}
