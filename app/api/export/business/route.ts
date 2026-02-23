import { NextResponse } from "next/server";
import { listBusinesses } from "@/lib/data/businesses";
import { listTasksByBusinessArea } from "@/lib/data/tasks";
import { listBusinessRequirementsByTaskIds } from "@/lib/data/business-requirements";
import {
  buildChildrenMap,
  buildExcelBuffer,
  createExcelDownloadResponse,
  createExportErrorResponse,
  groupByKey,
} from "@/lib/export/excel-route";

/**
 * 業務一覧（BD→BT→BR）をExcelでエクスポート
 */
export async function GET() {
  try {
    const { data: businesses, error: bizError } = await listBusinesses();
    if (bizError) {
      return NextResponse.json({ error: bizError }, { status: 500 });
    }
    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ error: "No business data found" }, { status: 404 });
    }

    const tasksMap = await buildChildrenMap(
      businesses,
      (business) => business.area,
      async (business) => {
        const { data } = await listTasksByBusinessArea(business.area);
        return data;
      },
    );

    const allTaskIds = Array.from(tasksMap.values())
      .flat()
      .map((task) => task.id);

    const { data: requirements } = await listBusinessRequirementsByTaskIds(allTaskIds);
    const requirementsMap = groupByKey(requirements, (req) => req.taskId);

    const rows: Array<{
      businessArea: string;
      businessName: string;
      taskId: string;
      taskName: string;
      taskSummary: string;
      reqId: string;
      reqTitle: string;
      reqGoal: string;
      reqConstraints: string;
      reqOwner: string;
    }> = [];

    for (const business of businesses) {
      const tasks = tasksMap.get(business.area);
      if (!tasks || tasks.length === 0) {
        // BTがない場合はBDのみの行を追加
        rows.push({
          businessArea: business.area,
          businessName: business.name,
          taskId: "",
          taskName: "",
          taskSummary: "",
          reqId: "",
          reqTitle: "",
          reqGoal: "",
          reqConstraints: "",
          reqOwner: "",
        });
        continue;
      }

      for (const task of tasks) {
        const taskReqs = requirementsMap.get(task.id);
        if (!taskReqs || taskReqs.length === 0) {
          // BRがない場合はBD+BTのみの行を追加
          rows.push({
            businessArea: business.area,
            businessName: business.name,
            taskId: task.id,
            taskName: task.name,
            taskSummary: task.summary,
            reqId: "",
            reqTitle: "",
            reqGoal: "",
            reqConstraints: "",
            reqOwner: "",
          });
          continue;
        }

        for (const req of taskReqs) {
          rows.push({
            businessArea: business.area,
            businessName: business.name,
            taskId: task.id,
            taskName: task.name,
            taskSummary: task.summary,
            reqId: req.id,
            reqTitle: req.title,
            reqGoal: req.goal,
            reqConstraints: req.constraints,
            reqOwner: req.owner,
          });
        }
      }
    }

    const buffer = await buildExcelBuffer("業務一覧", [
      { header: "業務領域コード", key: "businessArea", width: 15 },
      { header: "業務分類名", key: "businessName", width: 30 },
      { header: "業務タスクID", key: "taskId", width: 15 },
      { header: "業務タスク名", key: "taskName", width: 30 },
      { header: "業務タスク概要", key: "taskSummary", width: 40 },
      { header: "業務要件ID", key: "reqId", width: 15 },
      { header: "業務要件タイトル", key: "reqTitle", width: 30 },
      { header: "業務要件目的", key: "reqGoal", width: 40 },
      { header: "業務要件制約", key: "reqConstraints", width: 40 },
      { header: "業務要件所有者", key: "reqOwner", width: 20 },
    ], rows);

    return createExcelDownloadResponse(buffer, "business_export");
  } catch (error) {
    return createExportErrorResponse("Failed to export business data", error);
  }
}
