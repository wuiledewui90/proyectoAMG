"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  // ✅ IMPORTANTE: el login NO debe mostrar el shell
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })

    // Por si quedó algo viejo de la auth anterior
    try {
      localStorage.removeItem("amg-admin-session")
    } catch {}

    router.replace("/admin/login")
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r p-4 flex flex-col">
        <h2 className="font-semibold mb-6">Panel Admin</h2>

        <nav className="flex-1 space-y-2 text-sm">
          <Link className="block rounded px-2 py-1 hover:bg-muted" href="/admin/productos">
            Productos
          </Link>
          <Link className="block rounded px-2 py-1 hover:bg-muted" href="/admin/ordenes">
            Órdenes
          </Link>
          <Link className="block rounded px-2 py-1 hover:bg-muted" href="/admin/mensajes">
            Mensajes
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto rounded-md border px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600"
        >
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
