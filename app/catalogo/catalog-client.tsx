"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Check, Search, SlidersHorizontal, X } from "lucide-react"
import { Reveal } from "@/components/reveal"
import type { SerializedProduct } from "@/lib/products/product-serialize"

// Si querés mantener el formatPrice de lib/data, lo podés importar.
// Pero para “desacoplar” del hardcode, lo hago local:
function formatPriceARS(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
}

type Props = {
  products: SerializedProduct[]
}

type FilterMode = "brand" | "category"
type ProductFilter = { mode: FilterMode; value: string }

function carBrands(product: SerializedProduct) {
  return (product.brands?.trim() || product.brand?.trim() || "")
    .split(/[,;]+/)
    .map((brand) => brand.trim())
    .filter(Boolean)
}

function uniqueOptions(values: string[]) {
  const options = new Map<string, string>()
  for (const rawValue of values) {
    const value = rawValue.trim()
    if (value && !options.has(value.toLocaleLowerCase("es"))) {
      options.set(value.toLocaleLowerCase("es"), value)
    }
  }
  return [...options.values()].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
}

export function CatalogClient({ products }: Props) {
  const [search, setSearch] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [appliedFilter, setAppliedFilter] = useState<ProductFilter | null>(null)
  const [draftMode, setDraftMode] = useState<FilterMode>("brand")
  const [draftValue, setDraftValue] = useState("")

  const { brands, categories } = useMemo(() => {
    const activeProducts = products.filter((product) => product.isActive)
    return {
      brands: uniqueOptions(activeProducts.flatMap(carBrands)),
      categories: uniqueOptions(activeProducts.map((product) => product.category ?? "")),
    }
  }, [products])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const selectedValue = appliedFilter?.value.toLocaleLowerCase("es")

    return products
      .filter((p) => p.isActive)
      .filter((p) => {
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q) ||
          (p.brands ?? "").toLowerCase().includes(q) ||
          (p.model ?? "").toLowerCase().includes(q) ||
          (p.compatibility ?? "").toLowerCase().includes(q)
        )
      })
      .filter((product) => {
        if (!appliedFilter || !selectedValue) return true
        return appliedFilter.mode === "brand"
          ? carBrands(product).some((brand) => brand.toLocaleLowerCase("es") === selectedValue)
          : product.category?.trim().toLocaleLowerCase("es") === selectedValue
      })
  }, [products, search, appliedFilter])

  const hasSearch = Boolean(search.trim())
  const hasProducts = products.some((product) => product.isActive)
  const filterOptions = draftMode === "brand" ? brands : categories

  function openFilters() {
    setDraftMode(appliedFilter?.mode ?? (brands.length ? "brand" : "category"))
    setDraftValue(appliedFilter?.value ?? "")
    setFilterOpen(true)
  }

  return (
    <>
      <section className="relative overflow-hidden bg-[#090b0e] pb-8 pt-24 text-white sm:pb-10 sm:pt-28">
        <div className="technical-grid absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="relative mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <Reveal>
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.22em] text-primary">Catálogo</p>
            <h1 className="font-display w-[80%] max-w-5xl text-[1.08rem] font-black uppercase leading-[0.9] tracking-[-0.055em] sm:w-auto sm:text-[clamp(1.8rem,4.2vw,3.9rem)]">
              Encontrá el repuesto indicado para tu vehículo.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#edf1f4] px-5 py-10 sm:px-8 lg:px-12 lg:py-12 xl:px-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-primary/12 blur-[110px]" />
          <div className="absolute -right-28 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#0b2a69]/14 blur-[120px]" />
          <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-white/80 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-[90rem]">
        {/* Search and filters */}
        <div className="flex flex-col gap-3 border border-foreground/12 bg-white p-4 shadow-[0_16px_40px_rgba(9,12,15,.05)] min-[360px]:flex-row min-[360px]:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca, modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-12 w-full border border-input bg-card py-2.5 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Buscar productos"
            />
            {hasSearch && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={openFilters}
            disabled={!brands.length && !categories.length}
            aria-haspopup="dialog"
            aria-expanded={filterOpen}
            aria-controls="catalog-filter-dialog"
            className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              appliedFilter
                ? "border-[#438fe0] bg-[#0c3974] text-white shadow-[0_8px_24px_rgba(13,72,143,.22)] hover:bg-[#124b92]"
                : "border-[#a8c9ed] bg-[#edf6ff] text-[#103b70] hover:border-[#438fe0] hover:bg-[#deefff]"
            }`}
            aria-label={appliedFilter ? `Cambiar filtro: ${appliedFilter.value}` : "Abrir filtros del catálogo"}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtrar
          </button>
        </div>

        {appliedFilter && (
          <button
            type="button"
            onClick={() => setAppliedFilter(null)}
            className="mt-3 inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border border-[#9ec5ef] bg-white/85 px-3.5 text-xs font-semibold text-[#12406f] transition hover:border-[#438fe0] hover:bg-white"
            aria-label={`Quitar filtro ${appliedFilter.mode === "brand" ? "de marca" : "de categoría"}: ${appliedFilter.value}`}
          >
            <span className="truncate">{appliedFilter.mode === "brand" ? "Marca" : "Categoría"}: {appliedFilter.value}</span>
            <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </button>
        )}

        <div className="relative mt-6 h-px w-full bg-[linear-gradient(90deg,transparent_0%,rgba(38,111,189,.55)_24%,rgba(93,188,255,.95)_50%,rgba(38,111,189,.55)_76%,transparent_100%)] shadow-[0_0_12px_rgba(57,151,240,.35)]" aria-hidden="true">
          <span className="absolute left-1/2 top-1/2 h-1.5 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#61bcff]/45 blur-sm" />
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-lg font-medium text-foreground">
              {hasProducts
                ? "No se encontraron productos"
                : "Todavia no hay productos cargados"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasProducts
                ? "Probá con otro nombre, marca o modelo."
                : "Cuando cargues productos nuevos, aparecerán acá."}
            </p>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-2 min-[360px]:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
            {filtered.map((product) => (
              <Link
                key={product.id}
                href={`/catalogo/${product.slug}`}
                className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#6da8ed]/30 bg-[linear-gradient(145deg,#102b4b_0%,#071727_58%,#030b15_100%)] text-white shadow-[0_14px_34px_rgba(5,20,42,.22),inset_0_1px_0_rgba(255,255,255,.13)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#73b9ff]/75 hover:shadow-[0_22px_44px_rgba(5,20,42,.32),0_0_24px_rgba(51,145,255,.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fc7ff] focus-visible:ring-offset-2"
              >
                <span
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(83,172,255,.22),transparent_55%)]"
                  aria-hidden="true"
                />
                <span className="pointer-events-none absolute inset-x-3 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#8ed1ff]/80 to-transparent" aria-hidden="true" />
                <div className="relative z-[1] aspect-[4/3] overflow-hidden border-b border-[#8ab7ec]/25 bg-[linear-gradient(145deg,#f8fbff,#dce8f5)]">
                  <Image
                    src={product.thumbnailUrl ?? product.images?.[0] ?? "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 359px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 17vw"
                    className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="relative z-[1] flex min-w-0 flex-1 flex-col gap-1.5 p-2 sm:p-2.5">
                  <p className="truncate text-[8px] font-bold uppercase tracking-[0.1em] text-[#8ac9ff] sm:text-[9px]" title={product.category ?? undefined}>
                    {product.category || "Repuesto"}
                  </p>
                  <h3 className="font-display line-clamp-2 min-h-[2.4em] text-[10px] font-black uppercase leading-[1.2] tracking-[-0.01em] text-white sm:text-xs">
                    {product.name}
                  </h3>
                  <p className="truncate text-[8px] text-[#b7c9dc] sm:text-[9px]">
                    {[product.brand, product.model].filter(Boolean).join(" · ") || "Radiadores AMG"}
                  </p>
                  <div className="mt-auto border-t border-white/10 pt-2">
                    <p className="text-[11px] font-bold leading-tight text-white [overflow-wrap:anywhere] sm:text-sm" title={formatPriceARS(product.price)}>
                      {formatPriceARS(product.price)}
                    </p>
                    <span
                      className={`mt-1.5 flex items-center gap-1 text-[8px] font-medium sm:text-[9px] ${
                        product.stock > 0 ? "text-[#8ceac2]" : "text-[#ffb4bd]"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${product.stock > 0 ? "bg-[#55e3aa]" : "bg-[#ff7e90]"}`} aria-hidden="true" />
                      {product.stock > 0 ? "En stock" : "Sin stock"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </section>

      <DialogPrimitive.Root open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-[#020a16]/65 backdrop-blur-sm" />
          <DialogPrimitive.Content id="catalog-filter-dialog" className="fixed left-1/2 top-1/2 z-[110] flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[26px] border border-white/80 bg-[#f8fbff] text-[#0c213c] shadow-[0_30px_100px_rgba(0,15,39,.4)] focus:outline-none">
            <div className="relative shrink-0 border-b border-[#c8dcef] bg-[linear-gradient(135deg,#fafdff,#eaf4ff)] px-5 py-5 sm:px-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3976b7]">Explorar catálogo</span>
              <DialogPrimitive.Title className="mt-1 pr-10 text-2xl font-bold tracking-tight text-[#0c213c]">Filtrar productos</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm text-[#506a86]">Elegí cómo querés ver los productos.</DialogPrimitive.Description>
              <DialogPrimitive.Close className="absolute right-4 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-[#d5e4f3] bg-white text-[#345574] transition hover:bg-[#e7f2fd]" aria-label="Cerrar filtros">
                <X className="h-4 w-4" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#607b98]">Ver por</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { mode: "brand", label: "Marca de auto", available: brands.length > 0 },
                  { mode: "category", label: "Categoría", available: categories.length > 0 },
                ] as const).map(({ mode, label, available }) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={!available}
                    aria-pressed={draftMode === mode}
                    onClick={() => {
                      setDraftMode(mode)
                      setDraftValue("")
                    }}
                    className={`min-h-12 rounded-xl border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                      draftMode === mode
                        ? "border-[#337ac4] bg-[#0c3974] text-white shadow-[0_8px_20px_rgba(13,72,143,.2)]"
                        : "border-[#c7d9ec] bg-white text-[#234567] hover:border-[#6aa7e3] hover:bg-[#edf6ff]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[#607b98]">
                {draftMode === "brand" ? "Elegí una marca" : "Elegí una categoría"}
              </p>
              {filterOptions.length ? (
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={draftMode === "brand" ? "Marcas de auto" : "Categorías"}>
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={draftValue === option}
                      onClick={() => setDraftValue(option)}
                      className={`flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition sm:text-sm ${
                        draftValue === option
                          ? "border-[#4189d4] bg-[#e6f3ff] text-[#0b4079] ring-1 ring-[#4189d4]/30"
                          : "border-[#d5e3f0] bg-white text-[#294968] hover:border-[#7bb4ea] hover:bg-[#f0f8ff]"
                      }`}
                    >
                      <span className="min-w-0 break-words">{option}</span>
                      {draftValue === option && <Check className="h-4 w-4 shrink-0 text-[#1976d2]" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-[#d5e3f0] bg-white p-4 text-sm text-[#607b98]">No hay opciones disponibles en los productos actuales.</p>
              )}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#c8dcef] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setAppliedFilter(null)
                  setFilterOpen(false)
                }}
                className="min-h-11 rounded-xl border border-[#c7d9ec] bg-white px-5 text-sm font-semibold text-[#365675] transition hover:bg-[#edf6ff]"
              >
                Quitar filtro
              </button>
              <button
                type="button"
                disabled={!draftValue}
                onClick={() => {
                  setAppliedFilter({ mode: draftMode, value: draftValue })
                  setFilterOpen(false)
                }}
                className="min-h-11 rounded-xl bg-[#0c3974] px-5 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(13,72,143,.22)] transition hover:bg-[#155299] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Aplicar filtro
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
