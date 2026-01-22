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
import { Textarea } from "@/components/ui/textarea";
import { listConcepts, createConcept } from "@/lib/data/concepts";
import { nextSequentialIdFrom } from "@/lib/data/id";
import type { BusinessArea } from "@/lib/domain";
import { requireProjectId } from "@/lib/utils/project";

const areaOptions: BusinessArea[] = ["AR", "AP", "GL"];

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function IdeaCreatePage(): JSX.Element {
  const router = useRouter();
  const [nextId, setNextId] = useState("C001");
  const [name, setName] = useState("");
  const [synonyms, setSynonyms] = useState("");
  const [definition, setDefinition] = useState("");
  const [relatedDocs, setRelatedDocs] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<BusinessArea[]>([]);
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
      const { data, error: fetchError } = await listConcepts();
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        return;
      }
      setNextId(nextSequentialIdFrom("C", data ?? [], (concept) => concept.id));
    }
    fetchNextId();
    return () => {
      active = false;
    };
  }, [currentProjectId, projectLoading]);

  function toggleArea(area: BusinessArea): void {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((d) => d !== area) : [...prev, area],
    );
  }

  const canSubmit = useMemo(() => name.trim().length > 0 && selectedAreas.length > 0, [name, selectedAreas]);

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
    const { error: saveError } = await createConcept({
      id: nextId,
      name: name.trim(),
      synonyms: splitCsv(synonyms),
      areas: selectedAreas,
      definition: definition.trim(),
      relatedDocs: splitLines(relatedDocs),
      requirementCount: 0,
      projectId,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    router.push("/ideas");
  }

  return (
    <>
      <div className="flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <Link href="/ideas" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            概念一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">概念を新規作成</h1>

          <Card className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>概念ID</Label>
                <Input value={nextId} disabled />
                <p className="text-xs text-slate-500">概念IDは保存時に自動的に採番されます</p>
              </div>

              <div className="space-y-2">
                <Label>
                  概念名<span className="text-rose-500">*</span>
                </Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="例: 適格請求書発行事業者" required />
              </div>

              <div className="space-y-2">
                <Label>同義語</Label>
                <Textarea
                  placeholder="カンマ区切りで複数入力可能&#10;例: 登録事業者, インボイス発行事業者"
                  className="min-h-[100px]"
                  value={synonyms}
                  onChange={(event) => setSynonyms(event.target.value)}
                />
                <p className="text-xs text-slate-500">カンマ区切りで複数入力可能</p>
              </div>

              <div className="space-y-2">
                <Label>
                  影響領域<span className="text-rose-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {areaOptions.map((area) => (
                    <Button
                      key={area}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleArea(area)}
                      className={selectedAreas.includes(area) ? "border-slate-900 bg-slate-900 text-white" : ""}
                    >
                      {area}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>定義</Label>
                <Textarea
                  value={definition}
                  onChange={(event) => setDefinition(event.target.value)}
                  placeholder="概念の定義を入力"
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label>必読ドキュメント</Label>
                <Textarea
                  value={relatedDocs}
                  onChange={(event) => setRelatedDocs(event.target.value)}
                  placeholder="改行区切りで複数入力可能"
                  className="min-h-[100px]"
                />
                <p className="text-xs text-slate-500">改行区切りで複数入力可能</p>
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-3">
                <Link href="/ideas">
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" className="bg-brand hover:bg-brand-600" disabled={!canSubmit || saving}>
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
