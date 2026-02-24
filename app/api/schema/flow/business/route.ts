import { NextResponse } from "next/server";
import { listTasksByBusinessArea } from "@/lib/data/tasks";
import { businessTasksToMermaidFlow } from "@/lib/utils/business-flow/business-flow-to-mermaid";

/**
 * 業務領域全体フローのMermaid DSLを取得するAPI
 *
 * @param request - リクエスト（projectId, businessArea をクエリで受け取る）
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId");
		const businessArea = searchParams.get("businessArea");

		if (!projectId) {
			return NextResponse.json(
				{ error: "プロジェクトIDが必要です" },
				{ status: 400 }
			);
		}
		if (!businessArea) {
			return NextResponse.json(
				{ error: "業務領域IDが必要です" },
				{ status: 400 }
			);
		}

		const { data: tasks, error } = await listTasksByBusinessArea(
			businessArea,
			projectId
		);
		if (error) {
			console.error("Failed to fetch tasks by business area:", error);
			return NextResponse.json(
				{ error: "業務タスクの取得に失敗しました" },
				{ status: 500 }
			);
		}

		const result = businessTasksToMermaidFlow(tasks ?? [], businessArea);
		return NextResponse.json({
			mermaidCode: result.mermaidCode,
			warnings: result.warnings,
			taskCount: tasks?.length ?? 0,
			businessArea,
		});
	} catch (error) {
		console.error("Business flow generation error:", error);
		return NextResponse.json(
			{ error: "業務領域フローの生成に失敗しました" },
			{ status: 500 }
		);
	}
}
