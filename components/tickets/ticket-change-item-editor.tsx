import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TicketChangeItem, BusinessArea } from "@/lib/domain";

interface TicketChangeItemEditorProps {
  changeItems: TicketChangeItem[];
  updateChangeItem: <K extends keyof TicketChangeItem>(index: number, key: K, value: TicketChangeItem[K]) => void;
  addChangeItem: () => void;
  removeChangeItem: (index: number) => void;
}

export function TicketChangeItemEditor({
  changeItems,
  updateChangeItem,
  addChangeItem,
  removeChangeItem,
}: TicketChangeItemEditorProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">変更内容</h2>
        <Button type="button" variant="outline" size="sm" onClick={addChangeItem}>
          追加
        </Button>
      </div>

      {changeItems.length === 0 ? (
        <p className="text-sm text-slate-500">変更内容を追加してください</p>
      ) : (
        <div className="space-y-4">
          {changeItems.map((item, index) => (
            <div key={`${item.refId || "item"}-${index}`} className="rounded-md border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">要件 {index + 1}</div>
                <Button type="button" variant="outline" size="sm" onClick={() => removeChangeItem(index)}>
                  削除
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>要件ID</Label>
                  <Input
                    value={item.refId}
                    onChange={(e) => updateChangeItem(index, "refId", e.target.value)}
                    placeholder="例: BR-AR-0003-0001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>要件タイトル</Label>
                  <Input
                    value={item.refTitle}
                    onChange={(e) => updateChangeItem(index, "refTitle", e.target.value)}
                    placeholder="要件の要約"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>要件種別</Label>
                  <Select
                    value={item.refType}
                    onValueChange={(value) => updateChangeItem(index, "refType", value as TicketChangeItem["refType"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="業務要件">業務要件</SelectItem>
                      <SelectItem value="システム要件">システム要件</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>変更種別</Label>
                  <Select
                    value={item.changeType}
                    onValueChange={(value) => updateChangeItem(index, "changeType", value as TicketChangeItem["changeType"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="追加">追加</SelectItem>
                      <SelectItem value="変更">変更</SelectItem>
                      <SelectItem value="削除">削除</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>業務名</Label>
                  <Input
                    value={item.businessName || ""}
                    onChange={(e) => updateChangeItem(index, "businessName", e.target.value || undefined)}
                    placeholder="例: 債権管理"
                  />
                </div>
                <div className="space-y-2">
                  <Label>領域</Label>
                  <Select
                    value={item.area || "none"}
                    onValueChange={(value) =>
                      updateChangeItem(index, "area", value === "none" ? undefined : (value as BusinessArea))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未設定</SelectItem>
                      <SelectItem value="AR">AR</SelectItem>
                      <SelectItem value="AP">AP</SelectItem>
                      <SelectItem value="GL">GL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>現行（Before）</Label>
                  <Textarea
                    value={item.beforeText}
                    onChange={(e) => updateChangeItem(index, "beforeText", e.target.value)}
                    placeholder="現行の仕様や挙動"
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>変更後（After）</Label>
                  <Textarea
                    value={item.afterText}
                    onChange={(e) => updateChangeItem(index, "afterText", e.target.value)}
                    placeholder="変更後の仕様や挙動"
                    className="min-h-[120px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>受入条件（1行1項目）</Label>
                <Textarea
                  value={(item.acceptanceCriteria || []).join("\n")}
                  onChange={(e) =>
                    updateChangeItem(
                      index,
                      "acceptanceCriteria",
                      e.target.value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="例: 登録番号が請求書に表示される"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
