import type { CoreLogic } from "@/lib/domain/schemas/core-logic";
import type { SideEffect } from "@/lib/domain/schemas/side-effects";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  collectSideEffectsByRuleName,
  countSideEffects,
  getSideEffectKindLabel,
} from "@/lib/utils/design-documents/side-effect-rule-link";
import { EmptyState } from "./EmptyState";

interface CoreLogicViewerProps {
  coreLogic: CoreLogic;
  sideEffects?: SideEffect;
}

const ruleTypeBadgeClass: Record<string, string> = {
  validate: "border-rose-200 bg-rose-100 text-rose-700",
  read: "border-emerald-200 bg-emerald-100 text-emerald-700",
  derive: "border-amber-200 bg-amber-100 text-amber-700",
  decide: "border-violet-200 bg-violet-100 text-violet-700",
};

const ruleTypeLabels: Record<string, string> = {
  validate: "検証",
  read: "抽出",
  derive: "算出",
  decide: "判定",
};

export function CoreLogicViewer({ coreLogic, sideEffects }: CoreLogicViewerProps) {
  if (!coreLogic.rules || coreLogic.rules.length === 0) {
    return <EmptyState message="コアロジックが定義されていません" />;
  }

  const sideEffectsByRuleName = collectSideEffectsByRuleName(sideEffects);
  const sideEffectCount = countSideEffects(sideEffects);

  return (
    <div className="space-y-4">
      {coreLogic.summary && (
        <div className="text-sm text-muted-foreground">{coreLogic.summary}</div>
      )}

      <div className="space-y-3">
        {coreLogic.rules.map((rule, index) => {
          const normalizedRuleName = rule.name?.trim();
          const mappedSideEffects = normalizedRuleName
            ? (sideEffectsByRuleName.get(normalizedRuleName) ?? [])
            : [];

          return (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={ruleTypeBadgeClass[rule.type] || ""}>
                  {ruleTypeLabels[rule.type] || rule.type}
                </Badge>
                <span className="font-medium">{rule.name}</span>
              </div>

              <div className="text-sm text-muted-foreground">{rule.description}</div>

              <div className="space-y-1 rounded bg-slate-50 px-3 py-2">
                <div className="text-xs font-medium text-muted-foreground">このルールで呼び出す副作用</div>
                {!normalizedRuleName ? (
                  <p className="text-xs text-muted-foreground">ルール名未設定のため紐付けを表示できません</p>
                ) : mappedSideEffects.length > 0 ? (
                  <div className="space-y-1">
                    {mappedSideEffects.map((item, itemIndex) => (
                      <div key={`${item.kind}-${itemIndex}`} className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5 px-2 text-[10px]">
                          {getSideEffectKindLabel(item.kind)}
                        </Badge>
                        <span className="font-mono text-xs text-slate-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                ) : sideEffectCount > 0 ? (
                  <p className="text-xs text-amber-700">このルールに紐付いた副作用は未設定です</p>
                ) : (
                  <p className="text-xs text-muted-foreground">副作用は定義されていません</p>
                )}
              </div>

              {rule.formulas && rule.formulas.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">計算式・判定式</div>
                  {rule.formulas.map((formula, i) => (
                    <div key={i} className="rounded bg-muted px-3 py-2 font-mono text-sm">
                      {formula}
                    </div>
                  ))}
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

              {rule.notes && rule.notes.length > 0 && (
                <div className="space-y-1 border-t pt-2 mt-2">
                  <div className="text-xs font-medium text-muted-foreground">補足事項</div>
                  <ul className="space-y-1 pl-4">
                    {rule.notes.map((note, i) => (
                      <li key={i} className="text-sm text-muted-foreground list-disc">
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
