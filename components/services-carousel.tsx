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
import { cn } from "@/lib/utils"

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
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)

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
    }, 1900)

    return () => {
      clearInterval(interval)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  return (
    <section id="servicios" className="relative z-20 flex min-h-svh items-center overflow-hidden bg-[#050505] py-10 sm:py-12 lg:py-14">
      <div
        className="pointer-events-none absolute left-1/2 top-12 h-40 w-[min(920px,88vw)] -translate-x-1/2 rounded-full bg-primary/14 blur-3xl sm:top-14 lg:top-16 lg:h-48"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-1.5 text-left">
          <h2 className="text-xl font-bold text-white">Nuestros Servicios</h2>
        </div>

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory touch-auto select-none gap-7 overflow-x-auto overflow-y-visible overscroll-x-contain px-1 pb-7 pt-1 [perspective:1200px] [scrollbar-width:none] active:cursor-grabbing md:cursor-grab lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-2 lg:cursor-default xl:gap-8 [&::-webkit-scrollbar]:hidden"
          aria-label="Servicios"
          tabIndex={0}
          onFocus={pauseAutoScroll}
          onBlur={() => resumeAutoScroll()}
          onMouseEnter={pauseAutoScroll}
          onMouseLeave={() => resumeAutoScroll()}
          onPointerDown={pauseAutoScroll}
          onPointerUp={() => resumeAutoScroll(4200)}
          onPointerCancel={() => resumeAutoScroll(4200)}
          onTouchStart={pauseAutoScroll}
          onTouchEnd={() => resumeAutoScroll(4200)}
          onWheel={() => {
            pauseAutoScroll()
            resumeAutoScroll(1800)
          }}
        >
          {homeServices.map((service) => {
            const Icon = serviceIconMap[service.icon] || Wrench
            const isActive = activeServiceId === service.id

            return (
              <article
                key={service.id}
                onMouseEnter={() => setActiveServiceId(service.id)}
                onMouseLeave={() => setActiveServiceId(null)}
                className={cn(
                  "group relative flex min-h-[245px] w-[78vw] min-w-[260px] max-w-[280px] shrink-0 snap-center origin-center transform-gpu flex-col overflow-hidden rounded-[1.35rem] border border-primary/20 bg-[#080b0b] text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_16px_40px_rgba(0,0,0,0.34),0_10px_30px_rgba(0,127,128,0.1)] transition-all duration-500 ease-out [transform-style:preserve-3d] hover:z-30 hover:-translate-y-4 hover:scale-[1.08] hover:border-primary/50 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_32px_80px_rgba(0,0,0,0.5),0_18px_48px_rgba(0,127,128,0.22)] md:w-[280px] lg:w-full lg:min-w-0 lg:justify-self-center xl:hover:scale-[1.1]",
                  isActive &&
                    "z-30 -translate-y-4 scale-[1.08] border-primary/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_32px_80px_rgba(0,0,0,0.5),0_18px_48px_rgba(0,127,128,0.22)] xl:scale-[1.1]"
                )}
              >
                <span
                  className={cn(
                    "absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-2xl transition-opacity duration-500 group-hover:opacity-90",
                    isActive ? "opacity-90" : "opacity-60"
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "absolute -bottom-14 left-1/2 h-28 w-36 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
                    isActive ? "opacity-100" : "opacity-70"
                  )}
                  aria-hidden="true"
                />
                <div
                  className={cn(
                    "absolute inset-0 bg-[radial-gradient(circle_at_78%_10%,rgba(0,127,128,0.28),rgba(0,127,128,0.08)_34%,rgba(255,255,255,0.025)_48%,rgba(0,0,0,0.12)_100%)] transition-all duration-500 group-hover:scale-105 group-hover:brightness-50",
                    isActive && "scale-105 brightness-50"
                  )}
                  aria-hidden="true"
                />
                <div
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center px-4 pb-5 pt-6 transition-all duration-500 group-hover:opacity-20",
                    isActive ? "opacity-20" : "opacity-100"
                  )}
                >
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/35 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_40px_rgba(0,127,128,0.16)]">
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full border-t border-primary border-r-primary/60 border-b-transparent border-l-transparent transition-transform duration-500 group-hover:rotate-45",
                        isActive && "rotate-45"
                      )}
                    />
                    <Icon className="relative h-9 w-9 text-primary drop-shadow-[0_0_18px_rgba(0,127,128,0.42)]" />
                  </div>
                  <span className="mt-6 h-0.5 w-9 rounded-full bg-primary" />
                  <h3 className="mt-3 max-w-[220px] text-[13px] font-black uppercase leading-snug tracking-normal text-white">
                    {service.title}
                  </h3>
                </div>
                <div
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center border border-white/10 bg-black/60 px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100",
                    isActive
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0"
                  )}
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-primary/45 bg-primary/12">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="max-w-[220px] text-[13px] font-black uppercase leading-snug tracking-normal text-white">
                    {service.title}
                  </h3>
                  <span className="mt-2 h-0.5 w-10 rounded-full bg-primary" />
                  <p className="mt-3 max-w-[220px] text-[10.5px] leading-relaxed text-white/85">
                    {service.description}
                  </p>
                  <Link
                    href="/servicios"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary px-3 py-1.5 text-[11px] font-bold text-black shadow-[0_10px_24px_rgba(0,127,128,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:text-black"
                  >
                    Ver mas
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
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
