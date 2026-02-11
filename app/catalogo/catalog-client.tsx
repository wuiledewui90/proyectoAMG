"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, X } from "lucide-react"
import type { SerializedProduct } from "@/lib/products/product-serialize"
import { brands, categories } from "@/lib/data"

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
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  // ✅ categorías y marcas derivadas de la DB (no hardcode)
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.localeCompare(b, "es")),
    []
  )

  const sortedBrands = useMemo(
    () => [...brands].sort((a, b) => a.localeCompare(b, "es")),
    []
  )

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
            className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas las categorias</option>
            {sortedCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filtrar por marca"
          >
            <option value="">Todas las marcas</option>
            {sortedBrands.map((b) => (
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
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
              aria-label="Limpiar filtros"
            >
              <X className="h-4 w-4" />
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
              No se encontraron productos
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Intenta con otros filtros o terminos de busqueda
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              (() => {
                const imageSrc =
                  imageErrors[product.id] || !product.images?.[0]
                    ? "/placeholder.svg"
                    : product.images[0]

                return (
              <Link
                key={product.id}
                href={`/catalogo/${product.slug}`}
                className="group rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-102"
                    onError={() =>
                      setImageErrors((current) => ({
                        ...current,
                        [product.id]: true,
                      }))
                    }
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
                )
              })()
            ))}
          </div>
        )}
      </section>
    </>
  )
}
