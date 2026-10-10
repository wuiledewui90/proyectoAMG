import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, LogIn, Mail, MapPin, Phone } from "lucide-react"

const navLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/servicios", label: "Servicios" },
  { href: "/sobre-nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
]

const socialLinks = [
  {
    href: "https://www.facebook.com/share/1Dx9Yeb5ti/",
    label: "Facebook de Radiadores AMG",
    icon: "/images/social/facebook.png",
  },
  {
    href: "https://www.instagram.com/radiadoresamg/?igsh=YXFkdXM4ZDI3c2g5",
    label: "Instagram de Radiadores AMG",
    icon: "/images/social/instagram.png",
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#07090b] text-white">
      <div className="mx-auto max-w-[90rem] px-5 pb-8 pt-14 sm:px-8 sm:pt-16 lg:px-12 xl:px-16">
        <div className="flex flex-col justify-between gap-10 border-b border-white/12 pb-12 lg:flex-row lg:items-end">
          <div>
            <Link href="/" className="inline-flex" aria-label="Radiadores AMG, inicio">
              <Image
                src="/images/logo-navbar-amg.webp"
                alt="Radiadores AMG"
                width={2172}
                height={724}
                sizes="(max-width: 640px) 180px, 210px"
                className="h-14 w-auto object-contain drop-shadow-[0_3px_14px_rgba(190,198,204,.14)] sm:h-16"
              />
            </Link>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">
              Especialistas térmicos
            </p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/55">
              Radiadores, repuestos y servicio técnico para mantener cada motor
              trabajando a la temperatura correcta.
            </p>
          </div>
          <a
            href="https://wa.me/5493804524590"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-10 w-fit items-center gap-2 border-b-2 border-primary text-xs font-extrabold uppercase tracking-[0.1em] transition hover:text-primary"
          >
            Comunicate con nosotros
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Navegación</h3>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/58 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Contacto</h3>
            <ul className="mt-5 space-y-4 text-sm text-white/58">
              <li className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 text-white/35" /><span>+54 9 380 452-4590</span></li>
              <li className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 text-white/35" /><span>info@radiadoresamg.com.ar</span></li>
              <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-white/35" /><span>Cerro de la Cruz 810, La Rioja</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Horarios</h3>
            <div className="mt-5 space-y-3 text-sm text-white/58">
              <div className="flex justify-between gap-5 border-b border-white/8 pb-3"><span>Lunes — Viernes</span><span className="text-white">06:00 — 14:00</span></div>
              <div className="flex justify-between gap-5"><span>Sábado — Domingo</span><span className="text-white/35">Cerrado</span></div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Seguinos</h3>
            <div className="mt-5 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="group flex h-14 w-14 items-center justify-center rounded-full transition duration-300 hover:-translate-y-1 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090b]"
                >
                  <Image
                    src={social.icon}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,.4)]"
                  />
                </a>
              ))}
            </div>
            <Link
              href="/admin/login"
              className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/48 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-[#07090b]"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Acceso interno
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/12 pt-6 text-xs text-white/35 sm:flex-row sm:items-center">
          <p>{new Date().getFullYear()} © Radiadores AMG. Todos los derechos reservados.</p>
          <p>Refrigeración automotor · La Rioja, Argentina</p>
        </div>
      </div>
    </footer>
  )
}
