import { NextResponse } from "next/server";
import { Workbook } from "exceljs";
import { listSystemDomains } from "@/lib/data/system-domains";
import { listSystemFunctionsByDomain } from "@/lib/data/system-functions";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";

/**
 * システム一覧（SD→SF→SR）をExcelでエクスポート
 */
export async function GET() {
  try {
    // 1. 全部のSDを取得
    const { data: domains, error: domainError } = await listSystemDomains();
    if (domainError) {
      return NextResponse.json({ error: domainError }, { status: 500 });
    }
    if (!domains || domains.length === 0) {
      return NextResponse.json({ error: "No system domain data found" }, { status: 404 });
    }

    // 2. SDに紐づくSFを取得
    const functionsMap = new Map<string, Awaited<ReturnType<typeof listSystemFunctionsByDomain>>["data"]>();

    for (const domain of domains) {
      const { data: functions } = await listSystemFunctionsByDomain(domain.id);
      functionsMap.set(domain.id, functions);
    }

    // 3. SFに紐づくSRを取得
    const allSrfIds: string[] = [];
    for (const functions of functionsMap.values()) {
      if (functions) {
        allSrfIds.push(...functions.map((f) => f.id));
      }
    }

    const requirementsMap = new Map<string, Awaited<ReturnType<typeof listSystemRequirementsBySrfId>>["data"]>();
    for (const srfId of allSrfIds) {
      const { data: requirements } = await listSystemRequirementsBySrfId(srfId);
      requirementsMap.set(srfId, requirements);
    }

    // 4. フラットな構造に変換
    const rows: Array<{
      domainId: string;
      domainName: string;
      domainDescription: string;
      functionId: string;
      functionCategory: string;
      functionTitle: string;
      functionSummary: string;
      functionDesignPolicy: string;
      functionStatus: string;
      reqId: string;
      reqTitle: string;
      reqSummary: string;
      reqCategory: string;
    }> = [];

    for (const domain of domains) {
      const functions = functionsMap.get(domain.id);
      if (!functions || functions.length === 0) {
        // SFがない場合はSDのみの行を追加
        rows.push({
          domainId: domain.id,
          domainName: domain.name,
          domainDescription: domain.description,
          functionId: "",
          functionCategory: "",
          functionTitle: "",
          functionSummary: "",
          functionDesignPolicy: "",
          functionStatus: "",
          reqId: "",
          reqTitle: "",
          reqSummary: "",
          reqCategory: "",
        });
        continue;
      }

      for (const func of functions) {
        const funcReqs = requirementsMap.get(func.id);
        if (!funcReqs || funcReqs.length === 0) {
          // SRがない場合はSD+SFのみの行を追加
          rows.push({
            domainId: domain.id,
            domainName: domain.name,
            domainDescription: domain.description,
            functionId: func.id,
            functionCategory: func.category,
            functionTitle: func.title,
            functionSummary: func.summary,
            functionDesignPolicy: func.designPolicy,
            functionStatus: func.status,
            reqId: "",
            reqTitle: "",
            reqSummary: "",
            reqCategory: "",
          });
          continue;
        }

        for (const req of funcReqs) {
          rows.push({
            domainId: domain.id,
            domainName: domain.name,
            domainDescription: domain.description,
            functionId: func.id,
            functionCategory: func.category,
            functionTitle: func.title,
            functionSummary: func.summary,
            functionDesignPolicy: func.designPolicy,
            functionStatus: func.status,
            reqId: req.id,
            reqTitle: req.title,
            reqSummary: req.summary,
            reqCategory: req.category,
          });
        }
      }
    }

    // 5. Excel生成
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("システム一覧");

    // ヘッダー設定
    worksheet.columns = [
      { header: "システム領域ID", key: "domainId", width: 15 },
      { header: "システム領域名", key: "domainName", width: 30 },
      { header: "システム領域説明", key: "domainDescription", width: 40 },
      { header: "システム機能ID", key: "functionId", width: 15 },
      { header: "システム機能カテゴリ", key: "functionCategory", width: 20 },
      { header: "システム機能タイトル", key: "functionTitle", width: 30 },
      { header: "システム機能概要", key: "functionSummary", width: 40 },
      { header: "システム機能設計方針", key: "functionDesignPolicy", width: 40 },
      { header: "システム機能ステータス", key: "functionStatus", width: 15 },
      { header: "システム要件ID", key: "reqId", width: 15 },
      { header: "システム要件タイトル", key: "reqTitle", width: 30 },
      { header: "システム要件概要", key: "reqSummary", width: 40 },
      { header: "システム要件カテゴリ", key: "reqCategory", width: 15 },
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
        "Content-Disposition": `attachment; filename="system_export_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export system data" },
      { status: 500 }
    );
  }
}
