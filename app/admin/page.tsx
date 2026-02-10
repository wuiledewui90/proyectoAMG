"use client"

import Link from "next/link"
import { Package, ShoppingCart, MessageSquare, DollarSign } from "lucide-react"
import { products, sampleOrders, sampleMessages, formatPrice } from "@/lib/data"

export default function AdminDashboardPage() {
  const activeProducts = products.filter((p) => p.active).length
  const totalRevenue = sampleOrders.reduce((s, o) => s + o.total, 0)

  const stats = [
    {
      label: "Productos Activos",
      value: activeProducts.toString(),
      icon: Package,
      href: "/admin/productos",
    },
    {
      label: "Ordenes",
      value: sampleOrders.length.toString(),
      icon: ShoppingCart,
      href: "/admin/ordenes",
    },
    {
      label: "Mensajes",
      value: sampleMessages.length.toString(),
      icon: MessageSquare,
      href: "/admin/mensajes",
    },
    {
      label: "Ingresos",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      href: "/admin/ordenes",
    },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Panel de administracion de RADIADORES AMG
        </p>
      </div>

      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {stat.value}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold text-foreground">Ordenes Recientes</h2>
          </div>

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
                    Total
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {sampleOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {order.id}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
