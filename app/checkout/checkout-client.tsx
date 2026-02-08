"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/data"

export function CheckoutClient() {
  const { items, totalPrice, clearCart } = useCart()
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: "" })
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "El nombre es obligatorio"
    if (!form.email.trim()) errs.email = "El email es obligatorio"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email invalido"
    if (!form.phone.trim()) errs.phone = "El telefono es obligatorio"
    if (!form.address.trim()) errs.address = "La direccion es obligatoria"
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    // MVP: Save order to localStorage (would go to DB in production)
    const order = {
      id: `ORD-${Date.now()}`,
      customerName: form.name,
      customerEmail: form.email,
      customerPhone: form.phone,
      address: form.address,
      notes: form.notes,
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
      })),
      total: totalPrice,
      status: "pendiente",
      createdAt: new Date().toISOString(),
    }

    const existingOrders = JSON.parse(
      localStorage.getItem("amg-orders") || "[]"
    )
    existingOrders.push(order)
    localStorage.setItem("amg-orders", JSON.stringify(existingOrders))

    clearCart()
    setSubmitted(true)
  }

  if (items.length === 0 && !submitted) {
    return (
      <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center lg:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Tu carrito esta vacio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Agrega productos antes de proceder al checkout.
        </p>
        <Link
          href="/catalogo"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Ir al Catalogo
        </Link>
      </section>
    )
  }

  if (submitted) {
    return (
      <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center lg:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Pedido Realizado
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Tu pedido fue registrado con exito. Para confirmar el pago, comunicate
          por WhatsApp o transferencia bancaria. Te enviaremos los datos de
          pago.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="https://wa.me/5491100000000?text=Hola, acabo de realizar un pedido y quiero coordinar el pago."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Coordinar Pago por WhatsApp
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Volver al Inicio
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <Link
        href="/carrito"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al carrito
      </Link>

      <h1 className="text-2xl font-bold text-foreground md:text-3xl">
        Checkout
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">
            Datos del Cliente
          </h2>

          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Nombre completo *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Juan Perez"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="juan@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Telefono *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="11 2345-6789"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Direccion de envio *
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Av. Corrientes 1234, CABA"
            />
            {errors.address && (
              <p className="mt-1 text-xs text-destructive">{errors.address}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Indicaciones especiales para el envio..."
            />
          </div>

          <div className="rounded-md border border-border bg-muted/50 p-4">
            <p className="text-sm font-semibold text-foreground">
              Metodo de Pago
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Una vez confirmado el pedido, te enviaremos los datos para realizar
              el pago por transferencia bancaria o coordinar por WhatsApp.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 md:w-auto"
          >
            Confirmar Pedido
          </button>
        </form>

        {/* Order Summary */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground">Resumen</h2>
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
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
