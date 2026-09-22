import React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  Gauge,
  MessageCircle,
  Settings,
  Wrench,
} from "lucide-react"
import { Reveal } from "@/components/reveal"
import { services } from "@/lib/data"
import { getWhatsAppUrl } from "@/lib/whatsapp"

export const metadata: Metadata = {
  title: "Servicios de radiadores",
  description:
    "Diagnóstico, reparación, limpieza e instalación de radiadores y sistemas de enfriamiento automotor en La Rioja.",
}

const iconMap: Record<string, React.ElementType> = {
  Wrench,
  Droplets,
  Gauge,
  Settings,
}

const process = [
  {
    number: "01",
    title: "Diagnóstico",
    text: "Revisamos pérdidas, presión, circulación y estado general del sistema.",
  },
  {
    number: "02",
    title: "Solución",
    text: "Definimos la reparación o el repuesto adecuado antes de intervenir.",
  },
  {
    number: "03",
    title: "Verificación",
    text: "Probamos presión, temperatura y funcionamiento antes de entregar.",
  },
]

export default function ServiciosPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#090b0e] pb-20 pt-32 text-white sm:pb-24 sm:pt-40 lg:pb-28">
        <div className="technical-grid absolute inset-0 opacity-25" aria-hidden="true" />
        <div
          className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-primary/12 blur-[110px]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-8">
              <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
                Taller especializado
              </p>
              <h1 className="font-display max-w-5xl text-[clamp(1.8rem,4.2vw,4.2rem)] font-black uppercase leading-[0.9] tracking-[-0.055em]">
                El sistema térmico, resuelto de punta a punta.
              </h1>
            </Reveal>
            <Reveal delay={160} className="border-l border-white/18 pl-6 lg:col-span-4 lg:pl-8">
              <p className="text-base leading-relaxed text-white/62 sm:text-lg">
                Más de tres décadas reparando radiadores y resolviendo problemas
                de temperatura en autos, camionetas y maquinaria.
              </p>
              <a
                href={getWhatsAppUrl("Hola, necesito consultar por un servicio para mi vehiculo.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-7 inline-flex min-h-10 items-center gap-2 bg-primary px-4 text-xs font-extrabold uppercase tracking-[0.09em] text-white transition hover:bg-white hover:text-black"
              >
                Consultar ahora
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-[90rem] sm:grid-cols-3">
          {process.map((step, index) => (
            <Reveal
              key={step.number}
              delay={index * 100}
              className="relative border-b border-border px-5 py-9 last:border-b-0 sm:border-b-0 sm:border-r sm:px-8 sm:last:border-r-0 lg:px-12"
            >
              <span className="font-display text-4xl font-black text-primary/22">{step.number}</span>
              <h2 className="mt-2 font-display text-xl font-black uppercase tracking-[-0.02em] text-foreground">
                {step.title}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-background py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <Reveal className="mb-14 flex flex-col justify-between gap-6 border-b border-foreground/15 pb-8 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
                Capacidades del taller
              </p>
              <h2 className="font-display max-w-3xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
                Servicio técnico sin improvisaciones.
              </h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Cada trabajo se diagnostica, se explica y se verifica. Elegimos la
              solución correcta según el vehículo y el estado real del sistema.
            </p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon] || Wrench
              return (
                <Reveal
                  key={service.id}
                  as="article"
                  delay={(index % 2) * 110}
                  className="group relative overflow-hidden border border-foreground/12 bg-white p-7 transition duration-500 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_24px_60px_rgba(9,12,15,.1)] sm:p-9"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex h-14 w-14 items-center justify-center bg-[#0c0f12] p-3.5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-display text-5xl font-black text-foreground/7">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-9 max-w-md font-display text-2xl font-black uppercase leading-tight tracking-[-0.025em] text-foreground sm:text-3xl">
                    {service.title}
                  </h3>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  <div className="mt-7 flex items-center gap-2 text-sm font-bold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Diagnóstico y garantía incluidos
                  </div>
                  <a
                    href={getWhatsAppUrl(`Hola, me interesa el servicio de ${service.title}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 inline-flex min-h-10 items-center gap-2 border-b-2 border-primary text-xs font-extrabold uppercase tracking-[0.1em] text-foreground transition hover:text-primary"
                  >
                    Consultar este servicio
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,.18),transparent_55%)]" aria-hidden="true" />
        <Reveal className="relative mx-auto flex max-w-[90rem] flex-col justify-between gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-center lg:px-12 xl:px-16">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-white/70">
              ¿Tu vehículo levanta temperatura?
            </p>
            <h2 className="font-display mt-3 max-w-3xl text-3xl font-black uppercase leading-tight tracking-[-0.035em] sm:text-5xl">
              No esperes a que el motor se detenga.
            </h2>
          </div>
          <Link
            href="/contacto"
            className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-white bg-white px-5 text-xs font-extrabold uppercase tracking-[0.1em] text-black transition hover:bg-transparent hover:text-white"
          >
            Pedir diagnóstico
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </>
  )
}
