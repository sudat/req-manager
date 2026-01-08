"use client"

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
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
import { getTicketById } from "@/lib/mock/data/tickets/tickets";
import { businesses } from "@/lib/mock/data";
import type { Ticket, TicketStatus, TicketPriority, BusinessArea } from "@/lib/mock/data/types";

export default function TicketEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const existingTicket = getTicketById(id);

  // ステータス表示値マッピング
  const statusLabels: Record<TicketStatus, string> = {
    open: "未対応",
    review: "レビュー中",
    approved: "承認済",
    applied: "適用済",
  };

  // 優先度表示値マッピング
  const priorityLabels: Record<TicketPriority, string> = {
    low: "低",
    medium: "中",
    high: "高",
  };

  // 影響領域の設定（統一色）
  const areaConfig = [
    { key: "AR", label: "AR", class: "border-slate-400 bg-slate-100" },
    { key: "AP", label: "AP", class: "border-slate-400 bg-slate-100" },
    { key: "GL", label: "GL", class: "border-slate-400 bg-slate-100" },
  ];

  // フォーム状態
  const [title, setTitle] = useState(existingTicket?.title || "");
  const [description, setDescription] = useState(existingTicket?.description || "");
  const [background, setBackground] = useState(existingTicket?.background || "");
  const [status, setStatus] = useState<TicketStatus>(existingTicket?.status || "open");
  const [priority, setPriority] = useState<TicketPriority>(existingTicket?.priority || "medium");
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>(existingTicket?.businessIds || []);
  const [selectedAreas, setSelectedAreas] = useState<BusinessArea[]>(existingTicket?.areas || []);
  const [targetVersions, setTargetVersions] = useState(existingTicket?.targetVersions?.join(", ") || "");

  // 日付フォーマット（ISO → YYYY-MM-DD）
  const formatDate = (isoDate: string): string => {
    return isoDate.split("T")[0];
  };

  // 業務トグル関数
  const toggleBusiness = (businessId: string) => {
    setSelectedBusinessIds(prev =>
      prev.includes(businessId) ? prev.filter(id => id !== businessId) : [...prev, businessId]
    );
  };

  // 領域トグル関数
  const toggleArea = (area: BusinessArea) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  // 保存処理（デモ）
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("保存しました（デモ）");
    // 将来的にはAPI呼び出しやstate更新を実装
  };

  if (!existingTicket) {
    return (
      <>
        <Sidebar />
        <div className="ml-[280px] flex-1 min-h-screen bg-white">
          <div className="mx-auto max-w-[1400px] px-8 py-4">
            <p className="text-slate-600">チケットが見つかりません</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <Link href={`/tickets/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            チケット詳細に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">変更要求を編集</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本情報カード */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">基本情報</h2>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>チケットID</Label>
                    <Input value={existingTicket.id} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label>起票者</Label>
                    <Input value={existingTicket.requestedBy} disabled />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>起票日</Label>
                    <Input value={formatDate(existingTicket.createdAt)} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label>更新日</Label>
                    <Input value={formatDate(existingTicket.updatedAt)} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    タイトル<span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="タイトルを入力"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>説明</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="変更要求の説明を入力"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>背景・目的</Label>
                  <Textarea
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    placeholder="変更要求の背景や目的を入力"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>ステータス</Label>
                    <Select value={status} onValueChange={(value) => setStatus(value as TicketStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>優先度</Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as TicketPriority)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* 影響範囲カード */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">影響範囲</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>影響業務</Label>
                  <div className="flex flex-wrap gap-2">
                    {businesses.map((business) => (
                      <Button
                        key={business.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBusiness(business.id)}
                        className={selectedBusinessIds.includes(business.id) ? "border-slate-400 bg-slate-100" : ""}
                      >
                        {business.name}
                      </Button>
                    ))}
                  </div>
                  {selectedBusinessIds.length === 0 && (
                    <p className="text-xs text-slate-500">影響業務を選択してください</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>影響領域</Label>
                  <div className="flex flex-wrap gap-2">
                    {areaConfig.map((area) => (
                      <Button
                        key={area.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleArea(area.key as BusinessArea)}
                        className={selectedAreas.includes(area.key as BusinessArea) ? area.class : ""}
                      >
                        {area.label}
                      </Button>
                    ))}
                  </div>
                  {selectedAreas.length === 0 && (
                    <p className="text-xs text-slate-500">影響領域を選択してください</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>ターゲットバージョン</Label>
                  <Input
                    value={targetVersions}
                    onChange={(e) => setTargetVersions(e.target.value)}
                    placeholder="カンマ区切りで複数入力可能（例: v2.0, v2.1）"
                  />
                  <p className="text-xs text-slate-500">カンマ区切りで複数入力可能</p>
                </div>
              </div>
            </Card>

            {/* 補足情報 */}
            <Card className="p-4 bg-slate-50 border-slate-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-slate-500 mt-0.5" />
                <div className="text-xs text-slate-600">
                  <p className="font-medium mb-1">編集内容の保存について</p>
                  <p>現在はデモ実装のため、保存ボタンを押してもデータは更新されません。将来的にはAPI連携を実装予定です。</p>
                </div>
              </div>
            </Card>

            {/* アクションボタン */}
            <div className="flex gap-3">
              <Link href={`/tickets/${id}`}>
                <Button type="button" variant="outline">
                  キャンセル
                </Button>
              </Link>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                保存
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
