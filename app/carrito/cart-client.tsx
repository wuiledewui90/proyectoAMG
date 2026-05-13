"use client"

import Image from "next/image"
import Link from "next/link"
import { Trash2, Minus, Plus, ArrowRight } from "lucide-react"
import { CartIcon3D } from "@/components/cart-icon"
import { useCart } from "@/lib/cart-context"

function formatPriceARS(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
}

export function CartClient() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } =
    useCart()

  if (items.length === 0) {
    return (
      <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center lg:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <CartIcon3D className="h-9 w-9 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Tu carrito esta vacio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Agrega productos desde nuestro catalogo para comenzar tu compra.
        </p>
        <Link
          href="/catalogo"
          className="group mt-6 inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
        >
          Ir al Catalogo
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">
        Carrito de Compras
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {totalItems} producto{totalItems !== 1 ? "s" : ""} en tu carrito
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={item.product.images?.[0] || "/placeholder.svg"}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/catalogo/${item.product.slug}`}
                      className="text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.product.brand} {item.product.model}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive hover:shadow-md active:translate-y-0"
                    aria-label={`Eliminar ${item.product.name} del carrito`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                      aria-label="Reducir cantidad"
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <span className="flex h-8 w-10 items-center justify-center border-x border-border text-sm font-semibold text-foreground">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="font-semibold text-foreground">
                    {formatPriceARS(item.product.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground">
            Resumen del Pedido
          </h2>

          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {item.product.name} x{item.quantity}
                </span>
                <span className="font-medium text-foreground">
                  {formatPriceARS(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">
                {formatPriceARS(totalPrice)}
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="group mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
          >
            Finalizar Compra
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
