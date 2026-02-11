import Link from "next/link"
import { Phone, Mail, MapPin } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
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
              Calidad y confianza desde hace mas de 3 decadas.
            </p>
          </div>

          <div className="text-center sm:text-left">
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
          {new Date().getFullYear()} © RADIADORES AMG. Todos los derechos reservados..
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 pb-6 pt-2 sm:gap-4 lg:justify-end lg:px-8">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.facebook.com/share/1Dx9Yeb5ti/"
          aria-label="Facebook"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:h-12 sm:w-12"
        >
          <svg
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            className="h-9 w-9 sm:h-10 sm:w-10"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="30" fill="#1877F2" />
            <path
              d="M35.3 20H39V14.3h-5c-5.6 0-9.3 3.6-9.3 9.4v4.3H20v6.1h4.7V50h6.2V34.1h4.9l.7-6.1h-5.6v-3.7c0-1.8.5-4.3 3.4-4.3Z"
              fill="#FFFFFF"
            />
          </svg>
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.instagram.com/radiadoresamg/?igsh=YXFkdXM4ZDI3c2g5"
          aria-label="Instagram"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:h-12 sm:w-12"
        >
          <svg
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            className="h-9 w-9 sm:h-10 sm:w-10"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="igGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#F58529" />
                <stop offset="25%" stopColor="#FEDA77" />
                <stop offset="50%" stopColor="#DD2A7B" />
                <stop offset="75%" stopColor="#8134AF" />
                <stop offset="100%" stopColor="#515BD4" />
              </linearGradient>
            </defs>
            <g fill="none" fillRule="evenodd">
              <circle cx="32" cy="32" r="30" fill="url(#igGradient)" />
              <rect
                x="20"
                y="20"
                width="24"
                height="24"
                rx="7"
                ry="7"
                stroke="#FFFFFF"
                strokeWidth="2.6"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="6"
                stroke="#FFFFFF"
                strokeWidth="2.6"
                fill="none"
              />
              <circle cx="39" cy="25" r="1.8" fill="#FFFFFF" />
            </g>
          </svg>
        </a>
      </div>
    </footer>
  )
}

