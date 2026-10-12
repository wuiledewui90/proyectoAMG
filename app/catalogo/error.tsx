"use client"

import { RotateCcw } from "lucide-react"

export default function CatalogError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f4f5f7] px-5 py-24">
      <div className="w-full max-w-xl rounded-[28px] border border-white bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,.12)] backdrop-blur-xl sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b51f30]">Catálogo</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">No pudimos cargar los productos</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          Puede ser una interrupción momentánea. Volvé a intentar y el catálogo se actualizará sin salir de esta página.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#102a44] px-6 text-sm font-bold text-white transition hover:bg-[#b51f30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315b86] focus-visible:ring-offset-2"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
      </div>
    </main>
  )
}
