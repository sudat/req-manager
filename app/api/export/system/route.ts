import { NextResponse } from "next/server";
import { listSystemDomains } from "@/lib/data/system-domains";
import { listSystemFunctionsByDomain } from "@/lib/data/system-functions";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import {
  buildChildrenMap,
  buildExcelBuffer,
  createExcelDownloadResponse,
  createExportErrorResponse,
} from "@/lib/export/excel-route";

/**
 * システム一覧（SD→SF→SR）をExcelでエクスポート
 */
export async function GET() {
  try {
    const { data: domains, error: domainError } = await listSystemDomains();
    if (domainError) {
      return NextResponse.json({ error: domainError }, { status: 500 });
    }
    if (!domains || domains.length === 0) {
      return NextResponse.json({ error: "No system domain data found" }, { status: 404 });
    }

    const functionsMap = await buildChildrenMap(
      domains,
      (domain) => domain.id,
      async (domain) => {
        const { data } = await listSystemFunctionsByDomain(domain.id);
        return data;
      },
    );

    const allFunctions = Array.from(functionsMap.values()).flat();
    const requirementsMap = await buildChildrenMap(
      allFunctions,
      (func) => func.id,
      async (func) => {
        const { data } = await listSystemRequirementsBySrfId(func.id);
        return data;
      },
    );

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

    const buffer = await buildExcelBuffer("システム一覧", [
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
    ], rows);

    return createExcelDownloadResponse(buffer, "system_export");
  } catch (error) {
    return createExportErrorResponse("Failed to export system data", error);
  }
}
