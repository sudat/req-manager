import { MobileHeader } from "@/components/layout/mobile-header";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export default function ExportPage() {
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
                  PDF形式でエクスポート
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-4">
                  すべての要件・仕様をPDF形式でエクスポートします
                </p>
                <Button className="w-full bg-brand hover:bg-brand-600 gap-2">
                  <Download className="h-4 w-4" />
                  PDFダウンロード
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand" />
                  Excel形式でエクスポート
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-4">
                  すべての要件・仕様をExcel形式でエクスポートします
                </p>
                <Button className="w-full bg-brand hover:bg-brand-600 gap-2">
                  <Download className="h-4 w-4" />
                  Excelダウンロード
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
