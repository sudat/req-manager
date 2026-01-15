import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Pencil } from "lucide-react";
import { getTicketById } from "@/lib/mock/data/tickets/tickets";
import { TicketBasicInfoCard } from "@/components/tickets/ticket-basic-info-card";
import { TicketImpactCard } from "@/components/tickets/ticket-impact-card";
import { TicketChangeItemsCard } from "@/components/tickets/ticket-change-items-card";
import { TicketRelatedConceptsCard } from "@/components/tickets/ticket-related-concepts-card";
import { TicketVersionCard } from "@/components/tickets/ticket-version-card";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = getTicketById(id);

  if (!ticket) {
    notFound();
  }

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/tickets" className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              変更要求一覧に戻る
            </Link>
            <div className="flex items-center gap-2">
              <Link href={`/tickets/${id}/edit`}>
                <Button variant="outline" className="h-8 px-4 text-[14px] font-medium border-slate-200 hover:bg-slate-50 gap-2">
                  <Pencil className="h-4 w-4" />
                  編集
                </Button>
              </Link>
              <Button className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800">
                <CheckCircle2 className="h-4 w-4" />
                ベースラインに反映
              </Button>
            </div>
          </div>

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-4">{ticket.title}</h1>

          <div className="space-y-4">
            <TicketBasicInfoCard ticket={ticket} />
            <TicketImpactCard ticket={ticket} />
            <TicketChangeItemsCard changeItems={ticket.changeItems || []} />
            <TicketRelatedConceptsCard ticket={ticket} />
            <TicketVersionCard ticket={ticket} />
          </div>
        </div>
      </div>
    </>
  );
}
