"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProject } from "@/components/project/project-context";
import { BusinessDomainForm } from "@/components/forms/business-domain-form";
import { createBusiness } from "@/lib/data/businesses";
import type { BusinessArea } from "@/lib/domain";
import { normalizeBusinessAreaInput } from "@/lib/utils/id-rules";
import { requireProjectId } from "@/lib/utils/project";
import { toast } from "sonner";

const areaPattern = /^[A-Z0-9_]+$/;

export default function BusinessCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const defaultArea: BusinessArea = "AR";
  const [area, setArea] = useState<string>(defaultArea);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { currentProjectId, loading: projectLoading } = useProject();

  const normalizedArea = useMemo(() => normalizeBusinessAreaInput(area), [area]);
  const isAreaValid = useMemo(() => areaPattern.test(normalizedArea), [normalizedArea]);
  const canSubmit = useMemo(() => name.trim().length > 0 && isAreaValid, [name, isAreaValid]);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canSubmit) return;
    const sanitizedArea = normalizeBusinessAreaInput(area);
    setSaving(true);
    const projectId = requireProjectId({
      currentProjectId,
      projectLoading,
      onMissing: setError,
    });
    if (!projectId) {
      setSaving(false);
      return;
    }
    const { error: saveError } = await createBusiness({
      name: name.trim(),
      area: sanitizedArea as BusinessArea,
      summary: summary.trim(),
      sortOrder: 0,
      projectId,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      toast.error("業務領域の作成に失敗しました", {
        description: saveError,
      });
      return;
    }
    toast.success("業務領域を作成しました", {
      duration: 5000,
    });
    router.push("/business");
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1200px] p-8">
          <Link href="/business" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            業務一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">業務を新規作成</h1>

          <BusinessDomainForm
            name={name}
            area={area}
            summary={summary}
            error={error}
            saving={saving}
            canSubmit={canSubmit}
            isAreaValid={isAreaValid}
            cancelHref="/business"
            onSubmit={handleSubmit}
            onNameChange={setName}
            onAreaChange={(value) => setArea(normalizeBusinessAreaInput(value))}
            onSummaryChange={setSummary}
          />
        </div>
      </div>
    </>
  );
}
