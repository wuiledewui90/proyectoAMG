"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

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
    <div className="min-h-screen">
      <div className="flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold">Administrador</span>
          <span className="text-xs text-muted-foreground">Panel Admin</span>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar menu"
          />
          <aside className="relative h-full w-64 border-r bg-background p-4 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-semibold">Panel Admin</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border"
                aria-label="Cerrar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-2 text-sm">
              <Link
                className="block rounded px-2 py-1 hover:bg-muted"
                href="/admin/productos"
                onClick={() => setMenuOpen(false)}
              >
                Productos
              </Link>
              <Link
                className="block rounded px-2 py-1 hover:bg-muted"
                href="/admin/ordenes"
                onClick={() => setMenuOpen(false)}
              >
                Órdenes
              </Link>
              <Link
                className="block rounded px-2 py-1 hover:bg-muted"
                href="/admin/mensajes"
                onClick={() => setMenuOpen(false)}
              >
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
        </div>
      )}

      <div className="flex">
        <aside className="hidden w-64 border-r p-4 lg:flex lg:flex-col">
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
    </div>
  )
}
