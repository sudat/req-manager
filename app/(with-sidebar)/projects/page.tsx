"use client"

import { useState } from "react"
import Link from "next/link"
import { useProject } from "@/components/project/project-context"
import { deleteProject } from "@/lib/data/projects"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Edit, Trash2, FolderKanban, ArrowLeft, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ProjectsPage() {
  const { projects, currentProjectId, refreshProjects, loading, error: projectsError } = useProject()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId)
    setDeleteDialogOpen(true)
    setError(null)
  }

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return

    setDeleting(true)
    setError(null)

    const { error: deleteError } = await deleteProject(projectToDelete)

    if (deleteError) {
      setError(deleteError)
      setDeleting(false)
      return
    }

    // プロジェクト一覧を更新
    await refreshProjects()

    setDeleting(false)
    setDeleteDialogOpen(false)
    setProjectToDelete(null)
  }

  const canDelete = (projectId: string) => {
    // 現在選択中のプロジェクトは削除不可
    if (projectId === currentProjectId) return false
    // 最後の1件は削除不可
    if (projects.length <= 1) return false
    return true
  }

  const getDeleteTooltip = (projectId: string) => {
    if (projectId === currentProjectId) return "現在選択中のプロジェクトは削除できません"
    if (projects.length <= 1) return "最後のプロジェクトは削除できません"
    return undefined
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードに戻る
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">プロジェクト管理</h1>
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-40 rounded-md bg-slate-200 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && projectsError && (
          <Card className="p-8 border-rose-200 bg-rose-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-700">プロジェクトの読み込みに失敗しました</p>
                <p className="text-sm text-rose-600 mt-1">{projectsError}</p>
              </div>
            </div>
          </Card>
        )}

        {!loading && !projectsError && projects.length === 0 && (
          <Card className="p-12 text-center">
            <FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">プロジェクトがありません</p>
            <p className="text-xs text-slate-500 mt-2">右下のプロジェクトスイッチャーから作成できます。</p>
          </Card>
        )}

        {!loading && !projectsError && projects.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const isDeletable = canDelete(project.id)
              const deleteTooltip = getDeleteTooltip(project.id)

              return (
                <Card key={project.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-slate-500" />
                      <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                    </div>
                    {project.id === currentProjectId && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        選択中
                      </span>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{project.description}</p>
                  )}

                  <div className="text-xs text-slate-500 mb-4">
                    <div>ID: {project.id}</div>
                    <div>作成: {new Date(project.createdAt).toLocaleDateString("ja-JP")}</div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/projects/${project.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-1" />
                        編集
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(project.id)}
                      disabled={!isDeletable}
                      title={deleteTooltip}
                      className="flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      削除
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              プロジェクトの削除
            </DialogTitle>
            <DialogDescription>
              このプロジェクトを削除してもよろしいですか？
              <br />
              プロジェクトに関連するすべてのデータが削除される可能性があります。
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
