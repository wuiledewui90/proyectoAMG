"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRight,
  Droplets,
  Gauge,
  Settings,
  ShoppingCart,
  Wrench,
} from "lucide-react"
import type { Service } from "@/lib/data"

const serviceIconMap: Record<string, React.ElementType> = {
  Wrench,
  Droplets,
  Gauge,
  Settings,
  ShoppingCart,
}

const extraService: Service = {
  id: "venta-radiadores",
  slug: "venta-radiadores",
  title: "Venta de Radiadores",
  description:
    "Venta de radiadores nuevos para autos, camionetas y maquinaria. Te asesoramos para encontrar el modelo correcto para tu vehiculo.",
  icon: "ShoppingCart",
}

export function ServicesCarousel({ services }: { services: Service[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)

  const homeServices = useMemo(() => [...services, extraService], [services])

  function pauseAutoScroll() {
    pausedRef.current = true
    setPaused(true)

    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
  }

  function resumeAutoScroll(delay = 1400) {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
    }

    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false
      setPaused(false)
    }, delay)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const scroller = scrollerRef.current
      if (!scroller || pausedRef.current) return
      if (window.matchMedia("(min-width: 1024px)").matches) return

      const maxScroll = scroller.scrollWidth - scroller.clientWidth
      if (maxScroll <= 0) return

      const nearEnd = scroller.scrollLeft >= maxScroll - 12
      if (nearEnd) {
        scroller.scrollTo({ left: 0, behavior: "smooth" })
        return
      }

      scroller.scrollBy({
        left: Math.min(scroller.clientWidth * 0.78, 340),
        behavior: "smooth",
      })
    }, 2600)

    return () => {
      clearInterval(interval)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  return (
    <section className="border-y border-white/10 bg-[#050505]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-1.5 text-left">
          <h2 className="text-xl font-bold text-white">Nuestros Servicios</h2>
        </div>

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory touch-pan-x select-none gap-7 overflow-x-auto overflow-y-visible px-1 pb-7 pt-2 [perspective:1200px] [scrollbar-width:none] active:cursor-grabbing md:cursor-grab lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-2 lg:cursor-default xl:gap-8 [&::-webkit-scrollbar]:hidden"
          aria-label="Servicios"
          tabIndex={0}
          onFocus={pauseAutoScroll}
          onBlur={() => resumeAutoScroll()}
          onMouseEnter={pauseAutoScroll}
          onMouseLeave={() => resumeAutoScroll()}
          onPointerDown={pauseAutoScroll}
          onPointerUp={() => resumeAutoScroll()}
          onPointerCancel={() => resumeAutoScroll()}
          onTouchStart={pauseAutoScroll}
          onTouchEnd={() => resumeAutoScroll()}
          onWheel={() => {
            pauseAutoScroll()
            resumeAutoScroll(1800)
          }}
        >
          {homeServices.map((service) => {
            const Icon = serviceIconMap[service.icon] || Wrench

            return (
              <article
                key={service.id}
                className="group relative flex min-h-[225px] w-[78vw] min-w-[260px] max-w-[280px] shrink-0 snap-center origin-center transform-gpu flex-col items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.075),rgba(255,255,255,0.018)_44%,rgba(255,255,255,0.03)_100%)] px-3.5 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out [transform-style:preserve-3d] md:w-[280px] lg:w-full lg:min-w-0 lg:justify-self-center lg:hover:z-30 lg:hover:-translate-y-4 lg:hover:scale-[1.14] lg:hover:border-primary/45 lg:hover:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.11),rgba(255,255,255,0.03)_44%,rgba(255,255,255,0.045)_100%)] lg:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_32px_80px_rgba(0,0,0,0.42),0_18px_48px_rgba(220,38,38,0.16)] xl:hover:scale-[1.18]"
              >
                <span
                  className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/6 blur-2xl transition-opacity duration-300 group-hover:opacity-95"
                  aria-hidden="true"
                />
                <span
                  className="absolute -bottom-12 left-1/2 h-24 w-32 -translate-x-1/2 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-transform duration-300 group-hover:scale-110">
                  <div className="absolute inset-0 rounded-full border-t border-primary border-r-primary/60 border-b-transparent border-l-transparent transition-transform duration-500 group-hover:rotate-45" />
                  <Icon className="relative h-5 w-5 text-primary" />
                </div>
                <h3 className="relative mt-3.5 text-[12px] font-black uppercase tracking-normal text-white transition-colors duration-300 group-hover:text-white">
                  {service.title}
                </h3>
                <span className="relative mt-2 h-0.5 w-7 rounded-full bg-primary transition-all duration-300 group-hover:w-10" />
                <p className="relative mt-2.5 max-w-[210px] text-[10px] leading-relaxed text-white/85 transition-all duration-300 group-hover:text-white group-hover:[text-shadow:0_1px_12px_rgba(255,255,255,0.16)]">
                  {service.description}
                </p>
              </article>
            )
          })}
        </div>

        <div className="mt-1 flex items-center justify-center gap-3 text-center lg:mt-6">
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors lg:hidden ${
              paused ? "bg-primary" : "bg-white/35"
            }`}
            aria-hidden="true"
          />
          <Link
            href="/servicios"
            className="group inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
          >
            Ver Todos los Servicios
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
