"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/ordenes", label: "Ordenes" },
  { href: "/admin/mensajes", label: "Mensajes" },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.replace("/admin/login")
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/admin" && pathname.startsWith(href))
  }

  function renderLinks(onClick?: () => void) {
    return links.map((link) => (
      <Link
        key={link.href}
        className={cn(
          "block rounded px-2 py-1 transition-colors hover:bg-muted",
          isActive(link.href) && "bg-primary/10 text-primary"
        )}
        href={link.href}
        onClick={onClick}
      >
        {link.label}
      </Link>
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
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
          <aside className="relative flex h-full w-64 flex-col border-r bg-background p-4">
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

            <nav className="flex-1 space-y-2 text-sm">{renderLinks(() => setMenuOpen(false))}</nav>

            <div className="mt-auto space-y-2">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <Home className="h-4 w-4" />
                Volver a la pagina principal
              </Link>
              <button
                onClick={handleLogout}
                className="w-full rounded-md border px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600"
              >
                Cerrar sesion
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-card p-4 lg:flex lg:flex-col">
          <h2 className="mb-6 font-semibold">Panel Admin</h2>

          <nav className="flex-1 space-y-2 text-sm">{renderLinks()}</nav>

          <div className="mt-auto space-y-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Home className="h-4 w-4" />
              Volver a la pagina principal
            </Link>
            <button
              onClick={handleLogout}
              className="w-full rounded-md border px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600"
            >
              Cerrar sesion
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
