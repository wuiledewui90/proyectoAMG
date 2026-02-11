// app/admin/layout.tsx
"use client"

import { AdminAuthProvider, RequireAuth } from "@/lib/admin-auth"
import { AdminShell } from "./admin-shell"
import { usePathname } from "next/navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === "/admin/login") {
    return <AdminAuthProvider>{children}</AdminAuthProvider>
  }

  return (
    <AdminAuthProvider>
      <RequireAuth>
        <AdminShell>{children}</AdminShell>
      </RequireAuth>
    </AdminAuthProvider>
  )
}
