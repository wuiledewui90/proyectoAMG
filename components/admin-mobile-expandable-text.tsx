"use client"

import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Maximize2, X } from "lucide-react"

type AdminMobileExpandableTextProps = {
  value: string
  label?: string
  className?: string
  lines?: 1 | 2 | 3
}

const lineClasses = {
  1: "truncate",
  2: "line-clamp-2",
  3: "line-clamp-3",
}

export function AdminMobileExpandableText({
  value,
  label = "Información completa",
  className = "",
  lines = 1,
}: AdminMobileExpandableTextProps) {
  const textRef = useRef<HTMLSpanElement>(null)
  const titleId = useId()
  const [overflowing, setOverflowing] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const element = textRef.current
    if (!element) return

    const measure = () => {
      if (window.innerWidth >= 1024) {
        setOverflowing(false)
        return
      }
      setOverflowing(
        element.scrollWidth > element.clientWidth + 1 ||
          element.scrollHeight > element.clientHeight + 1
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [value, lines])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeWithEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeWithEscape)
    }
  }, [open])

  return (
    <>
      <span className="relative block min-w-0">
        <span
          ref={textRef}
          className={`block ${lineClasses[lines]} ${overflowing ? "pr-7" : ""} ${className}`}
        >
          {value}
        </span>
        {overflowing && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setOpen(true)
            }}
            className="absolute right-0 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition active:scale-90 lg:hidden"
            aria-label={`Ver ${label.toLowerCase()}`}
          >
            <Maximize2 className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </span>

      {open && typeof document !== "undefined" && createPortal(
        <div
          className="admin-expandable-backdrop fixed inset-0 z-[120] flex items-end bg-slate-950/55 p-3 backdrop-blur-sm lg:hidden"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <section
            className="admin-expandable-modal w-full rounded-[28px] border border-white/80 bg-white p-5 text-slate-900 shadow-[0_30px_90px_rgba(2,8,23,.38)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" aria-hidden="true" />
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Vista completa</p>
                <h2 id={titleId} className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-950">{label}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95"
                aria-label="Cerrar información completa"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>
            <div className="mt-5 max-h-[55dvh] overflow-y-auto rounded-[20px] bg-slate-50 p-4">
              <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-6 text-slate-800">{value}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 min-h-12 w-full rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition active:scale-[.985]"
            >
              Cerrar
            </button>
          </section>
        </div>,
        document.body
      )}
    </>
  )
}
