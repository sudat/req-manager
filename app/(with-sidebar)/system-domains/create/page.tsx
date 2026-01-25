"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProject } from "@/components/project/project-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const canSubmit = useMemo(() => domainId.trim() && name.trim() && isCodeValid, [domainId, name, isCodeValid]);

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
    router.push("/system-domains");
  }

  return (
    <>
      <div className="flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1200px] p-8">
          <Link href="/system-domains" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            システム領域一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">システム領域を新規作成</h1>

          <Card className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>
                  コード<span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={domainId}
                  onChange={(event) => setDomainId(event.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder="例: AR"
                  required
                />
                {!isCodeValid && domainId.trim().length > 0 && (
                  <p className="text-xs text-rose-600">英字と記号（-、_）のみ入力できます</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  名称<span className="text-rose-500">*</span>
                </Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="例: 債権管理" required />
              </div>

              <div className="space-y-2">
                <Label>説明</Label>
                <Input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="例: 売掛金管理、請求書発行、入金消込、債権回収"
                />
              </div>

              <div className="space-y-2">
                <Label>表示順</Label>
                <Input
                  type="number"
                  value={String(sortOrder)}
                  onChange={(event) => setSortOrder(Number(event.target.value) || 0)}
                  placeholder="例: 1"
                />
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-3">
                <Link href="/system-domains">
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={!canSubmit || saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
