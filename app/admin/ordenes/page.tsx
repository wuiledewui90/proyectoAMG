"use client"

import { useState } from "react"
import { RequireAuth } from "@/lib/admin-auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Eye, X } from "lucide-react"
import { sampleOrders, formatPrice } from "@/lib/data"
import type { Order } from "@/lib/data"

export default function AdminOrdersPage() {
  const [orders] = useState<Order[]>(sampleOrders)
  const [selected, setSelected] = useState<Order | null>(null)

  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          <div className="border-b border-border bg-card px-6 py-4">
            <h1 className="text-xl font-bold text-foreground">Ordenes</h1>
            <p className="text-sm text-muted-foreground">
              {orders.length} orden{orders.length !== 1 ? "es" : ""} en total
            </p>
          </div>

          <div className="p-6">
            {/* Order detail modal */}
            {selected && (
              <div className="mb-6 rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Orden {selected.id}
                  </h2>
                  <button
                    onClick={() => setSelected(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium text-foreground">
                      {selected.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">
                      {selected.customerEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefono</p>
                    <p className="font-medium text-foreground">
                      {selected.customerPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                      {selected.status}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-foreground">
                    Items
                  </p>
                  <div className="mt-2 space-y-2">
                    {selected.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between rounded-md bg-muted/50 p-3 text-sm"
                      >
                        <span className="text-foreground">
                          {item.productName} x{item.quantity}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end border-t border-border pt-3">
                    <span className="text-lg font-bold text-primary">
                      Total: {formatPrice(selected.total)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Orders table */}
            <div className="rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                        ID
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                        Cliente
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                        Total
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                        Fecha
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-5 py-3 font-medium text-foreground">
                          {order.id}
                        </td>
                        <td className="px-5 py-3 text-foreground">
                          {order.customerName}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {order.customerEmail}
                        </td>
                        <td className="px-5 py-3 font-medium text-foreground">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString(
                            "es-AR"
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => setSelected(order)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={`Ver orden ${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
