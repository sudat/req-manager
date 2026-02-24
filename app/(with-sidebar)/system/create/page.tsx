"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProject } from "@/components/project/project-context";
import { SystemDomainForm } from "@/components/forms/system-domain-form";
import { createSystemDomain, listSystemDomains } from "@/lib/data/system-domains";
import { requireProjectId } from "@/lib/utils/project";

const domainCodePattern = /^[A-Z_-]+$/;

export default function SystemDomainCreatePage() {
  const router = useRouter();
  const [domainId, setDomainId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { currentProjectId, loading: projectLoading } = useProject();

  useEffect(() => {
    if (
      !requireProjectId({
        currentProjectId,
        projectLoading,
        onMissing: setError,
      })
    )
      return;
    let active = true;
    async function fetchNextSortOrder(): Promise<void> {
      const { data, error: fetchError } = await listSystemDomains(currentProjectId);
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        return;
      }
      const maxSortOrder = (data ?? []).reduce((max, domain) => Math.max(max, domain.sortOrder ?? 0), 0);
      setSortOrder(maxSortOrder + 1);
    }
    fetchNextSortOrder();
    return () => {
      active = false;
    };
  }, [currentProjectId, projectLoading]);

  const isCodeValid = useMemo(() => domainCodePattern.test(domainId.trim()), [domainId]);
  const canSubmit = useMemo(
    () => domainId.trim().length > 0 && name.trim().length > 0 && isCodeValid,
    [domainId, name, isCodeValid]
  );

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    const projectId = requireProjectId({
      currentProjectId,
      projectLoading,
      onMissing: setError,
    });
    if (!projectId) {
      setSaving(false);
      return;
    }
    const { error: saveError } = await createSystemDomain({
      id: domainId.trim(),
      name: name.trim(),
      description: description.trim(),
      sortOrder: Number(sortOrder) || 0,
      projectId,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    router.push("/system");
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1200px] p-8">
          <Link href="/system" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            システム領域一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">システム領域を新規作成</h1>

          <SystemDomainForm
            mode="create"
            domainId={domainId}
            name={name}
            description={description}
            sortOrder={sortOrder}
            error={error}
            saving={saving}
            canSubmit={canSubmit}
            isCodeValid={isCodeValid}
            cancelHref="/system"
            onSubmit={handleSubmit}
            onDomainIdChange={(value) => setDomainId(value.toUpperCase().replace(/\s+/g, ""))}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onSortOrderChange={setSortOrder}
          />
        </div>
      </div>
    </>
  );
}
