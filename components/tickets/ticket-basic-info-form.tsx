import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusLabels, priorityLabels, formatDate } from "@/lib/utils/ticket-labels";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/domain";

interface TicketBasicInfoFormProps {
  ticket: Ticket;
  title: string;
  setTitle: (value: string) => void;
  changeSummary: string;
  setChangeSummary: (value: string) => void;
  expectedBenefit: string;
  setExpectedBenefit: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  background: string;
  setBackground: (value: string) => void;
  status: TicketStatus;
  setStatus: (value: TicketStatus) => void;
  priority: TicketPriority;
  setPriority: (value: TicketPriority) => void;
}

export function TicketBasicInfoForm({
  ticket,
  title,
  setTitle,
  changeSummary,
  setChangeSummary,
  expectedBenefit,
  setExpectedBenefit,
  description,
  setDescription,
  background,
  setBackground,
  status,
  setStatus,
  priority,
  setPriority,
}: TicketBasicInfoFormProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">基本情報</h2>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>チケットID</Label>
            <Input value={ticket.id} disabled />
          </div>

          <div className="space-y-2">
            <Label>起票者</Label>
            <Input value={ticket.requestedBy} disabled />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>起票日</Label>
            <Input value={formatDate(ticket.createdAt)} disabled />
          </div>

          <div className="space-y-2">
            <Label>更新日</Label>
            <Input value={formatDate(ticket.updatedAt)} disabled />
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            タイトル<span className="text-rose-500">*</span>
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>変更要約</Label>
            <Input
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="変更内容を1行で要約"
            />
          </div>

          <div className="space-y-2">
            <Label>期待効果</Label>
            <Input
              value={expectedBenefit}
              onChange={(e) => setExpectedBenefit(e.target.value)}
              placeholder="期待する効果を1行で"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>説明</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="変更要求の説明を入力"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label>背景・目的</Label>
          <Textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="変更要求の背景や目的を入力"
            className="min-h-[100px]"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>ステータス</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as TicketStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>優先度</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as TicketPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}
