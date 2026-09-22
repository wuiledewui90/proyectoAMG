"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  UserCog,
  Users,
  Wrench,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminAppSetup } from "@/components/admin-app-install"

const linkGroups = [
  {
    label: "Inicio",
    links: [{ href: "/admin", label: "Resumen", icon: LayoutDashboard }],
  },
  {
    label: "Operación del taller",
    links: [
      { href: "/admin/taller", label: "Órdenes de taller", icon: Wrench },
      { href: "/admin/ventas", label: "Ventas", icon: ShoppingCart },
      { href: "/admin/documentos", label: "Presupuestos y facturas", icon: FileText },
      { href: "/admin/ordenes", label: "Pedidos web", icon: ClipboardList },
    ],
  },
  {
    label: "Gestión",
    links: [
      { href: "/admin/productos", label: "Productos", icon: Package },
      { href: "/admin/clientes", label: "Clientes", icon: Users },
      { href: "/admin/gastos", label: "Gastos", icon: Receipt },
      { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
    ],
  },
  {
    label: "Comunicación",
    links: [{ href: "/admin/mensajes", label: "Mensajes", icon: MessageSquare }],
  },
  {
    label: "Administración",
    links: [
      { href: "/admin/usuarios", label: "Usuarios", icon: UserCog },
      { href: "/admin/seguridad", label: "Seguridad", icon: ShieldCheck },
      { href: "/admin/configuracion", label: "Configuración", icon: Settings },
    ],
  },
]

const mechanicLinkGroups = [
  {
    label: "Mi trabajo",
    links: [{ href: "/admin/mis-tareas", label: "Mis tareas", icon: Wrench }],
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [sessionRole, setSessionRole] = useState<string | null>(null)

  useEffect(() => {
    if (pathname === "/admin/login") return

    void fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((session) => setSessionRole(session?.role || null))
  }, [pathname])

  if (pathname === "/admin/login") {
    return (
      <>
        <AdminAppSetup />
        {children}
      </>
    )
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.replace("/admin/login")
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/admin" && pathname.startsWith(href))
  }

  function renderLinks(onClick?: () => void) {
    const visibleGroups = sessionRole === "TECHNICIAN" ? mechanicLinkGroups : linkGroups

    return visibleGroups.map((group, groupIndex) => {
      const containsActiveLink = group.links.some((link) => isActive(link.href))
      const isOpen = openGroups[group.label] ?? true

      return (
        <section
          key={group.label}
          aria-label={group.label}
          className={cn(groupIndex < visibleGroups.length - 1 && "border-b border-border/70 pb-3")}
        >
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() =>
              setOpenGroups((current) => ({
                ...current,
                [group.label]: !(current[group.label] ?? true),
              }))
            }
            className={cn(
              "w-full rounded-md px-3 py-1.5 text-left text-[0.64rem] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              containsActiveLink && "text-foreground"
            )}
          >
            {group.label}
          </button>
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-200",
              isOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="ml-3 space-y-1 border-l pl-2 pt-1">
                {group.links.map((link) => {
                  const Icon = link.icon

                  return (
                    <Link
                      key={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-colors hover:bg-muted",
                        isActive(link.href) && "bg-primary/10 text-primary"
                      )}
                      href={link.href}
                      onClick={onClick}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )
    })
  }

  return (
    <div className="admin-panel min-h-screen bg-background print:min-h-0 print:bg-white">
      <AdminAppSetup />
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur print:hidden lg:hidden">
        <span className="text-sm font-semibold">Radiadores AMG</span>
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
            <div className="mb-4 flex items-center justify-between gap-3">
              <Image
                src="/images/documents/amg-logo-document.png"
                alt="AMG Radiadores"
                width={1768}
                height={768}
                className="h-auto w-32 object-contain object-left"
              />
              <button
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border"
                aria-label="Cerrar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-sm">{renderLinks(() => setMenuOpen(false))}</nav>

            <div className="mt-auto space-y-1.5 pt-2">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Home className="h-4 w-4" />
                Volver a la pagina principal
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar sesion
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-card p-3 print:hidden lg:flex lg:flex-col">
          <div className="mb-4">
            <Image
              src="/images/documents/amg-logo-document.png"
              alt="AMG Radiadores"
              width={1768}
              height={768}
              className="h-auto w-36 max-w-full object-contain object-left"
              priority
            />
          </div>

          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-sm">{renderLinks()}</nav>

          <div className="mt-auto space-y-1.5 pt-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <Home className="h-4 w-4" />
              Volver a la pagina principal
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesion
            </button>
          </div>
        </aside>

        <main
          className={cn(
            "min-w-0 flex-1 print:p-0",
            pathname === "/admin/ventas"
              ? "px-2 py-4 sm:px-3 lg:p-3"
              : "px-4 py-5 sm:px-6 lg:p-6"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
