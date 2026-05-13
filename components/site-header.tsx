"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { CartIcon3D } from "@/components/cart-icon"
import { useCart } from "@/lib/cart-context"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catalogo" },
  { href: "/servicios", label: "Servicios" },
  { href: "/sobre-nosotros", label: "Sobre Nosotros" },
  { href: "/contacto", label: "Contacto" },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { totalItems } = useCart()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Inicio">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <span className="text-lg font-bold text-primary-foreground">R</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-foreground">
              RADIADORES
            </span>
            <span className="text-xs font-semibold tracking-widest text-primary">
              AMG
            </span>
          </div>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-6 lg:flex"
          aria-label="Principal"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/productos"
            className="hidden items-center rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:text-foreground hover:shadow-md md:inline-flex"
            aria-label="Acceso al panel de administracion"
          >
            AMG
          </Link>
          <Link
            href="/carrito"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-lg active:translate-y-0"
            aria-label={`Carrito con ${totalItems} productos`}
          >
            <CartIcon3D className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow-sm group-hover:bg-card group-hover:text-primary">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:shadow-md lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-border transition-all duration-300 lg:hidden",
          mobileOpen ? "max-h-80" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col px-4 py-4" aria-label="Menu movil">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin/productos"
            className="mt-2 rounded-md border border-border px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            AMG
          </Link>
        </nav>
      </div>
    </header>
  )
}
