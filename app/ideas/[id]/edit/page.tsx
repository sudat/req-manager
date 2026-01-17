"use client"

import { use, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { getConceptById, updateConcept } from "@/lib/data/concepts";
import type { BusinessArea, Concept } from "@/lib/domain";

const areaOptions: BusinessArea[] = ["AR", "AP", "GL"];

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

const joinCsv = (values: string[]) => values.join(", ");
const joinLines = (values: string[]) => values.join("\n");

export default function IdeaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [name, setName] = useState("");
  const [synonyms, setSynonyms] = useState("");
  const [definition, setDefinition] = useState("");
  const [relatedDocs, setRelatedDocs] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<BusinessArea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const { data, error: fetchError } = await getConceptById(id);
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        setConcept(null);
      } else {
        setError(null);
        setConcept(data ?? null);
        if (data) {
          setName(data.name);
          setSynonyms(joinCsv(data.synonyms));
          setDefinition(data.definition);
          setRelatedDocs(joinLines(data.relatedDocs));
          setSelectedAreas(data.areas);
        }
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [id]);

  const toggleArea = (area: BusinessArea) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((d) => d !== area) : [...prev, area],
    );
  };

  const canSubmit = useMemo(
    () => name.trim().length > 0 && selectedAreas.length > 0,
    [name, selectedAreas],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const { error: saveError } = await updateConcept(id, {
      name: name.trim(),
      synonyms: splitCsv(synonyms),
      areas: selectedAreas,
      definition: definition.trim(),
      relatedDocs: splitLines(relatedDocs),
      requirementCount: concept?.requirementCount ?? 0,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    router.push(`/ideas/${id}`);
  };

  if (loading) {
    return (
    <>
        <div className="flex-1 min-h-screen bg-slate-50">
          <div className="mx-auto max-w-[1400px] p-8">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-32 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!concept) {
    return (
    <>
        <div className="flex-1 min-h-screen bg-slate-50">
          <div className="mx-auto max-w-[1400px] p-8">
            <p className="text-sm text-rose-600">{error ?? "概念が見つかりません"}</p>
            <Link href="/ideas" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mt-4">
              <ArrowLeft className="h-4 w-4" />
              概念一覧に戻る
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <Link href={`/ideas/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            概念詳細に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">概念を編集</h1>

          <Card className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>概念ID</Label>
                <Input value={concept.id} disabled />
                <p className="text-xs text-slate-500">概念IDは変更できません</p>
              </div>

              <div className="space-y-2">
                <Label>
                  概念名<span className="text-rose-500">*</span>
                </Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="概念名を入力" required />
              </div>

              <div className="space-y-2">
                <Label>同義語</Label>
                <Textarea
                  value={synonyms}
                  onChange={(event) => setSynonyms(event.target.value)}
                  placeholder="カンマ区切りで複数入力可能"
                  className="min-h-[100px]"
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
                <Label>必読ドキュメント</Label>
                <Textarea
                  value={relatedDocs}
                  onChange={(event) => setRelatedDocs(event.target.value)}
                  placeholder="改行区切りで複数入力可能"
                  className="min-h-[100px]"
                />
                <p className="text-xs text-slate-500">改行区切りで複数入力可能</p>
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

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-3">
                <Link href={`/ideas/${id}`}>
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
