import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { businesses } from "@/lib/mock/data";
import type { BusinessArea } from "@/lib/domain";

const areaConfig = [
  { key: "AR", label: "AR", class: "border-slate-400 bg-slate-100" },
  { key: "AP", label: "AP", class: "border-slate-400 bg-slate-100" },
  { key: "GL", label: "GL", class: "border-slate-400 bg-slate-100" },
];

interface TicketScopeFormProps {
  selectedBusinessIds: string[];
  toggleBusiness: (businessId: string) => void;
  selectedAreas: BusinessArea[];
  toggleArea: (area: BusinessArea) => void;
  targetVersions: string;
  setTargetVersions: (value: string) => void;
}

export function TicketScopeForm({
  selectedBusinessIds,
  toggleBusiness,
  selectedAreas,
  toggleArea,
  targetVersions,
  setTargetVersions,
}: TicketScopeFormProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">影響範囲</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>影響業務</Label>
          <div className="flex flex-wrap gap-2">
            {businesses.map((business) => (
              <Button
                key={business.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleBusiness(business.id)}
                className={selectedBusinessIds.includes(business.id) ? "border-slate-400 bg-slate-100" : ""}
              >
                {business.name}
              </Button>
            ))}
          </div>
          {selectedBusinessIds.length === 0 && (
            <p className="text-xs text-slate-500">影響業務を選択してください</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>影響領域</Label>
          <div className="flex flex-wrap gap-2">
            {areaConfig.map((area) => (
              <Button
                key={area.key}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleArea(area.key as BusinessArea)}
                className={selectedAreas.includes(area.key as BusinessArea) ? area.class : ""}
              >
                {area.label}
              </Button>
            ))}
          </div>
          {selectedAreas.length === 0 && (
            <p className="text-xs text-slate-500">影響領域を選択してください</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>ターゲットバージョン</Label>
          <Input
            value={targetVersions}
            onChange={(e) => setTargetVersions(e.target.value)}
            placeholder="カンマ区切りで複数入力可能（例: v2.0, v2.1）"
          />
          <p className="text-xs text-slate-500">カンマ区切りで複数入力可能</p>
        </div>
      </div>
    </Card>
  );
}
