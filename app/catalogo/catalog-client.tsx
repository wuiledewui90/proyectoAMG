"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { categories as baseCategories } from "@/lib/data"
import type { SerializedProduct } from "@/lib/products/product-serialize"

// Si querés mantener el formatPrice de lib/data, lo podés importar.
// Pero para “desacoplar” del hardcode, lo hago local:
function formatPriceARS(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
}

type Props = {
  products: SerializedProduct[]
}

export function CatalogClient({ products }: Props) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")

  // Categorias base + categorias derivadas de la DB.
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        [
          ...baseCategories,
          ...products
            .map((p) => p.category?.trim())
            .filter((x): x is string => Boolean(x)),
        ]
      )
    ).sort()
  }, [products])

  const brands = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((p) => p.brand?.trim())
          .filter((x): x is string => Boolean(x))
      )
    ).sort()
  }, [products])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    return products
      .filter((p) => p.isActive)
      .filter((p) => {
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q) ||
          (p.model ?? "").toLowerCase().includes(q) ||
          (p.compatibility ?? "").toLowerCase().includes(q)
        )
      })
      .filter((p) => !selectedCategory || p.category === selectedCategory)
      .filter((p) => !selectedBrand || p.brand === selectedBrand)
  }, [products, search, selectedCategory, selectedBrand])

  const hasFilters = search || selectedCategory || selectedBrand
  const hasProducts = products.some((product) => product.isActive)

  return (
    <>
      <section className="relative overflow-hidden bg-[#090b0e] pb-8 pt-24 text-white sm:pb-10 sm:pt-28">
        <div className="technical-grid absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="relative mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <Reveal>
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.22em] text-primary">Catálogo</p>
            <h1 className="font-display max-w-5xl text-[clamp(1.8rem,4.2vw,3.9rem)] font-black uppercase leading-[0.9] tracking-[-0.055em]">
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
        {/* Filters */}
        <div className="flex flex-col gap-3 border border-foreground/12 bg-white p-4 shadow-[0_16px_40px_rgba(9,12,15,.05)] md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca, modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-12 w-full border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Buscar productos"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={categories.length === 0}
            className="min-h-12 border border-input bg-card px-3 py-2.5 text-sm text-foreground transition disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filtrar por categoria"
          >
            <option value="">
              {categories.length === 0
                ? "Sin categorias cargadas"
                : "Todas las categorias"}
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            disabled={brands.length === 0}
            className="min-h-12 border border-input bg-card px-3 py-2.5 text-sm text-foreground transition disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filtrar por marca"
          >
            <option value="">
              {brands.length === 0 ? "Sin marcas cargadas" : "Todas las marcas"}
            </option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => {
                setSearch("")
                setSelectedCategory("")
                setSelectedBrand("")
              }}
              className="group inline-flex min-h-10 items-center gap-1 border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary hover:text-white"
              aria-label="Limpiar filtros"
            >
              <X className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              Limpiar
            </button>
          )}
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {`${filtered.length} producto${filtered.length !== 1 ? "s" : ""} encontrado${
            filtered.length !== 1 ? "s" : ""
          }`}
        </p>

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
                ? "Intenta con otros filtros o terminos de busqueda"
                : "Cuando subas productos nuevos, las marcas apareceran automaticamente y podras usar las categorias cargadas."}
            </p>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <Link
                key={product.id}
                href={`/catalogo/${product.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-white/80 bg-white/55 shadow-[0_16px_42px_rgba(9,12,15,.1)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/45 hover:bg-white/70 hover:shadow-[0_28px_65px_rgba(9,12,15,.18)]"
              >
                <span
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.56),rgba(255,255,255,.1)_42%,rgba(255,255,255,.28))] opacity-70"
                  aria-hidden="true"
                />
                <span className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100" />
                <div className="relative z-[1] aspect-square overflow-hidden border-b border-white/50 bg-white/20">
                  <Image
                    src={product.thumbnailUrl ?? product.images?.[0] ?? "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-3 left-3 rounded-md border border-white/20 bg-secondary/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-secondary-foreground backdrop-blur-md">
                    {product.category}
                  </span>
                </div>

                <div className="relative z-[1] flex flex-1 flex-col p-3 sm:p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground sm:text-[10px]">
                    {product.brand} {product.model}
                  </p>

                  <h3 className="font-display mt-2 text-[11px] font-black uppercase leading-snug tracking-[-0.01em] text-foreground sm:text-base">
                    {product.name}
                  </h3>

                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <p className="text-base font-bold leading-none text-primary sm:text-lg">
                      {formatPriceARS(product.price)}
                    </p>

                    <span
                      className={`shrink-0 text-[10px] font-medium sm:text-xs ${
                        product.stock > 0 ? "text-green-600" : "text-destructive"
                      }`}
                    >
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
    </>
  )
}
