"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  ChevronLeft,
  Minus,
  Plus,
  MessageCircle,
  Check,
} from "lucide-react"
import { CartIcon3D } from "@/components/cart-icon"
import type { SerializedProduct } from "@/lib/products/product-serialize"
import { useCart } from "@/lib/cart-context"
import { getWhatsAppUrl } from "@/lib/whatsapp"

function formatPriceARS(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
}

export function ProductDetail({ product }: { product: SerializedProduct }) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem, totalItems } = useCart()

  function handleAdd() {
    addItem(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <Link
        href="/catalogo"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al catalogo
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
          <Image
            src={product.images?.[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Info */}
        <div>
          <span className="inline-block rounded bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {product.category}
          </span>

          <h1 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
            {product.name}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {product.brand} {product.model}
          </p>

          <p className="mt-6 text-3xl font-bold text-primary">
            {formatPriceARS(product.price)}
          </p>

          <div className="mt-2 text-sm">
            {product.stock > 0 ? (
              <span className="font-medium text-green-600">
                En stock ({product.stock} disponibles)
              </span>
            ) : (
              <span className="font-medium text-destructive">Sin stock</span>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-6 rounded-md border border-border bg-muted/50 p-4">
            <p className="text-sm font-semibold text-foreground">
              Compatibilidad
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.compatibility}
            </p>
          </div>

          {product.stock > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-4">
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium text-foreground"
                >
                  Cantidad
                </label>
                <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                    aria-label="Reducir cantidad"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(
                          1,
                          Math.min(product.stock, Number(e.target.value) || 1)
                        )
                      )
                    }
                    className="h-9 w-14 border-x border-border bg-card text-center text-sm font-semibold text-foreground focus:outline-none"
                  />

                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleAdd}
                  className="group inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
                >
                  {added ? (
                    <>
                      <Check className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                      Agregado
                    </>
                  ) : (
                    <>
                      <CartIcon3D className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                      Agregar al Carrito
                    </>
                  )}
                </button>

                <Link
                  href="/carrito"
                  className="group inline-flex items-center gap-2 rounded-md border border-primary/40 bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:shadow-md active:translate-y-0"
                >
                  <CartIcon3D className="h-5 w-5 text-primary transition-transform duration-200 group-hover:scale-110" />
                  Ver carrito
                  {totalItems > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                      {totalItems}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>

                <a
                  href={getWhatsAppUrl(
                    [
                      "Hola, me interesa este producto:",
                      product.name,
                      product.sku ? `SKU: ${product.sku}` : null,
                      product.brand ? `Marca: ${product.brand}` : null,
                      product.model ? `Modelo: ${product.model}` : null,
                      product.category ? `Categoria: ${product.category}` : null,
                      product.compatibility
                        ? `Compatibilidad: ${product.compatibility}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join("\n")
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted hover:shadow-md active:translate-y-0"
                >
                  <MessageCircle className="h-4 w-4 text-primary transition-transform duration-200 group-hover:scale-110" />
                  Consultar
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
