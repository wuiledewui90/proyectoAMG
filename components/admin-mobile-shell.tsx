"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, Home, LogOut, Menu, MoreHorizontal, X } from "lucide-react"

import {
  AdminNavIcon,
  type AdminNavGroup,
  type AdminNavLink,
} from "@/components/admin-navigation"
import { cn } from "@/lib/utils"

const defaultBottomNav = ["/admin", "/admin/taller", "/admin/ventas", "/admin/productos"]
const mobileModuleSelectionKey = "amg-admin-mobile-primary-modules"
const mobileModuleOrderKey = "amg-admin-mobile-modules-order"

function activePath(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href))
}

export function AdminMobileShell({
  groups,
  pathname,
  onLogout,
}: {
  groups: AdminNavGroup[]
  pathname: string
  onLogout: () => Promise<void>
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [selectedModules, setSelectedModules] = useState<string[] | null>(null)
  const [moduleOrder, setModuleOrder] = useState<string[] | null>(null)
  const [draggingModule, setDraggingModule] = useState<string | null>(null)
  const [selectionMessage, setSelectionMessage] = useState("")
  const longPressTimer = useRef<number | null>(null)
  const draggingHref = useRef<string | null>(null)
  const movedModule = useRef(false)
  const pressOrigin = useRef<{ x: number; y: number } | null>(null)
  const capturedPointer = useRef<{ element: HTMLDivElement; pointerId: number } | null>(null)
  const lastDragTarget = useRef<string | null>(null)

  useEffect(() => {
    if (!drawerOpen && !moreOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawerOpen, moreOpen])

  useEffect(() => {
    if (!draggingModule) return
    const preventPageScroll = (event: TouchEvent) => event.preventDefault()
    document.addEventListener("touchmove", preventPageScroll, { passive: false })
    return () => document.removeEventListener("touchmove", preventPageScroll)
  }, [draggingModule])

  const allModules = useMemo(() => {
    const unique = new Map<string, AdminNavLink>()
    groups.flatMap((group) => group.links).forEach((link) => {
      if (!unique.has(link.href)) unique.set(link.href, link)
    })
    return Array.from(unique.values()).map((link) =>
      link.href === "/admin" ? { ...link, icon: Home, image: undefined } : link
    )
  }, [groups])
  const defaultSelection = useMemo(() => {
    const available = new Set(allModules.map((link) => link.href))
    const defaults = defaultBottomNav.filter((href) => available.has(href))
    return (defaults.length ? defaults : allModules.map((link) => link.href)).slice(0, 4)
  }, [allModules])
  const selectedHrefs = selectedModules ?? defaultSelection
  const orderedModules = useMemo(() => {
    const modulesByHref = new Map(allModules.map((link) => [link.href, link]))
    const requestedOrder = moduleOrder ?? allModules.map((link) => link.href)
    const uniqueOrder = [...new Set(requestedOrder.filter((href) => modulesByHref.has(href)))]
    allModules.forEach((link) => {
      if (!uniqueOrder.includes(link.href)) uniqueOrder.push(link.href)
    })
    return uniqueOrder.flatMap((href) => {
      const link = modulesByHref.get(href)
      return link ? [link] : []
    })
  }, [allModules, moduleOrder])
  const bottomNav = useMemo(() => {
    const modulesByHref = new Map(allModules.map((link) => [link.href, link]))
    return selectedHrefs.flatMap((href) => {
      const link = modulesByHref.get(href)
      return link ? [link] : []
    })
  }, [allModules, selectedHrefs])
  const moreActive = allModules.some(
    (link) => !selectedHrefs.includes(link.href) && activePath(pathname, link.href)
  )

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const storedSelection = localStorage.getItem(mobileModuleSelectionKey)
        const available = new Set(allModules.map((link) => link.href))
        const savedSelection = storedSelection ? JSON.parse(storedSelection) : []
        setSelectedModules(
          Array.isArray(savedSelection)
            ? savedSelection
                .filter((href): href is string => typeof href === "string" && available.has(href))
                .slice(0, 4)
            : defaultSelection.length ? defaultSelection : []
        )
        if (!storedSelection) setSelectedModules(defaultSelection)
        const storedOrder = localStorage.getItem(mobileModuleOrderKey)
        const savedOrder = storedOrder ? JSON.parse(storedOrder) : []
        const validOrder = Array.isArray(savedOrder)
          ? savedOrder.filter((href): href is string => typeof href === "string" && available.has(href))
          : []
        const remaining = allModules.map((link) => link.href).filter((href) => !validOrder.includes(href))
        setModuleOrder([...validOrder, ...remaining])
      } catch {
        localStorage.removeItem(mobileModuleSelectionKey)
        localStorage.removeItem(mobileModuleOrderKey)
        setSelectedModules(defaultSelection)
        setModuleOrder(allModules.map((link) => link.href))
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [allModules, defaultSelection])

  function toggleModule(href: string) {
    const isSelected = selectedHrefs.includes(href)
    if (!isSelected && selectedHrefs.length >= 4) {
      setSelectionMessage("Ya elegiste 4 accesos. Quitá uno para agregar otro.")
      return
    }

    const nextSelection = isSelected
      ? selectedHrefs.filter((selectedHref) => selectedHref !== href)
      : [...selectedHrefs, href]
    setSelectedModules(nextSelection)
    setSelectionMessage(
      isSelected
        ? "Módulo quitado de la barra inferior."
        : "Módulo agregado a la barra inferior."
    )
    localStorage.setItem(mobileModuleSelectionKey, JSON.stringify(nextSelection))
  }

  function moveModule(sourceHref: string, targetHref: string) {
    if (sourceHref === targetHref) return
    movedModule.current = true
    setModuleOrder((current) => {
      const nextOrder = (current ?? allModules.map((link) => link.href)).filter((href) => href !== sourceHref)
      const targetIndex = nextOrder.indexOf(targetHref)
      if (targetIndex < 0) return current
      nextOrder.splice(targetIndex, 0, sourceHref)
      localStorage.setItem(mobileModuleOrderKey, JSON.stringify(nextOrder))
      return nextOrder
    })
  }

  function clearLongPress() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function startModuleDrag(href: string, event: React.PointerEvent<HTMLDivElement>) {
    clearLongPress()
    movedModule.current = false
    pressOrigin.current = { x: event.clientX, y: event.clientY }
    const element = event.currentTarget
    const pointerId = event.pointerId
    longPressTimer.current = window.setTimeout(() => {
      try {
        element.setPointerCapture(pointerId)
        capturedPointer.current = { element, pointerId }
      } catch {
        capturedPointer.current = null
      }
      draggingHref.current = href
      lastDragTarget.current = href
      setDraggingModule(href)
      navigator.vibrate?.(18)
    }, 320)
  }

  function handleModulePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingHref.current) {
      const origin = pressOrigin.current
      if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 10) {
        clearLongPress()
      }
      return
    }

    event.preventDefault()
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-mobile-module]")
    const targetHref = target?.dataset.mobileModule
    if (!targetHref || targetHref === lastDragTarget.current) return
    lastDragTarget.current = targetHref
    moveModule(draggingHref.current, targetHref)
  }

  function finishModuleDrag(event?: React.PointerEvent<HTMLDivElement>) {
    clearLongPress()
    pressOrigin.current = null
    const capture = capturedPointer.current
    if (capture) {
      try {
        if (capture.element.hasPointerCapture(capture.pointerId)) {
          capture.element.releasePointerCapture(capture.pointerId)
        }
      } catch {
        // El navegador puede liberar la captura automáticamente al terminar el gesto.
      }
      capturedPointer.current = null
    } else if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!draggingHref.current) return
    draggingHref.current = null
    lastDragTarget.current = null
    setDraggingModule(null)
    window.setTimeout(() => {
      movedModule.current = false
    }, 0)
  }

  return (
    <>
      <header className="admin-mobile-header sticky top-0 z-40 hidden items-center justify-between border-b border-slate-200/70 bg-white/82 px-4 backdrop-blur-2xl print:hidden max-lg:flex">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="admin-mobile-tap grid h-10 w-10 place-items-center rounded-full bg-slate-100/80 text-slate-700"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/admin" className="absolute left-1/2 -translate-x-1/2" aria-label="Ir al resumen">
          <Image
            src="/images/documents/amg-logo-ui.webp"
            alt="AMG Radiadores"
            width={600}
            height={300}
            priority
            className="h-auto w-[108px] object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/mensajes"
            className="admin-mobile-tap grid h-10 w-10 place-items-center rounded-full bg-slate-100/80"
            aria-label="Mensajes"
          >
            <Image src="/images/admin-icons/mensajes.webp" alt="" width={192} height={192} className="h-6 w-6 object-contain" />
          </Link>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#071b33] text-[11px] font-bold tracking-wide text-white shadow-sm">
            AMG
          </span>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[70] hidden transition max-lg:block",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity duration-250",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
          aria-label="Cerrar menú"
        />
        <aside
          className={cn(
            "admin-mobile-drawer absolute inset-y-0 left-0 flex w-[min(84vw,330px)] flex-col overflow-hidden border-r border-white/10 bg-[#061426]/95 text-white shadow-2xl backdrop-blur-2xl transition-transform duration-250 ease-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
            <span className="rounded-xl bg-white/95 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,.18)]">
              <Image src="/images/documents/amg-logo-ui.webp" alt="AMG Radiadores" width={600} height={300} className="h-auto w-32 object-contain" priority />
            </span>
            <button type="button" onClick={() => setDrawerOpen(false)} className="admin-mobile-tap grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {allModules.map((link) => {
              const active = activePath(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "admin-mobile-tap flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium text-white/72 transition",
                    active && "border-blue-300/20 bg-blue-500/20 text-white shadow-[inset_0_1px_rgba(255,255,255,.08)]"
                  )}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/8">
                    <AdminNavIcon link={link} className="h-6 w-6 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,.3)]" />
                  </span>
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="space-y-2 border-t border-white/10 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            <Link href="/" onClick={() => setDrawerOpen(false)} className="admin-mobile-tap flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 text-xs font-semibold text-white/75">
              <Home className="h-4 w-4" />
              Volver a la página principal
            </Link>
            <button type="button" onClick={() => void onLogout()} className="admin-mobile-tap flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold text-rose-300">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>
      </div>

      <nav
        className="admin-mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 hidden border-t border-slate-200/70 bg-white/88 px-2 pt-2 shadow-[0_-12px_35px_rgba(15,23,42,.08)] backdrop-blur-2xl print:hidden max-lg:grid"
        style={{ gridTemplateColumns: `repeat(${Math.max(bottomNav.length + 1, 1)}, minmax(0, 1fr))` }}
      >
        {bottomNav.map((link) => {
          const active = activePath(pathname, link.href)
          return (
            <Link key={link.href} href={link.href} title={link.label} className={cn("admin-mobile-tap flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium text-slate-400", active && "text-[#0878f9]")}>
              <AdminNavIcon link={link} className={cn("h-6 w-6 object-contain transition", !active && link.image && "grayscale opacity-55")} />
              <span className="line-clamp-2 w-full break-words text-center leading-tight">{link.label}</span>
            </Link>
          )
        })}
        <button type="button" onClick={() => setMoreOpen(true)} className={cn("admin-mobile-tap flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium text-slate-400", moreActive && "text-[#0878f9]")}>
          <MoreHorizontal className="h-6 w-6" />
          <span>Más</span>
        </button>
      </nav>

      <div className={cn("fixed inset-0 z-[80] hidden max-lg:block", moreOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!moreOpen}>
        <button type="button" onClick={() => setMoreOpen(false)} className={cn("absolute inset-0 bg-slate-950/35 backdrop-blur-sm transition-opacity duration-200", moreOpen ? "opacity-100" : "opacity-0")} aria-label="Cerrar más opciones" />
        <section className={cn("absolute inset-x-0 bottom-0 flex max-h-[calc(100dvh-.75rem)] flex-col overflow-hidden rounded-t-[28px] border-t border-white bg-white/96 px-5 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_60px_rgba(15,23,42,.18)] backdrop-blur-2xl transition-transform duration-250", moreOpen ? "translate-y-0" : "translate-y-full")}>
          <div className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-slate-300" />
          <div className="mt-4 flex shrink-0 items-center justify-between">
            <div><p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400">Navegación</p><h2 className="text-xl font-semibold tracking-tight">Más módulos</h2></div>
            <button type="button" onClick={() => setMoreOpen(false)} className="admin-mobile-tap grid h-10 w-10 place-items-center rounded-full bg-slate-100" aria-label="Cerrar"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 shrink-0 rounded-xl bg-blue-50/80 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Elegí tus accesos principales</p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500">Tocá el círculo para agregar o quitar. Mantené presionado un módulo y arrastralo para ordenar la grilla.</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">{selectedHrefs.length}/4</span>
            </div>
            {selectionMessage && <p className="mt-2 text-[11px] font-semibold text-blue-700">{selectionMessage}</p>}
          </div>
          <div className="mt-3 grid min-h-0 flex-1 grid-cols-3 gap-3 overflow-y-auto overscroll-contain pb-6 pt-1">
            {orderedModules.map((link) => {
              const selectedIndex = selectedHrefs.indexOf(link.href)
              const selected = selectedIndex >= 0
              return <div
                key={link.href}
                data-mobile-module={link.href}
                className={cn(
                  "relative min-h-28 select-none rounded-2xl border border-slate-200 bg-slate-50/80 transition",
                  activePath(pathname, link.href) && "border-blue-200 bg-blue-50",
                  selected && "border-emerald-300 bg-emerald-50/45 shadow-[0_10px_30px_rgba(16,185,129,.12)]",
                  draggingModule === link.href && "scale-95 opacity-45 ring-2 ring-blue-400"
                )}
                onPointerDown={(event) => {
                  if (event.pointerType === "mouse" && event.button !== 0) return
                  startModuleDrag(link.href, event)
                }}
                onPointerMove={handleModulePointerMove}
                onPointerUp={(event) => finishModuleDrag(event)}
                onPointerCancel={(event) => finishModuleDrag(event)}
              >
                <Link href={link.href} onClick={(event) => { if (movedModule.current || draggingModule) { event.preventDefault(); return }; setMoreOpen(false) }} className={cn("admin-mobile-tap flex h-full min-h-28 flex-col items-center justify-center gap-2 rounded-2xl px-2 pb-3 pt-7 text-center text-[11px] font-semibold text-slate-600", activePath(pathname, link.href) && "text-blue-700")}>
                  <AdminNavIcon link={link} className="h-10 w-10 object-contain drop-shadow-[0_5px_9px_rgba(15,23,42,.15)]" />
                  <span className="line-clamp-2 leading-tight">{link.label}</span>
                </Link>
                <button
                  type="button"
                  aria-label={selected ? `Quitar ${link.label} de la barra inferior` : `Agregar ${link.label} a la barra inferior`}
                  aria-pressed={selected}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => toggleModule(link.href)}
                  className={cn(
                    "admin-mobile-module-selector absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full border bg-white text-[8px] font-bold transition",
                    selected
                      ? "is-selected border-emerald-300 bg-emerald-400 text-emerald-950"
                      : "border-slate-200 text-slate-400 shadow-sm active:border-emerald-300 active:bg-emerald-50"
                  )}
                >
                  {selected ? <><Check className="h-3 w-3" /><span className="sr-only">Posición {selectedIndex + 1}</span></> : <span className="h-1.5 w-1.5 rounded-full border border-slate-300" />}
                </button>
              </div>
            })}
          </div>
        </section>
      </div>
    </>
  )
}
