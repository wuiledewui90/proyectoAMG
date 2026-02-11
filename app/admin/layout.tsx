// app/admin/layout.tsx
"use client"

import { AdminAuthProvider, RequireAuth } from "@/lib/admin-auth"
import { AdminShell } from "./admin-shell"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <RequireAuth>
        <AdminShell>{children}</AdminShell>
      </RequireAuth>
    </AdminAuthProvider>
  )
}
