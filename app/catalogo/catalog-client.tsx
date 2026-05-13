"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, X } from "lucide-react"
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

  useEffect(() => {
    if (selectedCategory && !categories.includes(selectedCategory)) {
      setSelectedCategory("")
    }
  }, [categories, selectedCategory])

  useEffect(() => {
    if (selectedBrand && !brands.includes(selectedBrand)) {
      setSelectedBrand("")
    }
  }, [brands, selectedBrand])

  return (
    <>
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <h1 className="text-3xl font-bold text-secondary-foreground md:text-4xl">
            Catalogo de Productos
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-secondary-foreground/70">
            Encontra el radiador o accesorio que necesitas para tu vehiculo
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca, modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Buscar productos"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={categories.length === 0}
            className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground transition disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground transition disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="group inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md active:translate-y-0"
              aria-label="Limpiar filtros"
            >
              <X className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              Limpiar
            </button>
          )}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
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
          <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <Link
                key={product.id}
                href={`/catalogo/${product.slug}`}
                className="group rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-3 left-3 rounded bg-secondary/90 px-2 py-0.5 text-xs font-medium text-secondary-foreground shadow-sm">
                    {product.category}
                  </span>
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {product.brand} {product.model}
                  </p>

                  <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-lg font-bold text-primary">
                      {formatPriceARS(product.price)}
                    </p>

                    <span
                      className={`text-xs font-medium ${
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
      </section>
    </>
  )
}
