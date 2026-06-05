"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { CartIcon3D } from "@/components/cart-icon"
import { useCart } from "@/lib/cart-context"
import { cn } from "@/lib/utils"
import { getWhatsAppUrl } from "@/lib/whatsapp"

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catalogo" },
  { href: "/servicios", label: "Servicios" },
  { href: "/sobre-nosotros", label: "Sobre Nosotros" },
  { href: "/contacto", label: "Contacto" },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { totalItems } = useCart()

  return (
    <header
      id="site-header"
      className="pointer-events-none fixed left-0 right-0 top-0 z-50 w-full"
    >
      <div className="flex items-center justify-center px-2 pt-0 sm:px-3">
        <div className="pointer-events-auto relative w-full">
          <nav
            id="nav-shell"
            className="flex w-full items-center justify-between rounded-lg border border-white/40 bg-white/30 px-3 py-3 shadow-lg shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-md sm:px-4 sm:py-2.5"
            aria-label="Principal"
          >
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 rounded-xl"
              aria-label="Inicio"
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm sm:h-10 sm:w-10">
                <span className="text-lg font-bold text-primary-foreground">
                  R
                </span>
              </div>
              <div className="hidden min-w-0 flex-col leading-none min-[420px]:flex">
                <span className="text-base font-bold tracking-tight text-black sm:text-lg">
                  RADIADORES
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-primary sm:text-xs">
                  AMG
                </span>
              </div>
            </Link>

            <ul className="hidden items-center gap-4 lg:flex xl:gap-6">
              {navLinks.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href)

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "group relative text-sm font-semibold text-black transition-colors duration-300 hover:text-primary sm:text-base",
                        active && "text-primary"
                      )}
                    >
                      {link.label}
                      <span
                        className={cn(
                          "absolute -bottom-1 left-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full",
                          active ? "w-full" : "w-0"
                        )}
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href={getWhatsAppUrl(
                  "Hola, me gustaria conocer mas sobre sus productos y servicios."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative hidden overflow-hidden rounded-lg bg-white/90 px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-xl hover:shadow-[0_16px_40px_rgba(255,255,255,0.40)] active:brightness-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent xl:inline-flex"
              >
                <span className="absolute inset-0 rounded-lg bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative">Solicitar Presupuesto</span>
              </a>
              <Link
                href="/admin/productos"
                className="hidden h-10 items-center rounded-lg border border-white/40 bg-white/70 px-3 text-[11px] font-semibold uppercase tracking-wide text-black shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-primary hover:shadow-md md:inline-flex"
                aria-label="Acceso al panel de administracion"
              >
                AMG
              </Link>
              <Link
                href="/carrito"
                className="group relative flex h-11 w-11 items-center justify-center rounded-lg border border-white/40 bg-white/75 text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:translate-y-0"
                aria-label={`Carrito con ${totalItems} productos`}
                onClick={() => setMobileOpen(false)}
              >
                <CartIcon3D className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/40 bg-white/75 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md lg:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5 text-black" />
                ) : (
                  <Menu className="h-5 w-5 text-black" />
                )}
              </button>
            </div>
          </nav>

          <div
            className={cn(
              "absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-lg border border-white/40 bg-white/85 shadow-xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 lg:hidden",
              mobileOpen
                ? "max-h-96 translate-y-0 opacity-100"
                : "pointer-events-none max-h-0 -translate-y-1 opacity-0"
            )}
          >
            <nav className="flex flex-col px-4 py-4" aria-label="Menu movil">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative rounded-md px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={getWhatsAppUrl(
                  "Hola, me gustaria conocer mas sobre sus productos y servicios."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90"
                onClick={() => setMobileOpen(false)}
              >
                Solicitar Consulta
              </a>
              <Link
                href="/admin/productos"
                className="mt-2 rounded-md border border-black/10 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-black transition-colors hover:bg-white hover:text-primary"
                onClick={() => setMobileOpen(false)}
              >
                AMG
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
