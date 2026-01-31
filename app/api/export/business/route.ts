import { NextResponse } from "next/server";
import { Workbook } from "exceljs";
import { listBusinesses } from "@/lib/data/businesses";
import { listTasksByBusinessId } from "@/lib/data/tasks";
import { listBusinessRequirementsByTaskIds } from "@/lib/data/business-requirements";

/**
 * 業務一覧（BD→BT→BR）をExcelでエクスポート
 */
export async function GET() {
  try {
    // 1. 全部のBDを取得
    const { data: businesses, error: bizError } = await listBusinesses();
    if (bizError) {
      return NextResponse.json({ error: bizError }, { status: 500 });
    }
    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ error: "No business data found" }, { status: 404 });
    }

    // 2. BDに紐づくBTを取得
    const businessIds = businesses.map((b) => b.id);
    const tasksMap = new Map<string, Awaited<ReturnType<typeof listTasksByBusinessId>>["data"]>();

    for (const businessId of businessIds) {
      const { data: tasks } = await listTasksByBusinessId(businessId);
      tasksMap.set(businessId, tasks);
    }

    // 3. BTに紐づくBRを取得
    const allTaskIds: string[] = [];
    for (const tasks of tasksMap.values()) {
      if (tasks) {
        allTaskIds.push(...tasks.map((t) => t.id));
      }
    }

    const { data: requirements } = await listBusinessRequirementsByTaskIds(allTaskIds);
    const requirementsMap = new Map<string, typeof requirements>();
    if (requirements) {
      for (const req of requirements) {
        const list = requirementsMap.get(req.taskId) ?? [];
        list.push(req);
        requirementsMap.set(req.taskId, list);
      }
    }

    // 4. フラットな構造に変換
    const rows: Array<{
      businessId: string;
      businessName: string;
      businessArea: string;
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
      const tasks = tasksMap.get(business.id);
      if (!tasks || tasks.length === 0) {
        // BTがない場合はBDのみの行を追加
        rows.push({
          businessId: business.id,
          businessName: business.name,
          businessArea: business.area,
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
            businessId: business.id,
            businessName: business.name,
            businessArea: business.area,
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
            businessId: business.id,
            businessName: business.name,
            businessArea: business.area,
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

    // 5. Excel生成
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("業務一覧");

    // ヘッダー設定
    worksheet.columns = [
      { header: "業務分類ID", key: "businessId", width: 15 },
      { header: "業務分類名", key: "businessName", width: 30 },
      { header: "業務分類エリア", key: "businessArea", width: 15 },
      { header: "業務タスクID", key: "taskId", width: 15 },
      { header: "業務タスク名", key: "taskName", width: 30 },
      { header: "業務タスク概要", key: "taskSummary", width: 40 },
      { header: "業務要件ID", key: "reqId", width: 15 },
      { header: "業務要件タイトル", key: "reqTitle", width: 30 },
      { header: "業務要件目的", key: "reqGoal", width: 40 },
      { header: "業務要件制約", key: "reqConstraints", width: 40 },
      { header: "業務要件所有者", key: "reqOwner", width: 20 },
    ];

    // ヘッダースタイル
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, name: "Meiryo UI" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    });

    // データ行追加
    for (const row of rows) {
      const addedRow = worksheet.addRow(row);
      addedRow.eachCell((cell) => {
        cell.font = { name: "Meiryo UI" };
      });
    }

    // 6. バッファ生成してレスポンス
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="business_export_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export business data" },
      { status: 500 }
    );
  }
}
