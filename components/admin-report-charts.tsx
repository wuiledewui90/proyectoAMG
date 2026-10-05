"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { AdminMobileExpandableText } from "@/components/admin-mobile-expandable-text"

type PaymentPoint = {
  name: string
  value: number
  count: number
}

const colors = ["#007aff", "#5e5ce6", "#30b0c7", "#34c759", "#ff9f0a"]

function compactCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function fullCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export function PaymentMethodsChart({ data }: { data: PaymentPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (!data.length || total <= 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-3xl bg-slate-50/70 text-sm text-slate-400">
        Todavía no hay pagos registrados este mes.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[210px_minmax(0,1fr)] sm:items-center xl:grid-cols-1 2xl:grid-cols-[210px_minmax(0,1fr)]">
      <div className="relative mx-auto h-[210px] w-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={98}
              paddingAngle={3}
              stroke="transparent"
            >
              {data.map((item, index) => (
                <Cell key={item.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => fullCurrency(Number(value))}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,.8)",
                background: "rgba(255,255,255,.92)",
                boxShadow: "0 16px 45px rgba(15,23,42,.14)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Cobrado
          </span>
          <span className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            {compactCurrency(total)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <div className="min-w-0">
                <AdminMobileExpandableText value={item.name} label="Método de pago" className="text-sm font-medium text-slate-700" />
                <p className="text-xs text-slate-400">{item.count} ventas</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-slate-950">{compactCurrency(item.value)}</p>
              <p className="text-xs text-slate-400">{Math.round((item.value / total) * 100)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
