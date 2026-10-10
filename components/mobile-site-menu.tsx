"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import {
  Building2,
  ChevronRight,
  Facebook,
  Home,
  Instagram,
  Mail,
  PackageSearch,
  Phone,
  Wrench,
  X,
} from "lucide-react"
import { useEffect, useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { getWhatsAppUrl } from "@/lib/whatsapp"
import { WhatsAppIcon } from "@/components/whatsapp-icon"
import styles from "./mobile-site-menu.module.css"

const mobileNavLinks = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/catalogo", label: "Catálogo", icon: PackageSearch },
  { href: "/servicios", label: "Servicios", icon: Wrench },
  { href: "/sobre-nosotros", label: "Nosotros", icon: Building2 },
  { href: "/contacto", label: "Contacto", icon: Mail },
]

const socialLinks = [
  {
    href: "https://www.instagram.com/radiadoresamg/?igsh=YXFkdXM4ZDI3c2g5",
    label: "Instagram de Radiadores AMG",
    icon: Instagram,
  },
  {
    href: "https://www.facebook.com/share/1Dx9Yeb5ti/",
    label: "Facebook de Radiadores AMG",
    icon: Facebook,
  },
]

function isActiveRoute(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

export function MobileSiteMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)")
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false)
    }

    desktopQuery.addEventListener("change", closeOnDesktop)
    return () => desktopQuery.removeEventListener("change", closeOnDesktop)
  }, [])

  const closeMenu = () => setOpen(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(styles.trigger, open && styles.triggerOpen)}
          aria-label={open ? "Cerrar menú principal" : "Abrir menú principal"}
          aria-expanded={open}
        >
          <span className={cn(styles.triggerLine, styles.triggerLineTop)} />
          <span className={cn(styles.triggerLine, styles.triggerLineMiddle)} />
          <span className={cn(styles.triggerLine, styles.triggerLineBottom)} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.panel}>
          <div className={styles.ambientLight} aria-hidden="true" />
          <Dialog.Title className="sr-only">Menú principal</Dialog.Title>
          <Dialog.Description className="sr-only">
            Navegación, contacto y redes sociales de Radiadores AMG.
          </Dialog.Description>

          <header className={styles.panelHeader}>
            <Link
              href="/"
              className={styles.panelLogo}
              aria-label="Radiadores AMG, inicio"
              onClick={closeMenu}
            >
              <Image
                src="/images/logo-navbar-amg.webp"
                alt="Radiadores AMG"
                width={2172}
                height={724}
                sizes="132px"
                className="h-auto w-[132px] object-contain"
              />
            </Link>
            <Dialog.Close asChild>
              <button type="button" className={styles.closeButton} aria-label="Cerrar menú principal">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </header>

          <div className={styles.scrollArea}>
            <div className={styles.sectionLabel}>Navegación</div>
            <nav aria-label="Navegación móvil">
              <ul className={styles.navList}>
                {mobileNavLinks.map((link, index) => {
                  const active = isActiveRoute(pathname, link.href)
                  const Icon = link.icon

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(styles.navItem, active && styles.navItemActive)}
                        style={{ animationDelay: `${90 + index * 48}ms` } as CSSProperties}
                        aria-current={active ? "page" : undefined}
                        onClick={closeMenu}
                      >
                        <span className={styles.navIcon} aria-hidden="true">
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className={styles.navLabel}>{link.label}</span>
                        <ChevronRight className={styles.navArrow} aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className={styles.contactBlock}>
              <div className={styles.sectionLabel}>Contacto directo</div>
              <div className={styles.contactLinks}>
                <a
                  href={getWhatsAppUrl("Hola, necesito asesoramiento para mi vehículo.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactLink}
                  onClick={closeMenu}
                >
                  <span className={cn(styles.contactIcon, styles.whatsAppIcon)} aria-hidden="true">
                    <WhatsAppIcon className="h-[20px] w-[20px]" />
                  </span>
                  <span>
                    <strong>Escribinos</strong>
                    <small>WhatsApp</small>
                  </span>
                  <ChevronRight className={styles.contactArrow} aria-hidden="true" />
                </a>
                <a href="tel:+5493804524590" className={styles.contactLink} onClick={closeMenu}>
                  <span className={cn(styles.contactIcon, styles.phoneIcon)} aria-hidden="true">
                    <Phone className="h-[18px] w-[18px]" />
                  </span>
                  <span>
                    <strong>Llamanos</strong>
                    <small>+54 9 380 452-4590</small>
                  </span>
                  <ChevronRight className={styles.contactArrow} aria-hidden="true" />
                </a>
              </div>

              <div className={styles.socialRow} aria-label="Redes sociales">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                      aria-label={social.label}
                      title={social.label}
                      onClick={closeMenu}
                    >
                      <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
