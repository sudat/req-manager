"use client";

import { useState } from "react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { downloadExcel, formatDateForFilename } from "@/lib/export/utils";

export default function ExportPage() {
  const [isBusinessExporting, setIsBusinessExporting] = useState(false);
  const [isSystemExporting, setIsSystemExporting] = useState(false);

  const handleBusinessExport = async () => {
    setIsBusinessExporting(true);
    try {
      const response = await fetch("/api/export/business");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const filename = `business_export_${formatDateForFilename()}.xlsx`;
      downloadExcel(blob, filename);
    } catch (error) {
      console.error("Business export error:", error);
      alert("業務一覧のエクスポートに失敗しました");
    } finally {
      setIsBusinessExporting(false);
    }
  };

  const handleSystemExport = async () => {
    setIsSystemExporting(true);
    try {
      const response = await fetch("/api/export/system");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const filename = `system_export_${formatDateForFilename()}.xlsx`;
      downloadExcel(blob, filename);
    } catch (error) {
      console.error("System export error:", error);
      alert("システム一覧のエクスポートに失敗しました");
    } finally {
      setIsSystemExporting(false);
    }
  };

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <PageHeader
            title="エクスポート"
            description="要件・仕様データのエクスポート"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand" />
                  業務一覧をエクスポート
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-4">
                  業務分類（BD）→ 業務タスク（BT）→ 業務要件（BR）のデータをExcel形式でエクスポートします
                </p>
                <Button
                  className="w-full bg-brand hover:bg-brand-600 gap-2"
                  onClick={handleBusinessExport}
                  disabled={isBusinessExporting}
                >
                  {isBusinessExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isBusinessExporting ? "エクスポート中..." : "Excelダウンロード"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand" />
                  システム一覧をエクスポート
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-4">
                  システム領域（SD）→ システム機能（SF）→ システム要件（SR）のデータをExcel形式でエクスポートします
                </p>
                <Button
                  className="w-full bg-brand hover:bg-brand-600 gap-2"
                  onClick={handleSystemExport}
                  disabled={isSystemExporting}
                >
                  {isSystemExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isSystemExporting ? "エクスポート中..." : "Excelダウンロード"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
