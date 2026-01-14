"use client";

import { use, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listSystemFunctions, createSystemFunction } from "@/lib/data/system-functions";
import { nextSequentialId } from "@/lib/data/id";
import type { SrfCategory, SrfStatus } from "@/lib/mock/data/types";

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export default function SystemFunctionCreatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [nextId, setNextId] = useState("SRF-001");
  const [designDocNo, setDesignDocNo] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<SrfCategory>("screen");
  const [status, setStatus] = useState<SrfStatus>("not_implemented");
  const [relatedTaskIds, setRelatedTaskIds] = useState("");
  const [requirementIds, setRequirementIds] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchNextId = async () => {
      const { data, error: fetchError } = await listSystemFunctions();
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        return;
      }
      const ids = (data ?? []).map((srf) => srf.id);
      setNextId(nextSequentialId("SRF-", ids));
    };
    fetchNextId();
    return () => {
      active = false;
    };
  }, []);

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const { error: saveError } = await createSystemFunction({
      id: nextId,
      systemDomainId: id,
      designDocNo: designDocNo.trim(),
      category,
      title: title.trim(),
      summary: summary.trim(),
      status,
      relatedTaskIds: splitCsv(relatedTaskIds),
      requirementIds: splitCsv(requirementIds),
      systemDesign: [],
      codeRefs: [],
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    router.push(`/system-domains/${id}`);
  };

  return (
    <>
      <div className="flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1200px] p-8">
          <Link href={`/system-domains/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            システム機能一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">システム機能を新規追加</h1>

          <Card className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>システム機能ID</Label>
                <Input value={nextId} disabled />
                <p className="text-xs text-slate-500">システム機能IDは保存時に自動採番されます</p>
              </div>

              <div className="space-y-2">
                <Label>設計書No</Label>
                <Input value={designDocNo} onChange={(event) => setDesignDocNo(event.target.value)} placeholder="例: DD-TASK-001-001" />
              </div>

              <div className="space-y-2">
                <Label>
                  機能名<span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="例：請求書発行機能"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>
                  機能概要<span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="機能概要を入力"
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>機能分類</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as SrfCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="機能分類を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="screen">画面</SelectItem>
                      <SelectItem value="internal">内部</SelectItem>
                      <SelectItem value="interface">IF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ステータス</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as SrfStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="ステータスを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="implemented">実装済</SelectItem>
                      <SelectItem value="implementing">実装中</SelectItem>
                      <SelectItem value="testing">テスト中</SelectItem>
                      <SelectItem value="not_implemented">未実装</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>関連タスクID（カンマ区切り）</Label>
                  <Input value={relatedTaskIds} onChange={(event) => setRelatedTaskIds(event.target.value)} placeholder="例: TASK-001, TASK-003" />
                </div>
                <div className="space-y-2">
                  <Label>関連要件ID（カンマ区切り）</Label>
                  <Input value={requirementIds} onChange={(event) => setRequirementIds(event.target.value)} placeholder="例: SR-TASK-001-001" />
                </div>
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-3">
                <Link href={`/system-domains/${id}`}>
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
