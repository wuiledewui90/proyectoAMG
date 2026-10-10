"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, MapPin } from "lucide-react"
import { CartIcon3D } from "@/components/cart-icon"
import { MobileSiteMenu } from "@/components/mobile-site-menu"
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
        >
          <Image
            src="/images/logo-navbar-amg.webp"
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
          >
            <CartIcon3D className="h-9 w-9 transition-transform duration-200 hover:scale-105" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center bg-primary px-1 text-[10px] font-black text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <MobileSiteMenu />
        </div>
      </nav>
    </header>
  )
}
