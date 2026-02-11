"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

interface AdminAuthContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
  isHydrated: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
)

// Default credentials (DEV only - change in production)
const ADMIN_USER = "pancho"
const ADMIN_PASS = "amg2026"

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const session = localStorage.getItem("amg-admin-session")
    if (session === "authenticated") {
      setIsAuthenticated(true)
    }
    setIsHydrated(true)
  }, [])

  function login(username: string, password: string): boolean {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setIsAuthenticated(true)
      localStorage.setItem("amg-admin-session", "authenticated")
      return true
    }
    return false
  }

  function logout() {
    setIsAuthenticated(false)
    localStorage.removeItem("amg-admin-session")
  }

  if (!isHydrated) {
    return null
  }

  return (
    <AdminAuthContext.Provider
      value={{ isAuthenticated, login, logout, isHydrated }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider")
  }
  return context
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrated } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isHydrated) return
    if (!isAuthenticated) {
      router.replace("/admin/login")
    }
  }, [isAuthenticated, isHydrated, router])

  if (!isHydrated || !isAuthenticated) return null

  return <>{children}</>
}
