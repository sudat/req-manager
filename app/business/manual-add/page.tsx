"use client"

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

type Requirement = {
  id: string;
  type: "業務要件";
  title: string;
  summary: string;
  concepts?: { id: string; name: string }[];
  srfId?: string;
  impacts: string[];
  related: string[];
  acceptanceCriteria: string[];
};

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

const joinLines = (values: string[]) => values.join("\n");

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const joinCsv = (values: string[]) => values.join(", ");

const nextSequentialId = (prefix: string, existingIds: string[]) => {
  const used = new Set(existingIds);
  for (let i = 1; i < 1000; i++) {
    const candidate = `${prefix}-${String(i).padStart(3, "0")}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${prefix}-${Date.now()}`;
};

export default function ManualAddPage() {
  const searchParams = useSearchParams();
  const bizId = searchParams.get("id") || "BIZ-001";

  const [requirements, setRequirements] = useState<Requirement[]>([]);

  const updateRequirement = (reqId: string, patch: Partial<Requirement>) => {
    setRequirements((prev) => prev.map((r) => (r.id === reqId ? { ...r, ...patch } : r)));
  };

  const removeRequirement = (reqId: string) => {
    setRequirements((prev) => prev.filter((r) => r.id !== reqId));
  };

  const addRequirement = () => {
    const existingIds = requirements.map((r) => r.id);
    const prefix = "BR-NEW";
    const id = nextSequentialId(prefix, existingIds);

    const nextReq: Requirement = {
      id,
      type: "業務要件",
      title: "",
      summary: "",
      concepts: [],
      srfId: "",
      impacts: [],
      acceptanceCriteria: [],
      related: [],
    };

    setRequirements((prev) => [...prev, nextReq]);
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-6">
          <Link href={`/business/${bizId}/tasks`} className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900 mb-6">
            <ArrowLeft className="h-4 w-4" />
            業務一覧（詳細）に戻る
          </Link>

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-6">業務タスクを手動追加</h1>

          <Card className="rounded-md border border-slate-200 p-3">
            <form className="space-y-3">
              <div className="flex items-center gap-3 text-[12px] text-slate-500">
                <span className="font-mono">{bizId}</span>
                <span className="text-slate-300">/</span>
                <span className="font-mono">TASK-009</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-500">
                  業務タスク<span className="text-slate-900">*</span>
                </Label>
                <Input placeholder="例: 請求書発行" required className="text-[16px] font-semibold" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-500">業務概要</Label>
                <Textarea
                  placeholder="この業務タスクで何をするのかを入力してください"
                  className="min-h-[100px] text-[14px]"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-slate-500">担当者</Label>
                  <Input placeholder="例: 経理担当" className="text-[14px]" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-slate-500">インプット</Label>
                  <Input placeholder="例: 請求対象データ" className="text-[14px]" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-slate-500">アウトプット</Label>
                  <Input placeholder="例: 請求書（PDF）" className="text-[14px]" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Link href={`/business/${bizId}/tasks`}>
                  <Button type="button" variant="outline" className="h-8 text-[14px]">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" className="h-8 text-[14px] bg-slate-900 hover:bg-slate-800">
                  追加
                </Button>
              </div>
            </form>
          </Card>

          <Card className="mt-4 rounded-md border border-slate-200">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-slate-900">業務要件</h3>
                  <Badge variant="outline" className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0">
                    {requirements.length}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="h-7 gap-2 text-[12px]" onClick={addRequirement}>
                  <Plus className="h-4 w-4" />
                  追加
                </Button>
              </div>
              {requirements.length === 0 ? (
                <div className="text-[14px] text-slate-500">まだ登録されていません。</div>
              ) : (
                requirements.map((req) => (
                  <Card key={req.id} className="rounded-md border border-slate-200">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400">{req.id}</span>
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                            {req.type}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          title="削除"
                          className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                          onClick={() => removeRequirement(req.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-medium text-slate-500">タイトル</Label>
                        <Input
                          value={req.title}
                          onChange={(e) => updateRequirement(req.id, { title: e.target.value })}
                          className="text-[14px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-medium text-slate-500">概要</Label>
                        <Textarea
                          className="min-h-[90px] text-[14px]"
                          value={req.summary}
                          onChange={(e) => updateRequirement(req.id, { summary: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-[12px] font-medium text-slate-500">関連概念（カンマ区切り）</Label>
                          <Input
                            value={req.concepts?.map(c => c.name).join(", ") ?? ""}
                            onChange={(e) => {
                              const names = splitCsv(e.target.value);
                              updateRequirement(req.id, {
                                concepts: names.map((name, i) => ({ id: `concept-${i}`, name }))
                              });
                            }}
                            className="text-[14px]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[12px] font-medium text-slate-500">関連システム機能</Label>
                          <Input
                            value={req.srfId ?? ""}
                            onChange={(e) => updateRequirement(req.id, { srfId: e.target.value })}
                            className="text-[14px]"
                            placeholder="例: SRF-001"
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-[12px] font-medium text-slate-500">影響領域（カンマ区切り）</Label>
                          <Input
                            value={joinCsv(req.impacts)}
                            onChange={(e) => updateRequirement(req.id, { impacts: splitCsv(e.target.value) })}
                            className="text-[14px]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[12px] font-medium text-slate-500">関連要件（カンマ区切り）</Label>
                          <Input
                            value={joinCsv(req.related)}
                            onChange={(e) => updateRequirement(req.id, { related: splitCsv(e.target.value) })}
                            className="text-[14px]"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-medium text-slate-500">受入条件（1行=1条件）</Label>
                        <Textarea
                          className="min-h-[110px] text-[14px]"
                          value={joinLines(req.acceptanceCriteria)}
                          onChange={(e) =>
                            updateRequirement(req.id, { acceptanceCriteria: splitLines(e.target.value) })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
