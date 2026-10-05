import Image from "next/image"
import type { ComponentType } from "react"
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  CircleDollarSign,
  PackageSearch,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Wrench,
} from "lucide-react"

import { PaymentMethodsChart } from "@/components/admin-report-charts"
import { RevenueTrendChart } from "@/components/admin-dashboard-charts"
import { prisma } from "@/lib/db/prisma"
import { formatPrice } from "@/lib/data"
import { AdminMobileExpandableText } from "@/components/admin-mobile-expandable-text"

export const dynamic = "force-dynamic"
export const revalidate = 0

const paymentLabels: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  CURRENT_ACCOUNT: "Cuenta corriente",
  COMBINED: "Pago combinado",
}

const orderLabels: Record<string, string> = {
  OPEN: "Abiertas",
  DIAGNOSIS: "Diagnóstico",
  WAITING_PARTS: "Esperando repuestos",
  IN_PROGRESS: "En reparación",
  READY: "Listas",
  DELIVERED: "Entregadas",
  CANCELLED: "Canceladas",
}

const orderColors: Record<string, string> = {
  OPEN: "bg-blue-500",
  DIAGNOSIS: "bg-violet-500",
  WAITING_PARTS: "bg-amber-500",
  IN_PROGRESS: "bg-cyan-500",
  READY: "bg-emerald-500",
  DELIVERED: "bg-slate-400",
  CANCELLED: "bg-rose-500",
}

export default async function ReportsPage() {
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const trendStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13)

  const [
    todaySales,
    monthSales,
    previousMonthSales,
    monthExpenses,
    previousMonthExpenses,
    payments,
    topItems,
    workOrders,
    inventory,
    trendSales,
    trendExpenses,
  ] = await Promise.all([
    prisma.erpSale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: dayStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.erpSale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: monthStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.erpSale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: previousMonthStart, lt: monthStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.erpExpense.aggregate({
      where: { expenseDate: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.erpExpense.aggregate({
      where: { expenseDate: { gte: previousMonthStart, lt: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.erpSale.groupBy({
      by: ["paymentMethod"],
      where: { status: "COMPLETED", createdAt: { gte: monthStart } },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
    }),
    prisma.erpSaleItem.groupBy({
      by: ["productName"],
      where: { sale: { status: "COMPLETED", createdAt: { gte: monthStart } } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 6,
    }),
    prisma.workOrder.groupBy({ by: ["status"], _count: true }),
    prisma.product.aggregate({
      where: { isActive: true },
      _sum: { stock: true },
      _count: true,
    }),
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
  ])

  const revenue = Number(monthSales._sum.total ?? 0)
  const previousRevenue = Number(previousMonthSales._sum.total ?? 0)
  const expenses = Number(monthExpenses._sum.amount ?? 0)
  const previousExpenses = Number(previousMonthExpenses._sum.amount ?? 0)
  const result = revenue - expenses
  const previousResult = previousRevenue - previousExpenses
  const averageTicket = monthSales._count > 0 ? revenue / monthSales._count : 0
  const margin = revenue > 0 ? (result / revenue) * 100 : 0
  const maxTop = Math.max(...topItems.map((item) => Number(item._sum.subtotal ?? 0)), 1)
  const activeOrderTotal = workOrders
    .filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status))
    .reduce((sum, order) => sum + order._count, 0)

  const keyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  })
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

  const paymentData = payments.map((payment) => ({
    name: paymentLabels[payment.paymentMethod] ?? payment.paymentMethod,
    value: Number(payment._sum.total ?? 0),
    count: payment._count,
  }))
  const monthLabel = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(now)

  return (
    <div className="relative mx-auto w-full max-w-[1500px] space-y-6 pb-10 text-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-52 -z-10 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />

      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-white/80 bg-white/75 shadow-[0_12px_35px_rgba(15,23,42,.1)] backdrop-blur-xl">
            <Image
              src="/images/admin-icons/reportes.webp"
              alt=""
              width={192}
              height={192}
              className="h-12 w-12 object-contain"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Inteligencia del negocio
            </p>
            <h1 className="mt-0.5 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">
              Reportes
            </h1>
            <p className="mt-1 text-sm text-slate-500">Indicadores actualizados en tiempo real.</p>
          </div>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/90 bg-white/75 px-4 py-2.5 text-sm font-semibold capitalize text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,.06)] backdrop-blur-xl">
          <Activity className="h-4 w-4 text-[#007aff]" />
          {monthLabel}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CircleDollarSign}
          label="Ventas de hoy"
          value={formatPrice(Number(todaySales._sum.total ?? 0))}
          detail={`${todaySales._count} operaciones registradas`}
          tone="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Ventas del mes"
          value={formatPrice(revenue)}
          detail={`${monthSales._count} operaciones`}
          change={percentageChange(revenue, previousRevenue)}
          tone="purple"
        />
        <StatCard
          icon={Activity}
          label="Resultado neto"
          value={formatPrice(result)}
          detail={`${margin.toFixed(1)}% de margen`}
          change={percentageChange(result, previousResult)}
          tone={result >= 0 ? "green" : "red"}
        />
        <StatCard
          icon={ReceiptText}
          label="Ticket promedio"
          value={formatPrice(averageTicket)}
          detail="Promedio por operación"
          tone="orange"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.75fr)]">
        <section className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,.08)] backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Rendimiento
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Flujo de los últimos 14 días</h2>
              <p className="mt-1 text-sm text-slate-500">Ingresos y egresos diarios.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#007aff]" />Ventas
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff375f]" />Gastos
              </span>
            </div>
          </div>
          <div className="mt-4">
            <RevenueTrendChart
              data={trendData.map(({ label, ventas, gastos }) => ({ label, ventas, gastos }))}
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,.08)] backdrop-blur-2xl sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Distribución
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Medios de pago</h2>
          <p className="mt-1 text-sm text-slate-500">Participación sobre las ventas del mes.</p>
          <div className="mt-4">
            <PaymentMethodsChart data={paymentData} />
          </div>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric
          icon={Banknote}
          label="Gastos del mes"
          value={formatPrice(expenses)}
          detail={`${monthExpenses._count} registros`}
          alert={expenses > revenue && revenue > 0}
        />
        <MiniMetric
          icon={ShoppingBag}
          label="Operaciones"
          value={monthSales._count}
          detail={`${previousMonthSales._count} el mes anterior`}
        />
        <MiniMetric
          icon={Boxes}
          label="Inventario activo"
          value={`${inventory._sum.stock ?? 0} u.`}
          detail={`${inventory._count} productos`}
        />
        <MiniMetric
          icon={Wrench}
          label="Trabajos activos"
          value={activeOrderTotal}
          detail="Órdenes sin entregar"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
        <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/75 shadow-[0_18px_60px_rgba(15,23,42,.07)] backdrop-blur-2xl">
          <div className="border-b border-slate-200/70 px-5 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Rendimiento comercial
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Productos con mayor venta</h2>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            {topItems.map((item, index) => {
              const amount = Number(item._sum.subtotal ?? 0)
              return (
                <div key={item.productName} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-500">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <AdminMobileExpandableText
                        value={item.productName}
                        label="Producto"
                        className="text-sm font-semibold text-slate-800"
                      />
                      <p className="hidden shrink-0 text-xs text-slate-400 sm:block">
                        {item._sum.quantity ?? 0} unidades
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#007aff] to-[#5e5ce6]"
                        style={{ width: `${Math.max(4, (amount / maxTop) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <strong className="text-sm font-semibold tracking-tight">{formatPrice(amount)}</strong>
                </div>
              )
            })}
            {!topItems.length && (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <PackageSearch className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-400">Todavía no hay ventas este mes.</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,.22)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Taller</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Estado de las órdenes</h2>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/70">
              <Wrench className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {workOrders.map((order) => (
              <div key={order.status} className="flex items-center justify-between rounded-2xl bg-white/[0.07] px-4 py-3">
                <span className="flex items-center gap-3 text-sm text-white/75">
                  <span className={`h-2.5 w-2.5 rounded-full ${orderColors[order.status] ?? "bg-slate-400"}`} />
                  {orderLabels[order.status] ?? order.status}
                </span>
                <strong className="text-sm">{order._count}</strong>
              </div>
            ))}
            {!workOrders.length && (
              <p className="py-10 text-center text-sm text-white/40">No hay órdenes registradas.</p>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Activas</p>
              <p className="mt-1 text-2xl font-semibold">{activeOrderTotal}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Resultado</p>
              <p className={`mt-1 truncate text-lg font-semibold ${result >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatPrice(result)}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
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

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  change,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
  change?: number | null
  tone: Tone
}) {
  const positive = change !== undefined && change !== null && change > 0

  return (
    <section className="rounded-[26px] border border-white/80 bg-white/75 p-5 shadow-[0_14px_45px_rgba(15,23,42,.07)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,.11)]">
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              change === null
                ? "bg-blue-500/10 text-blue-600"
                : change === 0
                  ? "bg-slate-100 text-slate-500"
                : positive
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {change === null ? (
              "Nuevo"
            ) : change === 0 ? (
              "Sin cambios"
            ) : (
              <>
                {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </>
            )}
          </span>
        )}
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tracking-[-0.04em] sm:text-[1.7rem]">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </section>
  )
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  detail,
  alert = false,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number | string
  detail: string
  alert?: boolean
}) {
  return (
    <section className="flex items-center gap-4 rounded-[22px] border border-white/80 bg-white/70 p-4 shadow-[0_10px_35px_rgba(15,23,42,.05)] backdrop-blur-xl">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          alert ? "bg-rose-500/10 text-rose-600" : "bg-slate-100 text-slate-600"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-lg font-semibold tracking-tight">{value}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">{detail}</p>
      </div>
    </section>
  )
}
