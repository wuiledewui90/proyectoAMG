import Link from "next/link"
import Image from "next/image"
import type { ComponentType } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  FileText,
  Package,
  Plus,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react"
import { InventoryCategoryChart, RevenueTrendChart } from "@/components/admin-dashboard-charts"
import { AdminMobileExpandableText } from "@/components/admin-mobile-expandable-text"
import { prisma } from "@/lib/db/prisma"
import { formatPrice } from "@/lib/data"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminDashboardPage() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const trendStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13)

  const [
    totalProducts,
    lowStockProducts,
    availableStock,
    pendingOrderItems,
    inventoryProducts,
    recentProducts,
    salesToday,
    salesMonth,
    expensesMonth,
    customerCount,
    activeWorkOrders,
    teamCount,
    trendSales,
    trendExpenses,
    draftDocuments,
    recentWorkOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.product.aggregate({
      where: { isActive: true, stock: { gt: 0 } },
      _sum: { stock: true },
    }),
    prisma.orderItem.aggregate({
      where: { order: { status: "pendiente" } },
      _sum: { quantity: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      select: { category: true, price: true, stock: true },
    }),
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.erpSale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: todayStart } }, _sum: { total: true }, _count: true }),
    prisma.erpSale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: monthStart } }, _sum: { total: true } }),
    prisma.erpExpense.aggregate({ where: { expenseDate: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.customer.count({ where: { active: true } }),
    prisma.workOrder.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    prisma.erpUser.count({ where: { active: true } }),
    prisma.erpSale.findMany({
      where: { status: "COMPLETED", createdAt: { gte: trendStart } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.erpExpense.findMany({
      where: { expenseDate: { gte: trendStart } },
      select: { expenseDate: true, amount: true },
      orderBy: { expenseDate: "asc" },
    }),
    prisma.erpDocument.count({ where: { status: "DRAFT" } }),
    prisma.workOrder.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { customer: { select: { name: true } } },
    }),
  ])

  const availableUnits = availableStock._sum.stock ?? 0
  const pendingDeliveryUnits = pendingOrderItems._sum.quantity ?? 0
  const inventoryValue = inventoryProducts.reduce(
    (total, product) => total + Number(product.price) * product.stock,
    0
  )
  const investmentByCategory = Array.from(
    inventoryProducts
      .reduce((categories, product) => {
        const category = product.category?.trim() || "Sin categoria"
        const current =
          categories.get(category) ?? {
            category,
            products: 0,
            units: 0,
            total: 0,
          }

        current.products += 1
        current.units += product.stock
        current.total += Number(product.price) * product.stock
        categories.set(category, current)

        return categories
      }, new Map<string, { category: string; products: number; units: number; total: number }>())
      .values()
  ).sort((a, b) => b.total - a.total)
  const monthRevenue = Number(salesMonth._sum.total ?? 0)
  const monthExpenses = Number(expensesMonth._sum.amount ?? 0)
  const monthResult = monthRevenue - monthExpenses
  const keyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })
  const labelFormatter = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  })
  const trendData = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13 + index)
    const key = keyFormatter.format(date)
    return {
      key,
      label: labelFormatter.format(date).replace(".", ""),
      ventas: 0,
      gastos: 0,
    }
  })
  const trendByDay = new Map(trendData.map((item) => [item.key, item]))

  trendSales.forEach((sale) => {
    const point = trendByDay.get(keyFormatter.format(sale.createdAt))
    if (point) point.ventas += Number(sale.total)
  })
  trendExpenses.forEach((expense) => {
    const point = trendByDay.get(keyFormatter.format(expense.expenseDate))
    if (point) point.gastos += Number(expense.amount)
  })

  const topCategories = investmentByCategory.slice(0, 5).map((item) => ({
    name: item.category,
    value: item.total,
  }))
  const otherCategoriesTotal = investmentByCategory
    .slice(5)
    .reduce((total, item) => total + item.total, 0)
  const categoryChartData = otherCategoriesTotal > 0
    ? [...topCategories, { name: "Otras", value: otherCategoriesTotal }]
    : topCategories

  return (
    <div className="relative mx-auto w-full max-w-[1500px] space-y-6 pb-10 text-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 -z-10 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="admin-dashboard-mobile space-y-5 lg:hidden">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium capitalize text-slate-400">
              {new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(now)}
            </p>
            <h1 className="mt-1 text-[1.75rem] font-semibold tracking-[-0.045em]">Resumen</h1>
          </div>
          <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
            Hoy
          </span>
        </header>

        <section className="overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,#071b33,#0b3a70)] p-5 text-white shadow-[0_18px_42px_rgba(7,27,51,.24)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200/70">Ventas del día</p>
              <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em]">{formatPrice(Number(salesToday._sum.total ?? 0))}</p>
            </div>
            <Image src="/images/admin-icons/ventas.webp" alt="" width={192} height={192} className="h-14 w-14 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,.28)]" />
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/65">
            <span>{salesToday._count} operaciones registradas</span>
            <Link href="/admin/ventas" className="font-semibold text-white">Ver ventas →</Link>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <MobileMetric image="/images/admin-icons/taller.webp" label="Órdenes activas" value={activeWorkOrders} />
          <MobileMetric image="/images/admin-icons/presupuestos.webp" label="Presupuestos" value={draftDocuments} />
          <MobileMetric image="/images/admin-icons/productos.webp" label="Stock disponible" value={availableUnits} />
          <MobileMetric image="/images/admin-icons/clientes.webp" label="Clientes" value={customerCount} />
        </div>

        <section className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/88 shadow-[0_12px_36px_rgba(15,23,42,.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Actividad</p><h2 className="mt-0.5 text-lg font-semibold tracking-tight">Últimas órdenes</h2></div>
            <Link href="/admin/taller" className="text-xs font-semibold text-[#0878f9]">Ver todas</Link>
          </div>
          <div className="divide-y divide-slate-100 px-4">
            {recentWorkOrders.map((order) => (
              <Link key={order.id} href="/admin/taller" className="admin-mobile-tap flex items-center gap-3 py-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50">
                  <Image src="/images/admin-icons/taller.webp" alt="" width={192} height={192} className="h-8 w-8 object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold text-slate-400">ORDEN #{order.id}</span>
                  <span className="block truncate text-sm font-semibold">{order.vehiclePlate}</span>
                  <span className="block truncate text-xs text-slate-500">{order.customer?.name || order.vehicleDescription || "Cliente sin registrar"}</span>
                </span>
                <span className="max-w-24 rounded-full bg-blue-50 px-2.5 py-1 text-center text-[10px] font-semibold text-blue-700">{workOrderLabel(order.status)}</span>
              </Link>
            ))}
            {recentWorkOrders.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No hay órdenes registradas.</p>}
          </div>
        </section>
      </div>

      <div className="admin-dashboard-desktop hidden space-y-6 lg:block">

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(now)}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Resumen</h1>
          <p className="mt-2 text-sm text-slate-500">Todo lo importante del negocio, en un solo lugar.</p>
        </div>
        <Link
          href="/admin/productos"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Gestionar productos
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CircleDollarSign} label="Ventas de hoy" value={formatPrice(Number(salesToday._sum.total ?? 0))} detail={`${salesToday._count} operaciones`} tone="blue" />
        <StatCard icon={Wallet} label="Resultado del mes" value={formatPrice(monthResult)} detail={`${formatPrice(monthRevenue)} facturados`} tone={monthResult >= 0 ? "green" : "red"} />
        <StatCard icon={Boxes} label="Valor de inventario" value={formatPrice(inventoryValue)} detail={`${availableUnits} unidades disponibles`} tone="purple" />
        <StatCard icon={Truck} label="Trabajos activos" value={activeWorkOrders} detail={`${pendingDeliveryUnits} unidades por entregar`} tone="orange" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.75fr)]">
        <section className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,.08)] backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Rendimiento</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Movimiento de los últimos 14 días</h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#007aff]" />Ventas</span>
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff375f]" />Gastos</span>
            </div>
          </div>
          <div className="mt-4">
            <RevenueTrendChart data={trendData.map(({ label, ventas, gastos }) => ({ label, ventas, gastos }))} />
          </div>
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,.08)] backdrop-blur-2xl sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Distribución</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Inventario por categoría</h2>
          <p className="mt-1 text-sm text-slate-500">Valor disponible en productos activos.</p>
          <div className="mt-4">
            {categoryChartData.length > 0 ? (
              <InventoryCategoryChart data={categoryChartData} total={formatPrice(inventoryValue)} />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">Sin inventario disponible</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniMetric icon={ShoppingCart} label="Ventas del mes" value={formatPrice(monthRevenue)} />
        <MiniMetric icon={Wallet} label="Gastos del mes" value={formatPrice(monthExpenses)} />
        <MiniMetric icon={Package} label="Productos" value={totalProducts} />
        <MiniMetric icon={AlertTriangle} label="Sin stock" value={lowStockProducts} alert={lowStockProducts > 0} />
      </div>

      <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/75 shadow-[0_18px_60px_rgba(15,23,42,.07)] backdrop-blur-2xl">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Inventario</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Inversión disponible</h2>
          </div>
          <p className="text-2xl font-semibold tracking-[-0.04em]">{formatPrice(inventoryValue)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-400">
                <th className="px-6 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 text-right font-medium">Productos</th>
                <th className="px-4 py-3 text-right font-medium">Unidades</th>
                <th className="px-6 py-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {investmentByCategory.slice(0, 8).map((item) => (
                <tr key={item.category} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{item.category}</div>
                    <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#007aff]" style={{ width: `${inventoryValue > 0 ? Math.max(3, item.total / inventoryValue * 100) : 0}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-slate-500">{item.products}</td>
                  <td className="px-4 py-4 text-right text-slate-500">{item.units}</td>
                  <td className="px-6 py-4 text-right font-semibold">{formatPrice(item.total)}</td>
                </tr>
              ))}
              {investmentByCategory.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No hay productos disponibles.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/75 shadow-[0_18px_60px_rgba(15,23,42,.07)] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Actividad</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Productos recientes</h2>
            </div>
            <Link href="/admin/productos" className="flex items-center gap-1 text-sm font-semibold text-[#007aff]">Ver todos <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="divide-y divide-slate-100 px-5 sm:px-6">
            {recentProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Package className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">Stock {product.stock} · {product.isActive ? "Activo" : "Inactivo"}</p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold">{formatPrice(Number(product.price))}</p>
              </div>
            ))}
            {recentProducts.length === 0 && <div className="py-12 text-center text-sm text-slate-400">No hay productos cargados.</div>}
          </div>
        </section>

        <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,.22)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Atajos</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Acciones rápidas</h2>
          <div className="mt-5 grid gap-2.5">
            <QuickLink href="/admin/ventas" label="Registrar una venta" icon={ShoppingCart} />
            <QuickLink href="/admin/taller" label="Nueva orden de taller" icon={Truck} />
            <QuickLink href="/admin/documentos" label="Crear presupuesto" icon={FileText} />
            <QuickLink href="/admin/productos" label="Gestionar inventario" icon={Package} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
            <div><p className="text-[10px] uppercase tracking-wider text-white/40">Clientes</p><p className="mt-1 text-2xl font-semibold">{customerCount}</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-white/40">Equipo</p><p className="mt-1 text-2xl font-semibold">{teamCount}</p></div>
          </div>
        </section>
      </div>
      </div>
    </div>
  )
}

function workOrderLabel(status: string) {
  const labels: Record<string, string> = {
    OPEN: "Ingresada",
    DIAGNOSIS: "Diagnóstico",
    WAITING_PARTS: "En espera",
    IN_PROGRESS: "En proceso",
    READY: "Lista",
    DELIVERED: "Entregada",
    CANCELLED: "Cancelada",
  }
  return labels[status] ?? status
}

function MobileMetric({ image, label, value }: { image: string; label: string; value: number | string }) {
  return (
    <section className="min-w-0 rounded-[20px] border border-slate-200/75 bg-white/88 p-4 shadow-[0_10px_30px_rgba(15,23,42,.055)] backdrop-blur-xl">
      <Image src={image} alt="" width={192} height={192} className="h-9 w-9 object-contain drop-shadow-[0_5px_9px_rgba(15,23,42,.15)]" />
      <AdminMobileExpandableText value={label} label="Métrica" className="mt-3 text-[11px] font-medium text-slate-500" />
      <AdminMobileExpandableText value={String(value)} label={label} className="mt-0.5 text-xl font-semibold tracking-[-0.035em] text-slate-900" />
    </section>
  )
}

type Tone = "blue" | "green" | "red" | "purple" | "orange"

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-500/10 text-blue-600",
  green: "bg-emerald-500/10 text-emerald-600",
  red: "bg-rose-500/10 text-rose-600",
  purple: "bg-violet-500/10 text-violet-600",
  orange: "bg-orange-500/10 text-orange-600",
}

function StatCard({ icon: Icon, label, value, detail, tone }: { icon: ComponentType<{ className?: string }>; label: string; value: number | string; detail: string; tone: Tone }) {
  return (
    <section className="rounded-[26px] border border-white/80 bg-white/75 p-5 shadow-[0_14px_45px_rgba(15,23,42,.07)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,.11)]">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone]}`}><Icon className="h-5 w-5" /></div>
        <ArrowUpRight className="h-4 w-4 text-slate-300" />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tracking-[-0.04em] sm:text-[1.7rem]">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </section>
  )
}

function MiniMetric({ icon: Icon, label, value, alert = false }: { icon: ComponentType<{ className?: string }>; label: string; value: number | string; alert?: boolean }) {
  return (
    <section className="flex items-center gap-4 rounded-[22px] border border-white/80 bg-white/70 p-4 shadow-[0_10px_35px_rgba(15,23,42,.05)] backdrop-blur-xl">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${alert ? "bg-rose-500/10 text-rose-600" : "bg-slate-100 text-slate-600"}`}><Icon className="h-4 w-4" /></span>
      <div className="min-w-0"><p className="text-xs font-medium text-slate-400">{label}</p><p className="mt-0.5 truncate text-lg font-semibold tracking-tight">{value}</p></div>
    </section>
  )
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <Link href={href} className="group flex items-center justify-between rounded-2xl bg-white/[0.07] px-4 py-3 transition hover:bg-white/[0.13]">
      <span className="flex items-center gap-3 text-sm font-medium"><Icon className="h-4 w-4 text-white/55" />{label}</span>
      <ArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
    </Link>
  )
}
