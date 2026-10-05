"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminAppSetup } from "@/components/admin-app-install"
import { AdminMobileShell } from "@/components/admin-mobile-shell"
import { AdminNavIcon, adminLinkGroups, mechanicLinkGroups } from "@/components/admin-navigation"
import { MobileWelcomeOverlay } from "@/components/mobile-welcome-overlay"
import { AdminQuickAccess } from "@/components/admin-quick-access"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
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
    const visibleGroups = sessionRole === "TECHNICIAN" ? mechanicLinkGroups : adminLinkGroups

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
                      <AdminNavIcon
                        link={link}
                        className={cn(
                          "shrink-0",
                          link.image
                            ? "h-7 w-7 object-contain drop-shadow-[0_3px_5px_rgba(15,23,42,.22)]"
                            : "h-4 w-4"
                        )}
                      />
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
      <MobileWelcomeOverlay />
      <div className="admin-authenticated-content">
        <AdminMobileShell
          groups={sessionRole === "TECHNICIAN" ? mechanicLinkGroups : adminLinkGroups}
          pathname={pathname}
          onLogout={handleLogout}
        />

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
                ? "px-3 py-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-3 lg:p-3"
                : "px-4 py-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:p-6"
            )}
          >
            <AdminQuickAccess pathname={pathname} />
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
