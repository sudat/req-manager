"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { SystemDomainForm } from "@/components/forms/system-domain-form";
import { getSystemDomainById, updateSystemDomain, type SystemDomain } from "@/lib/data/system-domains";
import { useProject } from "@/components/project/project-context";

export default function SystemDomainEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [domain, setDomain] = useState<SystemDomain | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentProjectId, loading: projectLoading } = useProject();

  useEffect(() => {
    if (projectLoading) return;
    if (!currentProjectId) {
      setError("プロジェクトが選択されていません");
      setDomain(null);
      setLoading(false);
      return;
    }
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const { data, error: fetchError } = await getSystemDomainById(id, currentProjectId);
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        setDomain(null);
      } else {
        setError(null);
        setDomain(data ?? null);
        if (data) {
          setName(data.name);
          setDescription(data.description ?? "");
          setSortOrder(data.sortOrder ?? 0);
        }
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [id, currentProjectId, projectLoading]);

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    if (projectLoading || !currentProjectId) {
      setError("プロジェクトが選択されていません");
      setSaving(false);
      return;
    }
    const { error: saveError } = await updateSystemDomain(id, {
      name: name.trim(),
      description: description.trim(),
      sortOrder: Number(sortOrder) || 0,
    }, currentProjectId);
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    router.push("/system");
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

  if (!domain) {
    return (
      <>
        <div className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-[1200px] p-8">
            <p className="text-sm text-rose-600">{error ?? "システム領域が見つかりません"}</p>
            <Link href="/system" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mt-4">
              <ArrowLeft className="h-4 w-4" />
              システム領域一覧に戻る
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
          <Link href="/system" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            システム領域一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">システム領域を編集</h1>

          <SystemDomainForm
            mode="edit"
            domainId={domain.id}
            name={name}
            description={description}
            sortOrder={sortOrder}
            error={error}
            saving={saving}
            canSubmit={canSubmit}
            cancelHref="/system"
            onSubmit={handleSubmit}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onSortOrderChange={setSortOrder}
          />
        </div>
      </div>
    </>
  );
}
