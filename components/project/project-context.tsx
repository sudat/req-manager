"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { listProjects } from "@/lib/data/projects"
import type { Project } from "@/lib/domain"

interface ProjectContextValue {
  currentProjectId: string | undefined
  currentProject: Project | null
  projects: Project[]
  loading: boolean
  error: string | null
  setCurrentProjectId: (id: string) => void
  refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

const STORAGE_KEY = "current-project-id"
const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProjectId, setCurrentProjectIdState] = useState<string | undefined>(undefined)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const persistProjectId = (id: string) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, id)
    document.cookie = `${STORAGE_KEY}=${id}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}`
  }

  const clearPersistedProjectId = () => {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
    document.cookie = `${STORAGE_KEY}=; path=/; max-age=0`
  }

  const refreshProjects = async () => {
    try {
      const { data, error } = await listProjects()
      if (error) {
        console.error("Failed to fetch projects:", error)
        setError(error)
        setProjects([])
        return
      }

      setError(null)
      setProjects(data ?? [])

      // 現在のプロジェクトIDが削除されている場合は、デフォルトプロジェクトに切り替え
      if (currentProjectId && !data?.some(p => p.id === currentProjectId)) {
        if (data && data.length > 0) {
          const defaultProject = data.find(p => p.id === DEFAULT_PROJECT_ID) ?? data[0]
          setCurrentProjectIdState(defaultProject.id)
          persistProjectId(defaultProject.id)
        } else {
          setCurrentProjectIdState(undefined)
          clearPersistedProjectId()
        }
      }
    } catch (err) {
      console.error("Error fetching projects:", err)
      setError("プロジェクトの取得に失敗しました")
      setProjects([])
    }
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await listProjects()
        if (error) {
          console.error("Failed to fetch projects:", error)
          setError(error)
          setProjects([])
          return
        }

        setError(null)
        setProjects(data ?? [])

        // LocalStorageから現在のプロジェクトIDを取得
        const storedProjectId = typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY)
          : null

        // 有効なプロジェクトIDの場合は使用、そうでなければデフォルトプロジェクト
        if (storedProjectId && data?.some(p => p.id === storedProjectId)) {
          setCurrentProjectIdState(storedProjectId)
          persistProjectId(storedProjectId)
        } else if (data && data.length > 0) {
          // デフォルトプロジェクトがあればそれを、なければ最初のプロジェクトを選択
          const defaultProject = data.find(p => p.id === DEFAULT_PROJECT_ID) ?? data[0]
          setCurrentProjectIdState(defaultProject.id)
          persistProjectId(defaultProject.id)
        } else {
          setCurrentProjectIdState(undefined)
          clearPersistedProjectId()
        }
      } catch (err) {
        console.error("Error fetching projects:", err)
        setError("プロジェクトの取得に失敗しました")
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const setCurrentProjectId = (id: string) => {
    setCurrentProjectIdState(id)
    persistProjectId(id)
  }

  const currentProject = projects.find(p => p.id === currentProjectId) ?? null

  return (
    <ProjectContext.Provider
      value={{
        currentProjectId,
        currentProject,
        projects,
        loading,
        error,
        setCurrentProjectId,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider")
  }
  return context
}
