"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/data"
import { ORDERS_STORAGE_KEY, type StoredOrder } from "@/lib/orders"
import { buildCheckoutWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp"

export function CheckoutClient() {
  const { items, totalPrice, clearCart } = useCart()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [whatsAppUrl, setWhatsAppUrl] = useState("")

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)

    const order: StoredOrder = {
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
        sku: i.product.sku,
        brand: i.product.brand,
        model: i.product.model,
        category: i.product.category,
        compatibility: i.product.compatibility,
      })),
      total: totalPrice,
      status: "pendiente",
      createdAt: new Date().toISOString(),
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error ?? `Error ${res.status}`)
      }

      const existingOrders = JSON.parse(
        localStorage.getItem(ORDERS_STORAGE_KEY) || "[]"
      ) as StoredOrder[]
      existingOrders.push(order)
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(existingOrders))
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : "No se pudo registrar el pedido. Intentalo nuevamente.",
      })
      setSubmitting(false)
      return
    }

    const message = buildCheckoutWhatsAppMessage({
      address: form.address,
      email: form.email,
      items,
      name: form.name,
      notes: form.notes,
      phone: form.phone,
      totalPrice,
    })
    const url = getWhatsAppUrl(message)

    setWhatsAppUrl(url)
    clearCart()
    setSubmitted(true)
    window.location.href = url
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
          className="group mt-6 inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
        >
          Ir al Catalogo
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
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
          por WhatsApp. Ya preparamos el mensaje con los productos y tus datos.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={whatsAppUrl || getWhatsAppUrl("Hola, acabo de realizar un pedido y quiero coordinar el pago.")}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
          >
            Abrir WhatsApp
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted hover:shadow-md active:translate-y-0"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
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
        className="group mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
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
            disabled={submitting}
            className="w-full rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none md:w-auto"
          >
            {submitting ? "Registrando pedido..." : "Confirmar Pedido"}
          </button>
          {errors.submit && (
            <p className="text-sm text-destructive">{errors.submit}</p>
          )}
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
