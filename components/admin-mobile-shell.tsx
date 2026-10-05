"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Home, LogOut, Menu, MoreHorizontal, X } from "lucide-react"

import {
  AdminNavIcon,
  type AdminNavGroup,
  type AdminNavLink,
} from "@/components/admin-navigation"
import { cn } from "@/lib/utils"

const bottomNav: AdminNavLink[] = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/taller", label: "Taller", image: "/images/admin-icons/taller.webp" },
  { href: "/admin/ventas", label: "Ventas", image: "/images/admin-icons/ventas.webp" },
  { href: "/admin/productos", label: "Productos", image: "/images/admin-icons/productos.webp" },
]

const primaryPaths = new Set(bottomNav.map((link) => link.href))

function activePath(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href))
}

export function AdminMobileShell({
  groups,
  pathname,
  onLogout,
}: {
  groups: AdminNavGroup[]
  pathname: string
  onLogout: () => Promise<void>
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    if (!drawerOpen && !moreOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawerOpen, moreOpen])

  const secondaryLinks = useMemo(
    () => groups.flatMap((group) => group.links).filter((link) => !primaryPaths.has(link.href)),
    [groups]
  )
  const moreActive = secondaryLinks.some((link) => activePath(pathname, link.href))

  return (
    <>
      <header className="admin-mobile-header sticky top-0 z-40 hidden items-center justify-between border-b border-slate-200/70 bg-white/82 px-4 backdrop-blur-2xl print:hidden max-lg:flex">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="admin-mobile-tap grid h-10 w-10 place-items-center rounded-full bg-slate-100/80 text-slate-700"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/admin" className="absolute left-1/2 -translate-x-1/2" aria-label="Ir al resumen">
          <Image
            src="/images/documents/amg-logo-document.png"
            alt="AMG Radiadores"
            width={1768}
            height={768}
            priority
            className="h-auto w-[108px] object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/mensajes"
            className="admin-mobile-tap grid h-10 w-10 place-items-center rounded-full bg-slate-100/80"
            aria-label="Mensajes"
          >
            <Image src="/images/admin-icons/mensajes.webp" alt="" width={192} height={192} className="h-6 w-6 object-contain" />
          </Link>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#071b33] text-[11px] font-bold tracking-wide text-white shadow-sm">
            AMG
          </span>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[70] hidden transition max-lg:block",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity duration-250",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
          aria-label="Cerrar menú"
        />
        <aside
          className={cn(
            "admin-mobile-drawer absolute inset-y-0 left-0 flex w-[min(84vw,330px)] flex-col overflow-hidden border-r border-white/10 bg-[#061426]/95 text-white shadow-2xl backdrop-blur-2xl transition-transform duration-250 ease-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
            <Image src="/images/documents/amg-logo-document.png" alt="AMG Radiadores" width={1768} height={768} className="h-auto w-32 brightness-0 invert" />
            <button type="button" onClick={() => setDrawerOpen(false)} className="admin-mobile-tap grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
            {groups.map((group) => (
              <section key={group.label}>
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{group.label}</p>
                <div className="mt-2 space-y-1">
                  {group.links.map((link) => {
                    const active = activePath(pathname, link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          "admin-mobile-tap flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium text-white/72 transition",
                          active && "border-blue-300/20 bg-blue-500/20 text-white shadow-[inset_0_1px_rgba(255,255,255,.08)]"
                        )}
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8">
                          <AdminNavIcon link={link} className="h-6 w-6 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,.3)]" />
                        </span>
                        <span>{link.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </nav>

          <div className="space-y-2 border-t border-white/10 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            <Link href="/" onClick={() => setDrawerOpen(false)} className="admin-mobile-tap flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 text-xs font-semibold text-white/75">
              <Home className="h-4 w-4" />
              Volver a la página principal
            </Link>
            <button type="button" onClick={() => void onLogout()} className="admin-mobile-tap flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold text-rose-300">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>
      </div>

      <nav className="admin-mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 hidden border-t border-slate-200/70 bg-white/88 px-2 pt-2 shadow-[0_-12px_35px_rgba(15,23,42,.08)] backdrop-blur-2xl print:hidden max-lg:grid">
        {bottomNav.map((link) => {
          const active = activePath(pathname, link.href)
          return (
            <Link key={link.href} href={link.href} className={cn("admin-mobile-tap flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium text-slate-400", active && "text-[#0878f9]")}>
              <AdminNavIcon link={link} className={cn("h-6 w-6 object-contain transition", !active && link.image && "grayscale opacity-55")} />
              <span className="truncate">{link.label}</span>
            </Link>
          )
        })}
        <button type="button" onClick={() => setMoreOpen(true)} className={cn("admin-mobile-tap flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium text-slate-400", moreActive && "text-[#0878f9]")}>
          <MoreHorizontal className="h-6 w-6" />
          <span>Más</span>
        </button>
      </nav>

      <div className={cn("fixed inset-0 z-[80] hidden max-lg:block", moreOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!moreOpen}>
        <button type="button" onClick={() => setMoreOpen(false)} className={cn("absolute inset-0 bg-slate-950/35 backdrop-blur-sm transition-opacity duration-200", moreOpen ? "opacity-100" : "opacity-0")} aria-label="Cerrar más opciones" />
        <section className={cn("absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-white bg-white/96 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_60px_rgba(15,23,42,.18)] backdrop-blur-2xl transition-transform duration-250", moreOpen ? "translate-y-0" : "translate-y-full")}>
          <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-300" />
          <div className="mt-4 flex items-center justify-between">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Navegación</p><h2 className="text-xl font-semibold tracking-tight">Más módulos</h2></div>
            <button type="button" onClick={() => setMoreOpen(false)} className="admin-mobile-tap grid h-10 w-10 place-items-center rounded-full bg-slate-100" aria-label="Cerrar"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-5 grid max-h-[54dvh] grid-cols-3 gap-3 overflow-y-auto pb-2">
            {secondaryLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMoreOpen(false)} className={cn("admin-mobile-tap flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-center text-[11px] font-semibold text-slate-600", activePath(pathname, link.href) && "border-blue-200 bg-blue-50 text-blue-700")}>
                <AdminNavIcon link={link} className="h-10 w-10 object-contain drop-shadow-[0_5px_9px_rgba(15,23,42,.15)]" />
                <span className="line-clamp-2 leading-tight">{link.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
