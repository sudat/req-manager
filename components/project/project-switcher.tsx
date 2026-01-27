"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, FolderKanban, Plus, Settings } from "lucide-react"
import Link from "next/link"
import { useProject } from "./project-context"
import { useSidebar } from "@/components/layout/sidebar-context"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ProjectCreateDialog } from "./project-create-dialog"

export function ProjectSwitcher() {
  const { currentProject, projects, setCurrentProjectId, error } = useProject()
  const { isCollapsed } = useSidebar()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-center p-2"
            title={currentProject?.name ?? "プロジェクト選択"}
          >
            <FolderKanban className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>プロジェクト</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {error && (
            <DropdownMenuItem disabled className="text-rose-600">
              読み込みエラー
            </DropdownMenuItem>
          )}
          {!error && projects.length === 0 && (
            <DropdownMenuItem disabled className="text-slate-500">
              プロジェクトがありません
            </DropdownMenuItem>
          )}
          {!error && projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => setCurrentProjectId(project.id)}
              className={cn(
                "cursor-pointer",
                currentProject?.id === project.id && "bg-accent"
              )}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  currentProject?.id === project.id ? "opacity-100" : "opacity-0"
                )}
              />
              {project.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreateOpen(true)} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            新規プロジェクト作成
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/projects" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              プロジェクト管理
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-2 h-auto py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FolderKanban className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-sm font-medium">
                {currentProject?.name ?? "プロジェクト選択"}
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 flex-shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>プロジェクト</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {error && (
            <DropdownMenuItem disabled className="text-rose-600">
              読み込みエラー
            </DropdownMenuItem>
          )}
          {!error && projects.length === 0 && (
            <DropdownMenuItem disabled className="text-slate-500">
              プロジェクトがありません
            </DropdownMenuItem>
          )}
          {!error && projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => setCurrentProjectId(project.id)}
              className={cn(
                "cursor-pointer",
                currentProject?.id === project.id && "bg-accent"
              )}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  currentProject?.id === project.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{project.name}</span>
                {project.description && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {project.description}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreateOpen(true)} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            新規プロジェクト作成
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/projects" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              プロジェクト管理
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectCreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  )
}
