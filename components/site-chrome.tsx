"use client"

import { usePathname } from "next/navigation"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { getWhatsAppUrl } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import { WhatsAppIcon } from "@/components/whatsapp-icon"

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <>
      <SiteHeader />
      <main
        className={cn("min-h-screen", pathname !== "/" && "site-main-offset")}
      >
        <div
          key={pathname}
          className={cn(pathname !== "/" && "site-route-enter")}
        >
          {children}
        </div>
      </main>
      <SiteFooter />

      <div className="group fixed bottom-6 right-6 z-50">
        <span className="absolute bottom-full right-0 mb-2 hidden items-center whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg group-hover:flex">
          ¿Necesitás ayuda? ¡Escribinos!
          <span className="absolute -bottom-1 right-5 h-2 w-2 rotate-45 bg-gray-900" />
        </span>
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-40" />
        <a
          href={getWhatsAppUrl("Hola, necesito ayuda.")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-xl transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <WhatsAppIcon className="h-8 w-8 text-white" />
        </a>
      </div>
    </>
  )
}
