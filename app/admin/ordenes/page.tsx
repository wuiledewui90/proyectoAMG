"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Eye, Loader2, Trash2, X } from "lucide-react"
import { formatPrice } from "@/lib/data"
import { ORDERS_STORAGE_KEY, type StoredOrder } from "@/lib/orders"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([])
  const [selected, setSelected] = useState<StoredOrder | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    void loadOrders()
  }, [])

  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === "pendiente").length,
    [orders]
  )

  async function loadOrders() {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/orders", { cache: "no-store" })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error ?? `Error ${res.status}`)
      }
      const nextOrders = (await res.json()) as StoredOrder[]
      setOrders(nextOrders)
      if (selected) {
        setSelected(nextOrders.find((order) => order.id === selected.id) ?? null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las ordenes.")
    } finally {
      setLoading(false)
    }
  }

  function updateOrders(nextOrders: StoredOrder[]) {
    setOrders(nextOrders)
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(nextOrders))
    if (selected) {
      setSelected(nextOrders.find((order) => order.id === selected.id) ?? null)
    }
  }

  async function confirmOrder(order: StoredOrder) {
    if (order.status !== "pendiente") return
    if (!confirm("Confirmar orden y descontar stock?")) return

    setConfirmingId(order.id)

    try {
      const res = await fetch(`/api/orders/${order.id}/confirm`, {
        method: "POST",
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error ?? `Error ${res.status}`)
      }

      const confirmedOrder = (await res.json()) as StoredOrder
      const nextOrders = orders.map((current) =>
        current.id === confirmedOrder.id ? confirmedOrder : current
      )
      updateOrders(nextOrders)
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo confirmar la orden.")
    } finally {
      setConfirmingId(null)
    }
  }

  async function deleteOrder(order: StoredOrder) {
    if (
      !confirm(
        `Eliminar la orden ${order.id}? Esta accion no se puede deshacer.`
      )
    ) {
      return
    }

    setDeletingId(order.id)

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error ?? `Error ${res.status}`)
      }

      const nextOrders = orders.filter((current) => current.id !== order.id)
      updateOrders(nextOrders)
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar la orden.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="rounded-lg border bg-card p-4 sm:p-5">
        <h1 className="text-2xl font-bold">Ordenes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} orden{orders.length !== 1 ? "es" : ""} en total · {pendingCount} pendiente
          {pendingCount !== 1 ? "s" : ""}
        </p>
      </div>

      {loading && (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Cargando ordenes...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {selected && (
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Orden {selected.id}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(selected.createdAt).toLocaleString("es-AR")}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OrderInfo label="Cliente" value={selected.customerName} />
            <OrderInfo label="Telefono" value={selected.customerPhone} />
            <OrderInfo label="Email" value={selected.customerEmail} />
            <OrderInfo label="Estado" value={selected.status} />
            <div className="md:col-span-2 xl:col-span-4">
              <OrderInfo label="Direccion" value={selected.address} />
            </div>
            {selected.notes && (
              <div className="md:col-span-2 xl:col-span-4">
                <OrderInfo label="Notas" value={selected.notes} />
              </div>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {selected.items.map((item) => (
              <div key={`${item.productId}-${item.productName}`} className="rounded-md border p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[item.sku ? `SKU ${item.sku}` : null, item.brand, item.model, item.category]
                        .filter(Boolean)
                        .join(" · ") || "Sin caracteristicas"}
                    </p>
                    {item.compatibility && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Compatibilidad: {item.compatibility}
                      </p>
                    )}
                  </div>
                  <div className="text-sm sm:text-right">
                    <p>Cantidad: {item.quantity}</p>
                    <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-bold text-primary">Total: {formatPrice(selected.total)}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {selected.status === "pendiente" && (
                <button
                  onClick={() => confirmOrder(selected)}
                  disabled={confirmingId === selected.id}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {confirmingId === selected.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirmar y descontar stock
                </button>
              )}
              <button
                onClick={() => deleteOrder(selected)}
                disabled={deletingId === selected.id}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-destructive/40 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
              >
                {deletingId === selected.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Eliminar orden
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="hidden overflow-hidden rounded-lg border bg-card lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium">{order.id}</td>
                <td className="px-5 py-3">
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                </td>
                <td className="px-5 py-3 font-semibold">{formatPrice(order.total)}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("es-AR")}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelected(order)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Ver orden ${order.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {order.status === "pendiente" && (
                      <button
                        onClick={() => confirmOrder(order)}
                        disabled={confirmingId === order.id}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border px-3 text-xs font-medium text-primary hover:bg-muted disabled:opacity-60"
                      >
                        {confirmingId === order.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Confirmar
                      </button>
                    )}
                    <button
                      onClick={() => deleteOrder(order)}
                      disabled={deletingId === order.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-60"
                      aria-label={`Eliminar orden ${order.id}`}
                    >
                      {deletingId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Todavia no hay ordenes registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {orders.map((order) => (
          <article key={order.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{order.id}</p>
                <p className="mt-1 text-sm">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString("es-AR")}
              </span>
              <span className="font-bold text-primary">{formatPrice(order.total)}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setSelected(order)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border text-sm font-medium"
              >
                <Eye className="h-4 w-4" />
                Ver detalle
              </button>
              {order.status === "pendiente" && (
                <button
                  onClick={() => confirmOrder(order)}
                  disabled={confirmingId === order.id}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {confirmingId === order.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirmar
                </button>
              )}
              <button
                onClick={() => deleteOrder(order)}
                disabled={deletingId === order.id}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/40 text-sm font-medium text-destructive disabled:opacity-60"
              >
                {deletingId === order.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Eliminar
              </button>
            </div>
          </article>
        ))}
        {orders.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            Todavia no hay ordenes registradas.
          </div>
        )}
      </div>
    </div>
  )
}

function OrderInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: StoredOrder["status"] }) {
  const isPending = status === "pendiente"

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        isPending ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"
      }`}
    >
      {status}
    </span>
  )
}
