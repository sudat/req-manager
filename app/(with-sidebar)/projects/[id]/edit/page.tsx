"use client"

import { use, useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { getProjectById, updateProject } from "@/lib/data/projects"
import { useProject } from "@/components/project/project-context"
import { normalizeGitHubUrl, validateGitHubUrl } from "@/lib/utils"
import type { Project } from "@/lib/domain"

export default function ProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { refreshProjects } = useProject()
  const [project, setProject] = useState<Project | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [reviewLinkThreshold, setReviewLinkThreshold] = useState<'low' | 'medium' | 'high'>('medium')
  const [autoSave, setAutoSave] = useState(true)
  const [githubUrlError, setGithubUrlError] = useState<string>("")
  const [isUrlTouched, setIsUrlTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    const fetchData = async () => {
      setLoading(true)
      const { data, error: fetchError } = await getProjectById(id)
      if (!active) return
      if (fetchError) {
        setError(fetchError)
        setProject(null)
      } else {
        setError(null)
        setProject(data ?? null)
        if (data) {
          setName(data.name)
          setDescription(data.description ?? "")
          setGithubUrl(data.githubUrl ?? "")
          setReviewLinkThreshold(data.reviewLinkThreshold ?? 'medium')
          setAutoSave(data.autoSave ?? true)
        }
      }
      setLoading(false)
    }
    fetchData()
    return () => {
      active = false
    }
  }, [id])

  const canSubmit = name.trim().length > 0 && !githubUrlError

  const handleGithubUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setGithubUrl(value)
    setIsUrlTouched(true)

    const validation = validateGitHubUrl(value)
    if (!validation.isValid) {
      setGithubUrlError(validation.error || "")
    } else {
      setGithubUrlError("")
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    const normalizedUrl = normalizeGitHubUrl(githubUrl)
    const validation = validateGitHubUrl(normalizedUrl)

    if (!validation.isValid) {
      setGithubUrlError(validation.error || "")
      setIsUrlTouched(true)
      return
    }

    setSaving(true)
    const { error: saveError } = await updateProject(id, {
      name: name.trim(),
      description: description.trim() || null,
      githubUrl: normalizedUrl || null,
      reviewLinkThreshold,
      autoSave,
    })

    setSaving(false)
    if (saveError) {
      setError(saveError)
      return
    }

    // プロジェクト一覧を更新
    await refreshProjects()

    router.push("/projects")
  }

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1200px] p-8">
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-32 animate-pulse" />
            <div className="h-10 bg-slate-200 rounded w-48 animate-pulse" />
            <div className="h-96 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1200px] p-8">
          <p className="text-sm text-rose-600">{error ?? "プロジェクトが見つかりません"}</p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mt-4"
          >
            <ArrowLeft className="h-4 w-4" />
            プロジェクト一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1200px] p-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          プロジェクト一覧に戻る
        </Link>

        <h1 className="text-2xl font-semibold text-slate-900 mb-6">プロジェクトを編集</h1>

        <Card className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>プロジェクトID</Label>
              <Input value={project.id} disabled />
              <p className="text-xs text-slate-500">プロジェクトIDは変更できません</p>
            </div>

            <div className="space-y-2">
              <Label>
                プロジェクト名<span className="text-rose-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例: ECサイトリニューアル"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>説明</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="プロジェクトの説明を入力してください（任意）"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>GitHubリポジトリ</Label>
              <Input
                type="url"
                value={githubUrl}
                onChange={handleGithubUrlChange}
                onBlur={() => setIsUrlTouched(true)}
                placeholder="https://github.com/owner/repo"
                aria-invalid={isUrlTouched && !!githubUrlError}
              />
              {isUrlTouched && githubUrlError && (
                <p className="text-xs text-rose-600">{githubUrlError}</p>
              )}
              <p className="text-xs text-slate-500">
                デフォルトのリポジトリURLを設定します。システム機能登録時のGitHubリンクの初期値として使用されます。
              </p>
            </div>

            <div className="space-y-2">
              <Label>要確認リンク判定基準</Label>
              <Select
                value={reviewLinkThreshold}
                onValueChange={(value) => setReviewLinkThreshold(value as 'low' | 'medium' | 'high')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低（緩い）</SelectItem>
                  <SelectItem value="medium">中（標準）</SelectItem>
                  <SelectItem value="high">高（厳密）</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                要件更新時に関連リンクを「要再確認」とする基準を設定します
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>自動保存</Label>
                <p className="text-xs text-slate-500">
                  編集内容を自動的に保存します
                </p>
              </div>
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>

            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Link href="/projects">
                <Button type="button" variant="outline">
                  キャンセル
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800"
                disabled={!canSubmit || saving}
              >
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
