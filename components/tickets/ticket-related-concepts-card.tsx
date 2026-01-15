import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Ticket } from "@/lib/domain";

interface TicketRelatedConceptsCardProps {
  ticket: Ticket;
}

export function TicketRelatedConceptsCard({ ticket }: TicketRelatedConceptsCardProps) {
  if (!ticket.relatedConcepts || ticket.relatedConcepts.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-md border border-slate-200">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-900">関連概念</h3>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">AI候補</Badge>
        </div>

        <div className="space-y-2">
          {ticket.relatedConcepts.map((concept) => (
            <div key={concept.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <Link href={`/ideas/${concept.id}`}>
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
                    {concept.name}
                  </Badge>
                </Link>
                <span className="font-mono text-[11px] text-slate-400">({concept.id})</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">{concept.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
