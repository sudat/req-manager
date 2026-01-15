import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe } from "lucide-react";
import type { Ticket } from "@/lib/domain";

interface TicketImpactCardProps {
  ticket: Ticket;
}

export function TicketImpactCard({ ticket }: TicketImpactCardProps) {
  if (!ticket.impactRequirements || ticket.impactRequirements.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-md border border-slate-200">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-900">影響範囲</h3>
          <Button variant="outline" size="sm" className="h-7 gap-2 text-[12px]">
            <Globe className="h-4 w-4" />
            AI影響分析
          </Button>
        </div>

        <div className="border-t border-slate-100 pt-2 mt-2 space-y-2">
          <div className="text-[12px] font-medium text-slate-500">影響する要件</div>
          <div className="space-y-2">
            {ticket.impactRequirements.map((req) => (
              <div key={req.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-mono text-[11px] text-slate-400">{req.id}</div>
                    <div className="text-[13px] text-slate-700 mt-1">{req.title}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                      {req.type}
                    </Badge>
                    {req.businessName && (
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                        {req.businessName}
                      </Badge>
                    )}
                    {req.area && (
                      <Badge variant="outline" className="font-mono border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                        {req.area}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
