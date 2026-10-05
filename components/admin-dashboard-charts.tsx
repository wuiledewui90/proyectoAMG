"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AdminMobileExpandableText } from "@/components/admin-mobile-expandable-text"

type TrendPoint = {
  label: string
  ventas: number
  gastos: number
}

type CategoryPoint = {
  name: string
  value: number
}

const categoryColors = ["#007aff", "#5e5ce6", "#30b0c7", "#34c759", "#ff9f0a", "#ff375f"]

function compactCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function AnalyticsTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_16px_45px_rgba(15,23,42,.16)] backdrop-blur-xl">
      <p className="mb-2 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex min-w-40 items-center justify-between gap-5 text-xs">
          <span className="flex items-center gap-2 capitalize text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
          <span className="font-semibold text-slate-950">{compactCurrency(item.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function RevenueTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-[260px] w-full sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 6, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007aff" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#007aff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff375f" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#ff375f" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(100,116,139,.13)" strokeDasharray="4 6" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={compactCurrency} />
          <Tooltip content={<AnalyticsTooltip />} cursor={{ stroke: "rgba(0,122,255,.18)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="ventas" stroke="#007aff" strokeWidth={3} fill="url(#salesFill)" activeDot={{ r: 5, strokeWidth: 3, stroke: "white" }} />
          <Area type="monotone" dataKey="gastos" stroke="#ff375f" strokeWidth={2} fill="url(#expenseFill)" activeDot={{ r: 4, strokeWidth: 2, stroke: "white" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function InventoryCategoryChart({ data, total }: { data: CategoryPoint[]; total: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[190px_1fr] sm:items-center xl:grid-cols-1">
      <div className="relative mx-auto h-[190px] w-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={3} stroke="transparent">
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => compactCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Inventario</span>
          <span className="mt-1 max-w-28 text-sm font-bold tracking-tight text-slate-950">{total}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColors[index % categoryColors.length] }} />
              <AdminMobileExpandableText value={item.name} label="Categoría" className="text-slate-600" />
            </span>
            <span className="shrink-0 font-semibold text-slate-950">{compactCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
