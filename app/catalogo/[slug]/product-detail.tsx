"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  Minus,
  Plus,
  ShoppingCart,
  MessageCircle,
  Check,
} from "lucide-react"
import type { Product } from "@/lib/data"
import { formatPrice } from "@/lib/data"
import { useCart } from "@/lib/cart-context"

export function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

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
            src={product.images[0] || "/placeholder.svg"}
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
            {formatPrice(product.price)}
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
                <div className="flex items-center rounded-md border border-border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-muted"
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
                    className="h-10 w-14 border-x border-border bg-card text-center text-sm text-foreground focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-muted"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {added ? (
                    <>
                      <Check className="h-4 w-4" />
                      Agregado
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Agregar al Carrito
                    </>
                  )}
                </button>
                <a
                  href={`https://wa.me/5491100000000?text=Hola, me interesa: ${product.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <MessageCircle className="h-4 w-4" />
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
