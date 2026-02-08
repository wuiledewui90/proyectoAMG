import React from "react"
import type { Metadata } from "next"
import { Wrench, Droplets, Gauge, Settings, MessageCircle } from "lucide-react"
import { services } from "@/lib/data"

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Reparacion, limpieza e instalacion de radiadores y sistemas de enfriamiento automotor. Servicio profesional con garantia.",
}

const iconMap: Record<string, React.ElementType> = {
  Wrench,
  Droplets,
  Gauge,
  Settings,
}

export default function ServiciosPage() {
  return (
    <>
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <h1 className="text-3xl font-bold text-secondary-foreground md:text-4xl">
            Nuestros Servicios
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-secondary-foreground/70">
            Ofrecemos soluciones integrales para el sistema de refrigeracion de
            tu vehiculo. Trabajo profesional con garantia en todos nuestros
            servicios.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || Wrench
            return (
              <article
                key={service.id}
                className="rounded-lg border border-border bg-card p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-foreground">
                  {service.title}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <a
                  href={`https://wa.me/5491100000000?text=Hola, me interesa el servicio de ${service.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
              </article>
            )
          })}
        </div>
      </section>

      <section className="bg-muted">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center lg:px-8">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            {"Necesitas un servicio personalizado?"}
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Cada vehiculo es diferente. Contactanos y te damos un presupuesto a
            medida sin compromiso.
          </p>
          <a
            href="https://wa.me/5491100000000"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Pedir Presupuesto
          </a>
        </div>
      </section>
    </>
  )
}
