"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ArrowUpRight, MapPin, Menu, X } from "lucide-react"
import { CartIcon3D } from "@/components/cart-icon"
import { useCart } from "@/lib/cart-context"
import { cn } from "@/lib/utils"
import { getWhatsAppUrl } from "@/lib/whatsapp"

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/servicios", label: "Servicios" },
  { href: "/sobre-nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
]

const directionsUrl =
  "https://www.google.com/maps/place/RADIADORES+AMG/@-29.4002907,-66.8367486,17z/data=!3m1!4b1!4m6!3m5!1s0x9427da42c30e0433:0x576025b3cc0c6a5b!8m2!3d-29.4002907!4d-66.8341737!16s%2Fg%2F11h9z11xml?entry=ttu"

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { totalItems } = useCart()

  return (
    <header id="site-header" className="fixed inset-x-0 top-0 z-50">
      <nav
        className="flex h-[70px] w-full items-center justify-between border-y border-white/[0.12] bg-[#07152b]/58 px-4 shadow-[0_18px_55px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#07152b]/50 sm:px-6 lg:px-10 xl:px-14"
        aria-label="Principal"
      >
        <Link
          href="/"
          className="group flex shrink-0 items-center"
          aria-label="Radiadores AMG, inicio"
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/images/logo-navbar-amg.png"
            alt="Radiadores AMG"
            width={2172}
            height={724}
            priority
            sizes="(max-width: 640px) 122px, 150px"
            className="h-9 w-auto object-contain drop-shadow-[0_2px_10px_rgba(190,198,204,.12)] sm:h-11"
          />
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "relative py-6 text-xs font-bold uppercase tracking-[0.13em] text-white transition-colors hover:text-white",
                    active && "text-white"
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-[17px] h-0.5 origin-left bg-[linear-gradient(90deg,#b51625_0_42%,#c7cbce_42%_58%,#0b2a69_58%_100%)] transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden min-h-9 items-center gap-2 rounded-xl border border-white/25 bg-white/[0.06] px-3 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-white transition hover:border-white/60 hover:bg-white/10 lg:inline-flex"
          >
            <MapPin className="h-3.5 w-3.5 text-primary transition-transform group-hover:-translate-y-0.5" />
            Cómo llegar
          </a>
          <a
            href={getWhatsAppUrl("Hola, necesito asesoramiento para mi vehiculo.")}
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden min-h-9 items-center gap-2 rounded-xl border border-primary bg-primary px-3 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-transparent lg:inline-flex"
          >
            Pedir presupuesto
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
          <Link
            href="/carrito"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-white transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f68b8]"
            aria-label={`Carrito con ${totalItems} productos`}
            onClick={() => setMobileOpen(false)}
          >
            <CartIcon3D className="h-9 w-9 transition-transform duration-200 hover:scale-105" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center bg-primary px-1 text-[10px] font-black text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center border border-white/16 bg-white/6 text-white transition hover:border-[#3f68b8] hover:text-[#8dace7] lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "relative mx-3 mt-2 w-auto overflow-hidden rounded-2xl border border-white/25 bg-black shadow-[0_24px_60px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.16)] transition-all duration-300 lg:hidden",
          mobileOpen
            ? "max-h-[32rem] translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.14),transparent_42%,rgba(255,255,255,.04))]"
          aria-hidden="true"
        />
        <div className="relative z-10 grid p-3">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between border-b border-white/10 px-3 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <span>{link.label}</span>
              <span className="text-xs text-primary">0{index + 1}</span>
            </Link>
          ))}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.08] px-3 text-xs font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-white/15"
            onClick={() => setMobileOpen(false)}
          >
            <MapPin className="h-4 w-4 text-primary" />
            Cómo llegar
          </a>
          <a
            href={getWhatsAppUrl("Hola, necesito asesoramiento para mi vehiculo.")}
            target="_blank"
            rel="noopener noreferrer"
              className="mt-3 flex min-h-10 items-center justify-center rounded-xl bg-primary px-3 text-xs font-extrabold uppercase tracking-[0.1em] text-white"
            onClick={() => setMobileOpen(false)}
          >
            Pedir presupuesto
          </a>
        </div>
      </div>
    </header>
  )
}
