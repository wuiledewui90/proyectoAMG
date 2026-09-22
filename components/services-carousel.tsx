"use client"

import Link from "next/link"
import {
  ArrowRight,
  Droplets,
  Gauge,
  Settings,
  ShoppingCart,
  Wrench,
} from "lucide-react"
import type { Service } from "@/lib/data"
import { Reveal } from "@/components/reveal"

const serviceIconMap: Record<string, React.ElementType> = {
  Wrench,
  Droplets,
  Gauge,
  Settings,
  ShoppingCart,
}

const extraService: Service = {
  id: "5",
  slug: "venta-radiadores",
  title: "Venta de Radiadores",
  description:
    "Radiadores nuevos para autos, camionetas y maquinaria. Identificamos el modelo correcto para cada aplicación.",
  icon: "ShoppingCart",
}

export function ServicesCarousel({ services }: { services: Service[] }) {
  const homeServices = [...services, extraService]

  return (
    <section id="servicios" className="relative overflow-hidden bg-[#0a0c0f] py-24 text-white sm:py-28 lg:py-32">
      <div className="technical-grid absolute inset-0 opacity-20" aria-hidden="true" />
      <div className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[90rem] gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 xl:px-16">
        <Reveal className="lg:col-span-4 lg:pr-8">
          <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
            Servicios
          </p>
          <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            Ingeniería térmica para cada vehículo.
          </h2>
          <p className="mt-7 max-w-md text-base leading-relaxed text-white/62">
            Diagnóstico, reparación e instalación con procesos claros. Resolvemos
            la causa del problema para que el motor vuelva a trabajar a su
            temperatura correcta.
          </p>
          <Link
            href="/servicios"
            className="group mt-9 inline-flex min-h-12 items-center gap-3 border-b-2 border-primary text-sm font-extrabold uppercase tracking-[0.1em] text-white transition hover:text-primary"
          >
            Conocer el taller
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <div className="grid gap-px bg-white/12 sm:grid-cols-2 lg:col-span-8">
          {homeServices.map((service, index) => {
            const Icon = serviceIconMap[service.icon] || Wrench
            const isLast = index === homeServices.length - 1

            return (
              <Reveal
                key={service.id}
                as="article"
                delay={Math.min(index * 90, 360)}
                className={`group metal-surface relative min-h-[280px] overflow-hidden p-7 transition-colors duration-500 hover:bg-[#15191e] sm:p-8 ${
                  isLast ? "sm:col-span-2 sm:min-h-[240px]" : ""
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100" />
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center border border-white/14 bg-black/20 text-primary transition duration-500 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-3xl font-black text-white/12 transition-colors group-hover:text-primary/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-10 max-w-sm font-display text-2xl font-black uppercase leading-tight tracking-[-0.02em] text-white">
                  {service.title}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 transition-colors group-hover:text-white/72">
                  {service.description}
                </p>
                <Link
                  href="/servicios"
                  aria-label={`Más información sobre ${service.title}`}
                  className="absolute bottom-7 right-7 flex h-10 w-10 translate-x-2 items-center justify-center border border-white/14 text-white/60 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:border-primary group-hover:text-primary group-hover:opacity-100"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
