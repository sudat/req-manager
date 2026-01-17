"use client"

import { createContext, useContext, useState, ReactNode } from "react"

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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem("sidebar-collapsed") === "true"
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleSetIsCollapsed = (value: boolean) => {
    setIsCollapsed(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(value))
    }
  }

  const handleSetIsMobileOpen = (value: boolean) => {
    setIsMobileOpen(value)
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
