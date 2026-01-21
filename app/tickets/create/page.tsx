"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { createChangeRequest } from "@/lib/data/change-requests";
import { ImpactScopeSelector, type SelectedRequirement } from "@/components/tickets/impact-scope-selector";
import { createImpactScopes } from "@/lib/data/impact-scopes";
import { createAcceptanceConfirmations } from "@/lib/data/acceptance-confirmations";

export default function TicketCreatePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<SelectedRequirement[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const ticketId = `CR-${String(Date.now()).slice(-6)}`;

    // 変更要求を作成
    const { data: changeRequest, error: createError } = await createChangeRequest({
      ticketId,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      background: formData.get("background") as string || null,
      expectedBenefit: formData.get("expectedBenefit") as string || null,
      status: "open",
      priority: "medium",
      requestedBy: "システム",
    });

    if (createError || !changeRequest) {
      setError(createError ?? "作成に失敗しました");
      setSubmitting(false);
      return;
    }

    // 影響範囲を保存
    if (selectedRequirements.length > 0) {
      const impactScopeInputs = selectedRequirements.map((req) => ({
        changeRequestId: changeRequest.id,
        targetType: req.type as "business_requirement" | "system_requirement",
        targetId: req.id,
        targetTitle: req.title,
        rationale: null,
      }))

      const { error: scopeError } = await createImpactScopes(impactScopeInputs)
      if (scopeError) {
        setError(`影響範囲の保存に失敗しました: ${scopeError}`)
        setSubmitting(false)
        return
      }

      // 受入条件を自動登録
      const acceptanceInputs: Array<{
        changeRequestId: string
        acceptanceCriterionId: string
        acceptanceCriterionSourceType: "business_requirement" | "system_requirement"
        acceptanceCriterionSourceId: string
        acceptanceCriterionDescription: string
        acceptanceCriterionVerificationMethod: string | null
      }> = []

      for (const req of selectedRequirements) {
        for (const ac of req.acceptanceCriteria) {
          acceptanceInputs.push({
            changeRequestId: changeRequest.id,
            acceptanceCriterionId: ac.id,
            acceptanceCriterionSourceType: req.type === "business_requirement" ? "business_requirement" : "system_requirement",
            acceptanceCriterionSourceId: req.id,
            acceptanceCriterionDescription: ac.description,
            acceptanceCriterionVerificationMethod: ac.verificationMethod,
          })
        }
      }

      if (acceptanceInputs.length > 0) {
        const { error: acceptanceError } = await createAcceptanceConfirmations(acceptanceInputs)
        if (acceptanceError) {
          setError(`受入条件の登録に失敗しました: ${acceptanceError}`)
          setSubmitting(false)
          return
        }
      }
    }

    setSubmitting(false);
    router.push(`/tickets/${changeRequest.id}`);
  };

  return (
    <>
      <div className="flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            変更要求一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">変更要求を起票</h1>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>
                  タイトル<span className="text-rose-500">*</span>
                </Label>
                <Input name="title" placeholder="例: インボイス制度対応" required disabled={submitting} />
              </div>

              <div className="space-y-2">
                <Label>
                  背景・目的<span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  name="background"
                  placeholder="変更要求の背景や目的を記述してください"
                  className="min-h-[120px]"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label>修正内容</Label>
                <Textarea
                  name="description"
                  placeholder="修正内容を記述してください"
                  className="min-h-[120px]"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label>期待効果</Label>
                <Textarea
                  name="expectedBenefit"
                  placeholder="変更による期待効果を記述してください"
                  className="min-h-[80px]"
                  disabled={submitting}
                />
              </div>

              <Card className="border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-900">影響範囲の選択</div>
                    <div className="text-xs text-amber-700 mt-1">
                      変更対象となる業務要件・システム要件を選択してください。選択した要件の受入条件が自動的に登録されます。
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Label>影響範囲の選択（オプション）</Label>
                <ImpactScopeSelector
                  onSelectionChange={setSelectedRequirements}
                  readonly={submitting}
                />
              </div>

              {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                  <p className="text-sm text-rose-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/tickets">
                  <Button type="button" variant="outline" disabled={submitting}>
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={submitting}>
                  {submitting ? "作成中..." : "起票"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
