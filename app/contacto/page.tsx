import type { Metadata } from "next"
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contactá a Radiadores AMG en La Rioja para consultar por radiadores, repuestos y servicios de refrigeración automotor.",
}

const contactItems = [
  { icon: Phone, title: "Teléfono / WhatsApp", value: "380 455-5277", href: "https://wa.me/5493804555277" },
  { icon: Mail, title: "Correo", value: "info@radiadoresamg.com.ar", href: "mailto:info@radiadoresamg.com.ar" },
  { icon: MapPin, title: "Taller", value: "Cerro de la Cruz 810, La Rioja Capital" },
  { icon: Clock, title: "Atención", value: "Lunes a viernes · 6:00 a 14:00" },
]

export default function ContactoPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div className="technical-grid absolute inset-0 opacity-35" />
        <div className="absolute inset-y-0 right-0 w-2/5 bg-[linear-gradient(135deg,transparent_20%,hsl(var(--primary)/.16))]" />
        <div className="relative mx-auto max-w-[90rem] px-5 pb-20 pt-36 sm:px-8 lg:px-12 lg:pb-28">
          <Reveal>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-primary">Contacto</p>
            <h1 className="font-display max-w-5xl text-[clamp(1.8rem,4.2vw,3.9rem)] font-black uppercase leading-[0.9] tracking-[-0.045em]">
              Hablemos de tu vehículo.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-secondary-foreground/65 sm:text-lg">
              Contanos el modelo, el problema o el repuesto que buscás. Nuestro equipo te ayuda a encontrar una solución clara y precisa.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-background py-20 lg:py-28">
        <div className="mx-auto grid max-w-[90rem] gap-8 px-5 sm:px-8 lg:grid-cols-12 lg:px-12">
          <Reveal className="border border-border bg-card p-6 sm:p-10 lg:col-span-7">
            <ContactForm />
          </Reveal>

          <Reveal className="metal-surface relative overflow-hidden p-7 text-white sm:p-10 lg:col-span-5" delay={140}>
            <div className="absolute right-0 top-0 h-1 w-28 bg-primary" />
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Datos directos</p>
            <h2 className="font-display mt-4 text-3xl font-black uppercase tracking-[-0.025em] sm:text-4xl">Estamos para ayudarte.</h2>

            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {contactItems.map((item) => (
                <div key={item.title} className="flex gap-4 py-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/15 bg-white/[0.04]">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/45">{item.title}</p>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-white transition-colors hover:text-primary">
                        {item.value}<ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <a href="https://wa.me/5493804555277" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-10 items-center gap-2 border border-primary bg-primary px-4 text-xs font-black uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-white hover:text-secondary">
              Escribir por WhatsApp <ArrowUpRight className="h-4 w-4" />
            </a>
          </Reveal>
        </div>
      </section>
    </>
  )
}
