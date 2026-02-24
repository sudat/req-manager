"use client";

import { use, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BusinessDomainForm } from "@/components/forms/business-domain-form";
import { getBusinessByKey, updateBusiness } from "@/lib/data/businesses";
import { useProject } from "@/components/project/project-context";
import type { Business } from "@/lib/domain";
import { normalizeBusinessAreaInput } from "@/lib/utils/id-rules";

const areaPattern = /^[A-Z0-9_]+$/;

export default function BusinessEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: businessKey } = use(params);
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentProjectId, loading: projectLoading } = useProject();

  useEffect(() => {
    if (projectLoading) return;
    let active = true;
    const fetchData = async () => {
      if (!currentProjectId) {
        if (!active) return;
        setError("プロジェクトが選択されていません");
        setBusiness(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error: fetchError } = await getBusinessByKey(businessKey, currentProjectId);
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        setBusiness(null);
      } else {
        setError(null);
        setBusiness(data ?? null);
        if (data) {
          setName(data.name);
          setArea(normalizeBusinessAreaInput(data.area ?? ""));
          setSummary(data.summary);
        }
      }
      setLoading(false);
    };
    void fetchData();
    return () => {
      active = false;
    };
  }, [businessKey, currentProjectId, projectLoading]);

  useEffect(() => {
    if (business?.area && business.area !== businessKey) {
      router.replace(`/business/${business.area}/edit`);
    }
  }, [business?.area, businessKey, router]);

  const normalizedArea = useMemo(() => normalizeBusinessAreaInput(area), [area]);
  const isAreaValid = useMemo(() => areaPattern.test(normalizedArea), [normalizedArea]);
  const canSubmit = useMemo(() => name.trim().length > 0 && isAreaValid, [name, isAreaValid]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const sanitizedArea = normalizeBusinessAreaInput(area);
    setSaving(true);
    if (projectLoading || !currentProjectId) {
      setError("プロジェクトが選択されていません");
      setSaving(false);
      return;
    }
    if (!business?.area) {
      setError("業務が見つかりません");
      setSaving(false);
      return;
    }
    const { error: saveError } = await updateBusiness(businessKey, {
      name: name.trim(),
      area: sanitizedArea,
      summary: summary.trim(),
    }, currentProjectId);
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    router.push("/business");
  };

  if (loading) {
    return (
    <>
        <div className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-[1200px] p-8">
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded w-32 animate-pulse" />
              <div className="h-10 bg-slate-200 rounded w-48 animate-pulse" />
              <div className="h-96 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!business) {
    return (
    <>
        <div className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-[1200px] p-8">
            <p className="text-sm text-rose-600">{error ?? "業務が見つかりません"}</p>
            <Link href="/business" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mt-4">
              <ArrowLeft className="h-4 w-4" />
              業務一覧に戻る
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1200px] p-8">
          <Link href="/business" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            業務一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">業務を編集</h1>

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
