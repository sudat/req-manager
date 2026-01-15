"use client"

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTicketById } from "@/lib/mock/data/tickets/tickets";
import { useTicketForm } from "@/hooks/use-ticket-form";
import { TicketBasicInfoForm } from "@/components/tickets/ticket-basic-info-form";
import { TicketScopeForm } from "@/components/tickets/ticket-scope-form";
import { TicketChangeItemEditor } from "@/components/tickets/ticket-change-item-editor";

export default function TicketEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const existingTicket = getTicketById(id);

  const form = useTicketForm(existingTicket);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("保存しました（デモ）");
  };

  if (!existingTicket) {
    return (
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          <p className="text-slate-600">チケットが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] p-8">
        <Link href={`/tickets/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          チケット詳細に戻る
        </Link>

        <h1 className="text-2xl font-semibold text-slate-900 mb-6">変更要求を編集</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <TicketBasicInfoForm
            ticket={existingTicket}
            title={form.title}
            setTitle={form.setTitle}
            changeSummary={form.changeSummary}
            setChangeSummary={form.setChangeSummary}
            expectedBenefit={form.expectedBenefit}
            setExpectedBenefit={form.setExpectedBenefit}
            description={form.description}
            setDescription={form.setDescription}
            background={form.background}
            setBackground={form.setBackground}
            status={form.status}
            setStatus={form.setStatus}
            priority={form.priority}
            setPriority={form.setPriority}
          />

          <TicketScopeForm
            selectedBusinessIds={form.selectedBusinessIds}
            toggleBusiness={form.toggleBusiness}
            selectedAreas={form.selectedAreas}
            toggleArea={form.toggleArea}
            targetVersions={form.targetVersions}
            setTargetVersions={form.setTargetVersions}
          />

          <TicketChangeItemEditor
            changeItems={form.changeItems}
            updateChangeItem={form.updateChangeItem}
            addChangeItem={form.addChangeItem}
            removeChangeItem={form.removeChangeItem}
          />

          <Card className="p-4 bg-slate-50 border-slate-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-slate-500 mt-0.5" />
              <div className="text-xs text-slate-600">
                <p className="font-medium mb-1">編集内容の保存について</p>
                <p>現在はデモ実装のため、保存ボタンを押してもデータは更新されません。将来的にはAPI連携を実装予定です。</p>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Link href={`/tickets/${id}`}>
              <Button type="button" variant="outline">
                キャンセル
              </Button>
            </Link>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
              保存
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
