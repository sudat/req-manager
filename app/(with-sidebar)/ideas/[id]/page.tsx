"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Pencil, FileText, Plus, Scissors, Trash2 } from "lucide-react";
import { getRelatedRequirements, type RequirementReference } from "@/lib/mock/data";
import type { Concept } from "@/lib/domain";
import { getConceptById, deleteConcept } from "@/lib/data/concepts";
import { CardSkeleton, PageHeaderSkeleton } from "@/components/skeleton";
import { confirmDelete } from "@/lib/ui/confirm";
import { useProject } from "@/components/project/project-context";

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentProjectId, loading: projectLoading } = useProject();

  useEffect(() => {
    if (projectLoading) return;
    if (!currentProjectId) {
      setError("プロジェクトが選択されていません");
      setConcept(null);
      setLoading(false);
      return;
    }
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const { data, error: fetchError } = await getConceptById(id, currentProjectId);
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        setConcept(null);
      } else {
        setError(null);
        setConcept(data ?? null);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [id, currentProjectId, projectLoading]);

  const relatedRequirements = useMemo(() => getRelatedRequirements(id), [id]);

  const handleDelete = async () => {
    if (!concept) return;
    if (!confirmDelete(`${concept.name}（${concept.id}）`)) return;
    if (projectLoading || !currentProjectId) {
      alert("プロジェクトが選択されていません");
      return;
    }
    const { error: deleteError } = await deleteConcept(concept.id, currentProjectId);
    if (deleteError) {
      alert(deleteError);
      return;
    }
    router.push("/ideas");
  };

  if (loading) {
    return (
    <>
        <div className="flex-1 min-h-screen bg-white">
          <div className="mx-auto max-w-[1400px] px-8 py-4">
            <PageHeaderSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </>
    );
  }

  if (!concept) {
    return (
    <>
        <div className="flex-1 min-h-screen bg-white">
          <div className="mx-auto max-w-[1400px] px-8 py-4">
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/ideas">概念辞書</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <p className="text-sm text-rose-600">{error ?? "概念が見つかりません"}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/ideas">概念辞書</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{concept?.name ?? '...'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link href={`/ideas/${id}/edit`}>
                <Button variant="outline" className="h-8 px-4 text-[14px] font-medium border-slate-200 hover:bg-slate-50 gap-2">
                  <Pencil className="h-4 w-4" />
                  編集
                </Button>
              </Link>
              <div className="h-8 w-px bg-slate-200 mx-2" />
              <Button variant="ghost" className="h-8 px-4 text-[14px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 gap-2">
                <Plus className="h-4 w-4" />
                統合
              </Button>
              <Button variant="ghost" className="h-8 px-4 text-[14px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 gap-2">
                <Scissors className="h-4 w-4" />
                分割
              </Button>
              <Button
                variant="ghost"
                className="h-8 px-4 text-[14px] font-medium text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                廃止
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
              {concept.name}
            </h1>
            <p className="text-[13px] text-slate-500">ID: {concept.id}</p>
          </div>

          <div className="space-y-4">
            {/* 基本情報 */}
            <Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
              <CardContent className="p-0">
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      概念ID
                    </div>
                    <div className="font-mono text-[14px] text-slate-900">{concept.id}</div>
                  </div>
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      使用要件数
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">{relatedRequirements.length}</span>
                      <span className="text-[11px] text-slate-400">件</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    同義語
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {concept.synonyms.length === 0 ? (
                      <span className="text-[13px] text-slate-500">未登録</span>
                    ) : (
                      concept.synonyms.map((synonym) => (
                      <Badge key={synonym} variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                        {synonym}
                      </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    影響領域
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {concept.areas.length === 0 ? (
                      <span className="text-[13px] text-slate-500">未登録</span>
                    ) : (
                      concept.areas.map((area) => (
                      <Badge key={area} variant="outline" className="font-mono border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                        {area}
                      </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="px-4 py-2.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    必読ドキュメント
                  </div>
                  <div className="space-y-1.5">
                    {concept.relatedDocs.length === 0 ? (
                      <span className="text-[13px] text-slate-500">未登録</span>
                    ) : (
                      concept.relatedDocs.map((doc) => {
                      const isExternalUrl = doc.startsWith("http://") || doc.startsWith("https://");
                      const displayText = isExternalUrl
                        ? doc.includes("nta.go.jp") ? "国税庁ガイドライン" : doc.split("/").pop()
                        : doc.includes("accounting-rules") ? "経理規程" : doc.includes("masters") ? "マスタデータ" : doc;

                      return (
                        <a
                          key={doc}
                          href={isExternalUrl ? doc : `#${doc}`}
                          className="flex items-center gap-2 text-[13px] text-slate-700 hover:text-slate-900 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>{displayText}</span>
                        </a>
                      );
                    })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 定義 */}
            <Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
              <CardHeader className="border-b border-slate-100 px-4 py-2.5">
                <CardTitle className="text-[15px] font-semibold text-slate-900">定義</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {concept.definition.trim().length === 0 ? (
                  <div className="text-[13px] text-slate-500">未登録</div>
                ) : (
                  <div className="prose prose-sm max-w-none text-[13px] text-slate-700">
                    {concept.definition.split("\n\n").map((paragraph, idx) => {
                      if (paragraph.startsWith("###")) {
                        return (
                          <h4 key={idx} className="text-[13px] font-semibold text-slate-900 mt-4 mb-2">
                            {paragraph.replace("### ", "")}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith("- ")) {
                        return (
                          <ul key={idx} className="list-disc list-inside space-y-1 ml-2">
                            <li>{paragraph.replace("- ", "")}</li>
                          </ul>
                        );
                      }
                      if (paragraph.startsWith("#### ")) {
                        return (
                          <h5 key={idx} className="text-[12px] font-semibold text-slate-700 mt-3 mb-1">
                            {paragraph.replace("#### ", "")}
                          </h5>
                        );
                      }
                      return (
                        <p key={idx} className="mb-2">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 使用している要件 */}
            {relatedRequirements.length > 0 && (
              <Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
                <CardHeader className="border-b border-slate-100 px-4 py-2.5">
                  <CardTitle className="text-[15px] font-semibold text-slate-900">使用している要件</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-2">
                    {relatedRequirements.map((req: RequirementReference) => (
                      <li key={req.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-white px-3 py-2 hover:border-slate-200/60 transition-colors">
                        <div className="flex-1">
                          <div className="font-mono text-[12px] text-slate-400">{req.id}</div>
                          <div className="text-[13px] text-slate-700">{req.title}</div>
                        </div>
                        <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                          {req.type}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
