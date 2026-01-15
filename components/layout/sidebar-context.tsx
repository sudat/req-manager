"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface SidebarContextValue {
  isCollapsed: boolean
  isMobileOpen: boolean
  setIsCollapsed: (value: boolean) => void
  setIsMobileOpen: (value: boolean) => void
  toggleCollapsed: () => void
  toggleMobileOpen: () => void
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // ハイドレーション後にlocalStorageから読み込む
  useEffect(() => {
    setIsCollapsed(localStorage.getItem('sidebar-collapsed') === 'true')
    setIsMobileOpen(localStorage.getItem('sidebar-mobile-open') === 'true')
  }, [])

  const handleSetIsCollapsed = (value: boolean) => {
    setIsCollapsed(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(value))
    }
  }

  const handleSetIsMobileOpen = (value: boolean) => {
    setIsMobileOpen(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-mobile-open', String(value))
    }
  }

  const toggleCollapsed = () => setIsCollapsed((prev) => !prev)
  const toggleMobileOpen = () => setIsMobileOpen((prev) => !prev)

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        setIsCollapsed: handleSetIsCollapsed,
        setIsMobileOpen: handleSetIsMobileOpen,
        toggleCollapsed,
        toggleMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider")
  }
  return context
}
