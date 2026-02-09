import type { CoreLogic } from "@/lib/domain/schemas/core-logic";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface CoreLogicViewerProps {
  coreLogic: CoreLogic;
}

const ruleTypeBadgeVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  validation: "default",
  calculation: "secondary",
  state_transition: "outline",
  decision: "destructive",
  aggregation: "secondary",
};

const ruleTypeLabels: Record<string, string> = {
  validation: "検証",
  calculation: "計算",
  state_transition: "状態遷移",
  decision: "判定",
  aggregation: "集約",
};

export function CoreLogicViewer({ coreLogic }: CoreLogicViewerProps) {
  if (!coreLogic.rules || coreLogic.rules.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        コアロジックが定義されていません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {coreLogic.summary && (
        <div className="text-sm text-muted-foreground">{coreLogic.summary}</div>
      )}

      <div className="space-y-3">
        {coreLogic.rules.map((rule, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={ruleTypeBadgeVariants[rule.type] || "default"}>
                  {ruleTypeLabels[rule.type] || rule.type}
                </Badge>
                <span className="font-medium">{rule.name}</span>
              </div>

              <div className="text-sm text-muted-foreground">{rule.description}</div>

              {rule.formula && (
                <div className="rounded bg-muted px-3 py-2 font-mono text-sm">
                  {rule.formula}
                </div>
              )}

              {rule.preconditions && rule.preconditions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">前提条件</div>
                  <ul className="space-y-1 pl-4">
                    {rule.preconditions.map((condition, i) => (
                      <li key={i} className="text-sm text-muted-foreground list-disc">
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {rule.rounding && (
                  <div>
                    <span className="font-medium">端数処理:</span> {rule.rounding}
                  </div>
                )}
                {rule.precision && (
                  <div>
                    <span className="font-medium">精度:</span> {rule.precision}
                  </div>
                )}
              </div>

              {rule.notes && (
                <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                  {rule.notes}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
