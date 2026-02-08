import React from "react"
import type { Metadata } from "next"
import { AdminShell } from "./admin-shell"

export const metadata: Metadata = {
  title: {
    default: "Admin | RADIADORES AMG",
    template: "%s | Admin RADIADORES AMG",
  },
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
