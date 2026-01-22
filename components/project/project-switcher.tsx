"use client"

import { Check, ChevronsUpDown, FolderKanban } from "lucide-react"
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

export function ProjectSwitcher() {
  const { currentProject, projects, setCurrentProjectId } = useProject()
  const { isCollapsed } = useSidebar()

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
          {projects.map((project) => (
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
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
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
        {projects.map((project) => (
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
