"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowRight, Check, Search, SlidersHorizontal, X } from "lucide-react"
import { Reveal } from "@/components/reveal"
import type { CatalogProductCard } from "@/lib/catalog/public-products"

// Si querés mantener el formatPrice de lib/data, lo podés importar.
// Pero para “desacoplar” del hardcode, lo hago local:
function formatPriceARS(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
}

type Props = {
  products: CatalogProductCard[]
}

type FilterMode = "brand" | "category"
type ProductFilter = { mode: FilterMode; value: string }

function carBrands(product: CatalogProductCard) {
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

function isServicesCategory(value: string | null | undefined) {
  const normalized = value?.trim().toLocaleLowerCase("es") ?? ""
  return normalized === "servicio" || normalized === "servicios"
}

export function CatalogClient({ products }: Props) {
  const pageSize = 24
  const [search, setSearch] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [appliedFilter, setAppliedFilter] = useState<ProductFilter | null>(null)
  const [draftMode, setDraftMode] = useState<FilterMode>("brand")
  const [draftValue, setDraftValue] = useState("")
  const [visibleCount, setVisibleCount] = useState(pageSize)

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
    const servicesFilterSelected =
      appliedFilter?.mode === "category" && isServicesCategory(appliedFilter.value)

    return products
      .filter((p) => p.isActive)
      .filter((product) => !isServicesCategory(product.category) || servicesFilterSelected)
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

  const visibleProducts = filtered.slice(0, visibleCount)

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
            <h1 className="font-display w-[80%] max-w-5xl text-[1.08rem] font-black uppercase leading-[0.9] tracking-[-0.055em] sm:w-auto sm:text-[clamp(1.08rem,2.52vw,2.34rem)]">
              Encontrá el repuesto indicado para tu vehículo.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#f4f5f7] px-5 py-10 sm:px-8 lg:px-12 lg:py-14 xl:px-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#dce7f2]/70 blur-[120px]" />
          <div className="absolute -right-28 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#e5e9ee]/80 blur-[130px]" />
          <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-white blur-[110px]" />
        </div>

        <div className="relative mx-auto max-w-[90rem]">
        {/* Search and filters */}
        <div className="flex flex-col gap-3 rounded-[22px] border border-white/90 bg-white/80 p-3 shadow-[0_16px_45px_rgba(15,23,42,.07)] backdrop-blur-xl min-[360px]:flex-row min-[360px]:items-center sm:p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca, modelo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setVisibleCount(pageSize)
              }}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 shadow-inner shadow-slate-950/[.02] placeholder:text-slate-400 focus:border-[#8ba8c7] focus:outline-none focus:ring-4 focus:ring-[#315b86]/10"
              aria-label="Buscar productos"
            />
            {hasSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setVisibleCount(pageSize)
                }}
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
                ? "border-[#183a5c] bg-[#183a5c] text-white shadow-[0_8px_24px_rgba(24,58,92,.18)] hover:bg-[#234e78]"
                : "border-slate-200 bg-white text-[#203a55] hover:border-[#9bb0c5] hover:bg-slate-50"
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
            onClick={() => {
              setAppliedFilter(null)
              setVisibleCount(pageSize)
            }}
            className="mt-3 inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border border-[#9ec5ef] bg-white/85 px-3.5 text-xs font-semibold text-[#12406f] transition hover:border-[#438fe0] hover:bg-white"
            aria-label={`Quitar filtro ${appliedFilter.mode === "brand" ? "de marca" : "de categoría"}: ${appliedFilter.value}`}
          >
            <span className="truncate">{appliedFilter.mode === "brand" ? "Marca" : "Categoría"}: {appliedFilter.value}</span>
            <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </button>
        )}

        <div className="relative mt-6 h-px w-full bg-[linear-gradient(90deg,transparent_0%,rgba(100,116,139,.22)_24%,rgba(71,85,105,.4)_50%,rgba(100,116,139,.22)_76%,transparent_100%)]" aria-hidden="true">
          <span className="absolute left-1/2 top-1/2 h-1 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-400/20 blur-sm" />
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
          <div className="mt-7 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
            {visibleProducts.map((product, index) => (
              <Link
                key={product.id}
                href={`/catalogo/${product.slug}`}
                className="group relative flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200/90 bg-white/90 text-slate-950 shadow-[0_12px_34px_rgba(15,23,42,.07),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5 hover:border-[#9eb5ca] hover:shadow-[0_24px_55px_rgba(15,23,42,.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315b86] focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[16/11] overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(145deg,#ffffff,#edf1f5)]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    loading={index < 4 ? "eager" : "lazy"}
                    sizes="(max-width: 519px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
                    className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-3 top-3 max-w-[55%] truncate rounded-full border border-white/90 bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600 shadow-sm backdrop-blur-md sm:text-[10px]" title={product.category ?? undefined}>
                    {product.category || "Repuesto"}
                  </span>
                  <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold shadow-sm backdrop-blur-md sm:text-[10px] ${product.stock > 0 ? "border-emerald-100 bg-emerald-50/95 text-emerald-700" : "border-rose-100 bg-rose-50/95 text-rose-700"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${product.stock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} aria-hidden="true" />
                    {product.stock > 0 ? "Disponible" : "Sin stock"}
                  </span>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/[.05] to-transparent" aria-hidden="true" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                  <h3 className="line-clamp-2 min-h-[2.8em] break-words text-[15px] font-semibold leading-[1.4] tracking-[-0.015em] text-slate-900 [overflow-wrap:anywhere] sm:text-base">
                    {product.name}
                  </h3>
                  <p className="mt-1.5 truncate text-[11px] text-slate-500 sm:text-xs">
                    {[product.brand, product.model].filter(Boolean).join(" · ") || "Radiadores AMG"}
                  </p>
                  <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-200/80 pt-4">
                    <div className="min-w-0">
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">Precio</span>
                      <p className="mt-0.5 break-words text-lg font-bold leading-tight tracking-[-0.025em] text-slate-950 [overflow-wrap:anywhere]" title={formatPriceARS(product.price)}>
                        {formatPriceARS(product.price)}
                      </p>
                    </div>
                    <span className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-[#102a44] px-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition duration-300 group-hover:bg-[#b51f30] sm:px-4">
                      Ver y comprar
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filtered.length > visibleProducts.length && (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="text-xs font-medium text-slate-500">
              Mostrando {visibleProducts.length} de {filtered.length} productos
            </p>
            <button
              type="button"
              onClick={() => setVisibleCount((count) => Math.min(count + pageSize, filtered.length))}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-bold text-[#183a5c] shadow-sm transition hover:-translate-y-0.5 hover:border-[#8ca8c1] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315b86] focus-visible:ring-offset-2"
            >
              Mostrar más productos
            </button>
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
                  setVisibleCount(pageSize)
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
                  setVisibleCount(pageSize)
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
