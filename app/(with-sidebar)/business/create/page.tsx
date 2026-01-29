"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProject } from "@/components/project/project-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listBusinesses, createBusiness } from "@/lib/data/businesses";
import { nextSequentialIdFrom } from "@/lib/data/id";
import type { BusinessArea } from "@/lib/domain";
import { requireProjectId } from "@/lib/utils/project";

const areaPattern = /^[A-Z_-]+$/;

export default function BusinessCreatePage() {
  const router = useRouter();
  const [nextId, setNextId] = useState("BIZ-001");
  const [name, setName] = useState("");
  const defaultArea: BusinessArea = "AR";
  const [area, setArea] = useState<string>(defaultArea);
  const [summary, setSummary] = useState("");
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
    async function fetchNextId(): Promise<void> {
      const projectId = requireProjectId({
        currentProjectId,
        projectLoading,
        onMissing: setError,
      });
      if (!projectId) return;
      const { data, error: fetchError } = await listBusinesses(projectId);
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        return;
      }
      setNextId(nextSequentialIdFrom("BIZ-", data ?? [], (biz) => biz.id));
    }
    fetchNextId();
    return () => {
      active = false;
    };
  }, [currentProjectId, projectLoading]);

  const isAreaValid = useMemo(() => areaPattern.test(area.trim()), [area]);
  const canSubmit = useMemo(() => name.trim().length > 0 && isAreaValid, [name, isAreaValid]);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canSubmit) return;
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
      id: nextId,
      name: name.trim(),
      area: area.trim() as BusinessArea,
      summary: summary.trim(),
      projectId,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    router.push("/business");
  }

  return (
    <>
      <div className="flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1200px] p-8">
          <Link href="/business" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            業務一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">業務を新規作成</h1>

          <Card className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>
                  業務名<span className="text-rose-500">*</span>
                </Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="例: 債権管理" required />
              </div>

              <div className="space-y-2">
                <Label>
                  領域コード<span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={area}
                  onChange={(event) => setArea(event.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder="例: AR"
                  required
                />
                {!isAreaValid && area.trim().length > 0 && (
                  <p className="text-xs text-rose-600">英字と記号（-、_）のみ入力できます</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>業務概要</Label>
                <Textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="業務の概要を入力"
                  className="min-h-[110px]"
                />
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-3">
                <Link href="/business">
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
