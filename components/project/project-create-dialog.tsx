"use client"

import { useState } from "react"
import { useProject } from "./project-context"
import { createProject } from "@/lib/data/projects"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface ProjectCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectCreateDialog({ open, onOpenChange }: ProjectCreateDialogProps) {
  const { refreshProjects, setCurrentProjectId } = useProject()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    const { data: project, error: createError } = await createProject({
      name,
      description: description || null,
    })

    if (createError || !project) {
      setError(createError ?? "作成に失敗しました")
      setSubmitting(false)
      return
    }

    // プロジェクト一覧を更新
    await refreshProjects()

    // 作成したプロジェクトに切り替え
    setCurrentProjectId(project.id)

    setSubmitting(false)
    onOpenChange(false)

    // フォームをリセット
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規プロジェクト作成</DialogTitle>
          <DialogDescription>
            新しいプロジェクトを作成します。プロジェクト名は必須です。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                プロジェクト名<span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="例: ECサイトリニューアル"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="プロジェクトの説明を入力してください（任意）"
                className="min-h-[100px]"
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting} className="bg-slate-900 hover:bg-slate-800">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                "作成"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
