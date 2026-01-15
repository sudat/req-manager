import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Ticket } from "@/lib/mock/data/types";

interface TicketVersionCardProps {
  ticket: Ticket;
}

export function TicketVersionCard({ ticket }: TicketVersionCardProps) {
  const versionEntries = new Map<string, { version: string; status: string; appliedDate?: string }>();
  (ticket.targetVersions || []).forEach((version) => {
    versionEntries.set(version, { version, status: "予定" });
  });
  (ticket.versionHistory || []).forEach((ver) => {
    versionEntries.set(ver.version, { version: ver.version, status: ver.status, appliedDate: ver.appliedDate });
  });
  const combinedVersions = Array.from(versionEntries.values());

  if (combinedVersions.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-md border border-slate-200">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-900">リリース版</h3>
        </div>

        <div className="space-y-2">
          {combinedVersions.map((ver) => (
            <div key={ver.version} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <div className="space-y-0.5">
                <div className="text-[14px] font-semibold text-slate-900">{ver.version}</div>
                {ver.appliedDate && <div className="text-[11px] text-slate-400">適用日: {ver.appliedDate}</div>}
              </div>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">{ver.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
