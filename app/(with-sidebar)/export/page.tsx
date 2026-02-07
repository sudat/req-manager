"use client";

import { useState } from "react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { FileText, Download, Loader2, Archive } from "lucide-react";
import { downloadExcel, formatDateForFilename } from "@/lib/export/utils";

const CHAPTER7_FILES = [
  { path: "INDEX.md", label: "ルーティング表" },
  { path: "product-requirement.yml", label: "プロダクト要件" },
  { path: "concept-dictionary.yml", label: "概念辞書" },
  { path: "business/", label: "業務側正本" },
  { path: "system/", label: "システム側正本" },
  { path: "graph/", label: "リンクグラフ" },
  { path: "VERSION.md", label: "版情報" },
];

const EXCEL_EXPORTS = [
  {
    key: "business",
    title: "業務一覧",
    chain: ["BD", "BT", "BR"],
  },
  {
    key: "system",
    title: "システム一覧",
    chain: ["SD", "SF", "SR"],
  },
] as const;

export default function ExportPage() {
  const [exporting, setExporting] = useState<Record<string, boolean>>({});

  const setExportState = (key: string, value: boolean) =>
    setExporting((prev) => ({ ...prev, [key]: value }));

  const handleRequirementsExport = async () => {
    setExportState("requirements", true);
    try {
      const response = await fetch("/api/export/requirements");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }
      const blob = await response.blob();
      const filename = `requirements_export_${formatDateForFilename()}.zip`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Requirements export error:", error);
      alert("7章形式エクスポートに失敗しました");
    } finally {
      setExportState("requirements", false);
    }
  };

  const handleExcelExport = async (key: string) => {
    setExportState(key, true);
    try {
      const response = await fetch(`/api/export/${key}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }
      const blob = await response.blob();
      const filename = `${key}_export_${formatDateForFilename()}.xlsx`;
      downloadExcel(blob, filename);
    } catch (error) {
      console.error(`${key} export error:`, error);
      alert(`${key === "business" ? "業務一覧" : "システム一覧"}のエクスポートに失敗しました`);
    } finally {
      setExportState(key, false);
    }
  };

  return (
    <>
      <MobileHeader />
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-8 py-6">

          {/* ── ページヘッダー ── */}
          <div className="mb-8">
            <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">エクスポート</h1>
            <p className="text-[14px] text-slate-500 mt-1">要件データの出力</p>
          </div>

          {/* ── ヒーロー: 7章形式エクスポート ── */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                  <Archive className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-900">7章形式エクスポート</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">要件の正本をClaude Codeが読み込める構成で出力</p>
                </div>
              </div>
              <span className="id-label--brand shrink-0">Claude Code連携用</span>
            </div>

            {/* ファイル構成チップ */}
            <div className="flex flex-wrap gap-2 mb-5">
              {CHAPTER7_FILES.map((f) => (
                <div
                  key={f.path}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
                >
                  <span className="font-mono text-[11px] text-slate-600">{f.path}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] text-slate-400">{f.label}</span>
                </div>
              ))}
            </div>

            {/* アクション */}
            <button
              onClick={handleRequirementsExport}
              disabled={exporting.requirements}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-[13px] font-medium rounded-md hover:bg-brand-600 disabled:opacity-50 transition-colors duration-150"
            >
              {exporting.requirements ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {exporting.requirements ? "エクスポート中..." : "ZIPダウンロード"}
              <span className="id-label ml-1">.zip</span>
            </button>
          </div>

          {/* ── セクションセパレータ ── */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">データテーブル出力</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* ── Excel エクスポート（2カラム）── */}
          <div className="grid gap-4 md:grid-cols-2">
            {EXCEL_EXPORTS.map((item) => (
              <div key={item.key} className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-slate-900">{item.title}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        {item.chain.map((code, i) => (
                          <span key={code} className="inline-flex items-center gap-1">
                            {i > 0 && <span className="text-slate-300 text-[11px]">→</span>}
                            <span className="id-label">{code}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="id-label">.xlsx</span>
                </div>

                <button
                  onClick={() => handleExcelExport(item.key)}
                  disabled={exporting[item.key]}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-[13px] font-medium rounded hover:bg-slate-50 disabled:opacity-50 transition-colors duration-150"
                >
                  {exporting[item.key] ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {exporting[item.key] ? "エクスポート中..." : "ダウンロード"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
