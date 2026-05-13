import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react"

const navLinks = [
  { href: "/catalogo", label: "Catalogo" },
  { href: "/servicios", label: "Servicios" },
  { href: "/sobre-nosotros", label: "Sobre Nosotros" },
  { href: "/contacto", label: "Contacto" },
]

const socialLinks = [
  {
    href: "https://www.facebook.com/share/1Dx9Yeb5ti/",
    label: "Facebook de Radiadores AMG",
    icon: Facebook,
  },
  {
    href: "https://www.instagram.com/radiadoresamg/?igsh=YXFkdXM4ZDI3c2g5",
    label: "Instagram de Radiadores AMG",
    icon: Instagram,
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <span className="text-base font-bold text-primary-foreground">
                  R
                </span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight">
                  RADIADORES
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-primary">
                  AMG
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-secondary-foreground/70">
              Especialistas en radiadores y sistemas de enfriamiento automotor.
              Calidad y confianza desde hace mas de 3 decadas.
            </p>

            <div className="mt-5 flex justify-center gap-3 sm:justify-start">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-secondary-foreground/20 bg-secondary-foreground/5 text-secondary-foreground/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-lg"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Navegacion
            </h3>
            <ul className="flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-foreground/70 transition-colors hover:text-secondary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Contacto
            </h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start justify-center gap-2 text-sm text-secondary-foreground/70 sm:justify-start">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <span>5493804524590</span>
              </li>
              <li className="flex items-start justify-center gap-2 text-sm text-secondary-foreground/70 sm:justify-start">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <span>info@radiadoresamg.com.ar</span>
              </li>
              <li className="flex items-start justify-center gap-2 text-sm text-secondary-foreground/70 sm:justify-start">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Cerro de la Cruz, 810 La Rioja Capital</span>
              </li>
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Horarios
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-secondary-foreground/70">
              <li>Lunes a Viernes: 6:00 - 14:00</li>
              <li>Sabados: Cerrado</li>
              <li>Domingos: Cerrado</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-secondary-foreground/10 pt-6 text-center text-xs text-secondary-foreground/50 sm:text-sm">
          {new Date().getFullYear()} {"\u00A9"} RADIADORES AMG. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  )
}
