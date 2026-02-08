import Link from "next/link"
import { Phone, Mail, MapPin } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <span className="text-base font-bold text-primary-foreground">R</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight">RADIADORES</span>
                <span className="text-[10px] font-semibold tracking-widest text-primary">
                  AMG
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-secondary-foreground/70">
              Especialistas en radiadores y sistemas de enfriamiento automotor.
              Calidad y confianza desde hace mas de 20 anos.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Navegacion
            </h3>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/catalogo", label: "Catalogo" },
                { href: "/servicios", label: "Servicios" },
                { href: "/sobre-nosotros", label: "Sobre Nosotros" },
                { href: "/contacto", label: "Contacto" },
              ].map((link) => (
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

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Contacto
            </h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2 text-sm text-secondary-foreground/70">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <span>+54 11 0000-0000</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-secondary-foreground/70">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <span>info@radiadoresamg.com.ar</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-secondary-foreground/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Buenos Aires, Argentina</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Horarios
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-secondary-foreground/70">
              <li>Lunes a Viernes: 8:00 - 18:00</li>
              <li>Sabados: 8:00 - 13:00</li>
              <li>Domingos: Cerrado</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-secondary-foreground/10 pt-6 text-center text-sm text-secondary-foreground/50">
          {new Date().getFullYear()} RADIADORES AMG. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  )
}
