import Link from "next/link"
import type { ComponentType } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Package,
  Plus,
  ShoppingCart,
  Truck,
} from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { formatPrice } from "@/lib/data"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminDashboardPage() {
  const [
    totalProducts,
    activeProducts,
    inactiveProducts,
    lowStockProducts,
    availableStock,
    pendingOrders,
    pendingOrderItems,
    inventoryProducts,
    recentProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: false } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.product.aggregate({
      where: { isActive: true, stock: { gt: 0 } },
      _sum: { stock: true },
    }),
    prisma.orderRecord.count({ where: { status: "pendiente" } }),
    prisma.orderItem.aggregate({
      where: { order: { status: "pendiente" } },
      _sum: { quantity: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      select: { price: true, stock: true },
    }),
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ])

  const availableUnits = availableStock._sum.stock ?? 0
  const pendingDeliveryUnits = pendingOrderItems._sum.quantity ?? 0
  const inventoryValue = inventoryProducts.reduce(
    (total, product) => total + Number(product.price) * product.stock,
    0
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen rapido del panel de administracion.
          </p>
        </div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Gestionar productos
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Package} label="Productos" value={totalProducts} />
        <StatCard icon={CheckCircle2} label="Activos" value={activeProducts} />
        <StatCard icon={AlertTriangle} label="Inactivos" value={inactiveProducts} />
        <StatCard icon={ShoppingCart} label="Sin stock" value={lowStockProducts} />
        <StatCard icon={ClipboardList} label="Unidades disponibles" value={availableUnits} />
        <StatCard icon={Truck} label="Pendientes de entrega" value={pendingOrders} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Productos recientes</h2>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3">{formatPrice(Number(product.price))}</td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No hay productos cargados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 md:hidden">
            {recentProducts.map((product) => (
              <div key={product.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Stock: {product.stock}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {product.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold">{formatPrice(Number(product.price))}</p>
              </div>
            ))}
            {recentProducts.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No hay productos cargados.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold">Accesos rapidos</h2>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3 xl:grid-cols-1">
            <Link className="block rounded-md border px-3 py-2 hover:bg-muted" href="/admin/productos">
              Ver productos
            </Link>
            <Link className="block rounded-md border px-3 py-2 hover:bg-muted" href="/admin/ordenes">
              Ver ordenes
            </Link>
            <Link className="block rounded-md border px-3 py-2 hover:bg-muted" href="/admin/mensajes">
              Ver mensajes
            </Link>
          </div>
          <div className="mt-6 rounded-md bg-muted p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Valor disponible
            </p>
            <p className="mt-1 text-xl font-bold">{formatPrice(inventoryValue)}</p>
          </div>
          <div className="mt-3 rounded-md bg-muted p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Unidades en pedidos pendientes
            </p>
            <p className="mt-1 text-xl font-bold">{pendingDeliveryUnits}</p>
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </section>
  )
}
