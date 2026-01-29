"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Mic, Sparkles, Check } from "lucide-react"

type DiffOperation = "add" | "modify" | "delete"

interface DiffCandidate {
  id: string
  operation: DiffOperation
  taskName: string
  reason: string
  checked: boolean
}

export default function AiOrderPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: businessKey } = use(params)
  const router = useRouter()
  const [inputText, setInputText] = useState("")
  const [diffCandidates, setDiffCandidates] = useState<DiffCandidate[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const getOperationBadgeStyle = (operation: DiffOperation) => {
    switch (operation) {
      case "add":
        return "bg-green-50 text-green-700 border-green-200"
      case "modify":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "delete":
        return "bg-red-50 text-red-700 border-red-200"
    }
  }

  const getOperationLabel = (operation: DiffOperation) => {
    switch (operation) {
      case "add":
        return "追加"
      case "modify":
        return "修正"
      case "delete":
        return "削除"
    }
  }

  const handleAnalyze = () => {
    if (!inputText.trim()) return
    setIsAnalyzing(true)

    setTimeout(() => {
      setDiffCandidates([
        {
          id: "1",
          operation: "add",
          taskName: "適格請求書発行機能",
          reason: "入力文から「適格請求書発行」が抽出され、請求業務に関連する新規機能として識別されました。",
          checked: true
        },
        {
          id: "2",
          operation: "modify",
          taskName: "請求業務 - 税額計算ロジック",
          reason: "インボイス制度対応により、既存の税額計算ロジックの変更が必要です。",
          checked: true
        }
      ])
      setIsAnalyzing(false)
    }, 2000)
  }

  const handleToggleCheck = (candidateId: string) => {
    setDiffCandidates(prev =>
      prev.map(candidate =>
        candidate.id === candidateId
          ? { ...candidate, checked: !candidate.checked }
          : candidate
      )
    )
  }

  const handleConfirm = () => {
    const selected = diffCandidates.filter(c => c.checked)
    alert(`${selected.length}件の差分候補を確定しました（LLM連携は未実装）`)
    router.push(`/business/${businessKey}`)
  }

  return (
    <>
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          {/* ヘッダー */}
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/business/${businessKey}`} className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Link>
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
              AI修正指示
            </h1>
          </div>

          {/* 入力セクション */}
          <Card className="mb-6 rounded-md border border-slate-200 bg-white">
            <CardContent className="p-6">
              <label className="block text-[14px] font-medium text-slate-900 mb-3">
                修正内容を入力してください
              </label>
              <div className="relative">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="例: インボイス制度対応のため、請求業務に適格請求書発行機能を追加してください"
                  className="min-h-[120px] pr-12 text-[14px] border-slate-200 focus:border-slate-400"
                />
                <button
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  title="音声入力（未実装）"
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={!inputText.trim() || isAnalyzing}
                className="mt-4 gap-2 bg-slate-900 hover:bg-slate-800"
              >
                <Sparkles className="h-4 w-4" />
                {isAnalyzing ? "分析中..." : "AI分析を実行"}
              </Button>
            </CardContent>
          </Card>

          {/* 差分候補セクション */}
          {diffCandidates.length > 0 && (
            <div className="mb-6">
              <h2 className="text-[20px] font-semibold text-slate-900 mb-4">
                差分候補
              </h2>
              <div className="space-y-3">
                {diffCandidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    className="rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`candidate-${candidate.id}`}
                          checked={candidate.checked}
                          onCheckedChange={() => handleToggleCheck(candidate.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={getOperationBadgeStyle(candidate.operation)}
                            >
                              {getOperationLabel(candidate.operation)}
                            </Badge>
                            <span className="text-[16px] font-medium text-slate-900">
                              {candidate.taskName}
                            </span>
                          </div>
                          <div className="text-[14px] text-slate-600 mb-2">
                            <span className="font-medium">根拠:</span> {candidate.reason}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ボタンエリア */}
          {diffCandidates.length > 0 && (
            <div className="flex items-center gap-3">
              <Link href={`/business/${businessKey}`}>
                <Button variant="outline" className="h-9">
                  キャンセル
                </Button>
              </Link>
              <Button
                onClick={handleConfirm}
                className="h-9 bg-slate-900 hover:bg-slate-800"
                disabled={!diffCandidates.some(c => c.checked)}
              >
                <Check className="h-4 w-4 mr-2" />
                選択した候補を確定
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
