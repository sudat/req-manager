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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleCollapsed = () => setIsCollapsed((prev) => !prev)
  const toggleMobileOpen = () => setIsMobileOpen((prev) => !prev)

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        setIsCollapsed,
        setIsMobileOpen,
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
