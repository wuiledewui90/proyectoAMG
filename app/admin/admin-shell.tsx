"use client"

import React from "react"

import { AdminAuthProvider } from "@/lib/admin-auth"

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>
}
