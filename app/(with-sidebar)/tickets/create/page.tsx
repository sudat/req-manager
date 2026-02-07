"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useProject } from "@/components/project/project-context";
import { createChangeRequest } from "@/lib/data/change-requests";
import { ImpactScopeSelector, type SelectedRequirement } from "@/components/tickets/impact-scope-selector";
import { createImpactScopes } from "@/lib/data/impact-scopes";
import { createAcceptanceConfirmations } from "@/lib/data/acceptance-confirmations";

export default function TicketCreatePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<SelectedRequirement[]>([]);
  const { currentProjectId, loading: projectLoading } = useProject();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (projectLoading || !currentProjectId) {
      setError("プロジェクトが選択されていません");
      setSubmitting(false);
      return;
    }

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
      projectId: currentProjectId,
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
      <div className="bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-8 py-6">

          {/* ── ページヘッダー ── */}
          <div className="mb-8">
            <Link href="/tickets" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 mb-3">
              <ArrowLeft className="h-3.5 w-3.5" />
              変更要求一覧に戻る
            </Link>
            <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">変更要求を起票</h1>
            <p className="text-[14px] text-slate-500 mt-1">変更要求の内容と影響範囲を登録する</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── 必須グループ ── */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  タイトル
                  <span className="id-label">必須</span>
                </Label>
                <Input name="title" placeholder="例: インボイス制度対応" required disabled={submitting} />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  背景・目的
                  <span className="id-label">必須</span>
                </Label>
                <Textarea
                  name="background"
                  placeholder="変更要求の背景や目的を記述してください"
                  className="min-h-[120px]"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* ── セパレータ: オプション ── */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">オプション</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* ── オプショングループ ── */}
            <div className="space-y-4">
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
            </div>

            {/* ── セパレータ: 影響範囲 ── */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">影響範囲</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* ── 影響範囲グループ ── */}
            <div className="space-y-2">
              <Label>影響範囲の選択（オプション）</Label>
              <p className="text-[13px] text-slate-500">変更対象となる業務要件・システム要件を選択してください。選択した要件の受入条件が自動的に登録されます。</p>
              <ImpactScopeSelector
                onSelectionChange={setSelectedRequirements}
                readonly={submitting}
              />
            </div>

            {/* ── エラー表示 ── */}
            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 mt-6">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            {/* ── フォータ: アクション ── */}
            <div className="flex items-center gap-3 mt-8">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-[13px] font-medium rounded-md hover:bg-brand-600 disabled:opacity-50 transition-colors duration-150"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {submitting ? "作成中..." : "起票"}
              </button>
              <Link href="/tickets">
                <button
                  type="button"
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-[13px] font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors duration-150"
                >
                  キャンセル
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
