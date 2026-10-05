"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BadgeDollarSign, CheckCircle2, Clock3, HeartPulse, UsersRound } from "lucide-react"

import { formatPrice } from "@/lib/data"

export type PayrollTrendPoint = {
  label: string
  period: string
  total: number
  paid: number
}

type EmployeePayrollAnalyticsProps = {
  periodLabel: string
  activeCount: number
  totalEmployees: number
  payrollTotal: number
  pendingTotal: number
  paidTotal: number
  healthInsuranceTotal: number
  baseTotal: number
  overtimeTotal: number
  additionsTotal: number
  aguinaldoTotal: number
  deductionsTotal: number
  pendingEmployees: number
  liquidatedEmployees: number
  payrollEmployees: number
  pendingOvertimeHours: number
  trend: PayrollTrendPoint[]
}

function compactCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function PayrollTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null

  const labels: Record<string, string> = { total: "Nómina", paid: "Pagado" }

  return <div className="rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,.16)] backdrop-blur-xl">
    <p className="mb-2 text-xs font-semibold text-slate-500">{label}</p>
    {payload.map((item) => <div key={item.name} className="flex min-w-44 items-center justify-between gap-5 py-0.5 text-xs">
      <span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{labels[item.name] || item.name}</span>
      <strong className="text-slate-950">{formatPrice(Number(item.value))}</strong>
    </div>)}
  </div>
}

function AnalyticCard({ icon: Icon, label, value, detail, tone }: { icon: typeof BadgeDollarSign; label: string; value: string; detail: string; tone: "slate" | "emerald" | "blue" | "violet" }) {
  const tones = {
    slate: "bg-slate-950 text-white",
    emerald: "bg-emerald-500/10 text-emerald-700",
    blue: "bg-blue-500/10 text-blue-700",
    violet: "bg-violet-500/10 text-violet-700",
  }

  return <div className="flex min-w-0 items-center gap-3 rounded-[22px] border border-slate-200/70 bg-white/75 p-4 shadow-[0_10px_35px_rgba(15,23,42,.045)] backdrop-blur-xl">
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
    <div className="min-w-0"><p className="truncate text-[11px] font-medium text-slate-500">{label}</p><p className="truncate text-xl font-semibold tracking-[-.025em] text-slate-950">{value}</p><p className="truncate text-[10px] text-slate-400">{detail}</p></div>
  </div>
}

function CompositionRow({ label, value, color = "slate", negative = false }: { label: string; value: number; color?: "slate" | "blue" | "emerald" | "violet" | "rose"; negative?: boolean }) {
  const dots = { slate: "bg-slate-500", blue: "bg-blue-500", emerald: "bg-emerald-500", violet: "bg-violet-500", rose: "bg-rose-500" }
  return <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
    <span className="flex items-center gap-2 text-xs text-slate-600"><span className={`h-2 w-2 rounded-full ${dots[color]}`} />{label}</span>
    <strong className={negative ? "text-xs text-rose-600" : "text-xs text-slate-950"}>{negative ? "− " : ""}{formatPrice(value)}</strong>
  </div>
}

function LivePayrollDot({ cx = 0, cy = 0, index = 0, lastIndex }: { cx?: number; cy?: number; index?: number; lastIndex: number }) {
  if (index !== lastIndex) return <g />

  return <g className="payroll-live-dot">
    <circle cx={cx} cy={cy} r="5" fill="#0a84ff" stroke="white" strokeWidth="3" />
    <circle cx={cx} cy={cy} r="7" fill="none" stroke="#0a84ff" strokeWidth="2" opacity=".8">
      <animate attributeName="r" values="7;18;7" dur="2.4s" repeatCount="indefinite" />
      <animate attributeName="opacity" values=".8;0;.8" dur="2.4s" repeatCount="indefinite" />
    </circle>
    <circle cx={cx} cy={cy} r="3" fill="white" opacity=".9">
      <animate attributeName="opacity" values=".9;.35;.9" dur="1.3s" repeatCount="indefinite" />
    </circle>
  </g>
}

export function EmployeePayrollAnalytics(props: EmployeePayrollAnalyticsProps) {
  const completion = props.payrollEmployees > 0 ? Math.min(100, Math.round((props.liquidatedEmployees / props.payrollEmployees) * 100)) : 0
  const [periodYear, periodMonth] = props.periodLabel.split("-").map(Number)
  const readablePeriod = new Date(periodYear, periodMonth - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" })

  return <section className="relative overflow-hidden rounded-[30px] border border-white/90 bg-white/72 p-4 shadow-[0_24px_70px_rgba(15,23,42,.07)] backdrop-blur-2xl sm:p-6">
    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" aria-hidden="true" />
    <div className="relative">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-blue-600">Analítica de personal</p><h2 data-quick-access-label="Analítica de personal" className="mt-1 text-2xl font-semibold tracking-[-.035em] text-slate-950">Control de nómina</h2><p className="mt-1 text-sm text-slate-500">Proyección de {readablePeriod}, pagos realizados y compromisos pendientes.</p></div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600"><UsersRound className="h-4 w-4 text-blue-600" /><strong className="text-slate-950">{props.activeCount}</strong> activos de {props.totalEmployees}</div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticCard icon={Clock3} label="Sueldos pendientes de pago" value={formatPrice(props.pendingTotal)} detail={`${props.pendingEmployees} empleado${props.pendingEmployees === 1 ? "" : "s"} pendiente${props.pendingEmployees === 1 ? "" : "s"}`} tone="slate" />
        <AnalyticCard icon={BadgeDollarSign} label="Nómina estimada del mes" value={formatPrice(props.payrollTotal)} detail="Incluye novedades y aguinaldo" tone="blue" />
        <AnalyticCard icon={CheckCircle2} label="Pagado y registrado" value={formatPrice(props.paidTotal)} detail="Pagos confirmados en Caja" tone="emerald" />
        <AnalyticCard icon={HeartPulse} label="Obra social a cargo" value={formatPrice(props.healthInsuranceTotal)} detail="Costo mensual de la empresa" tone="violet" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(310px,.75fr)]">
        <div className="rounded-[24px] border border-slate-200/70 bg-white/80 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h3 className="font-semibold text-slate-950">Evolución de la nómina</h3><span className="flex items-center gap-1.5 rounded-full border border-cyan-100 bg-cyan-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-cyan-700"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" /></span>En vivo</span></div><p className="text-xs text-slate-400">Historial pagado y proyección del período actual.</p></div><div className="flex items-center gap-4 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Nómina</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Pagado</span></div></div>
          <div className="payroll-chart-stage relative mt-3 h-[260px] w-full overflow-hidden rounded-2xl sm:h-[300px]">
            <div className="payroll-chart-ambient pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="payroll-chart-scanner pointer-events-none absolute inset-y-2 z-10" aria-hidden="true" />
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={props.trend} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                <defs><linearGradient id="payrollTotalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a84ff" stopOpacity={0.34}><animate attributeName="stop-opacity" values=".24;.46;.24" dur="3.2s" repeatCount="indefinite" /></stop><stop offset="100%" stopColor="#0a84ff" stopOpacity={0} /></linearGradient><linearGradient id="payrollPaidFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#30d158" stopOpacity={0.2}><animate attributeName="stop-opacity" values=".12;.3;.12" dur="3.8s" repeatCount="indefinite" /></stop><stop offset="100%" stopColor="#30d158" stopOpacity={0} /></linearGradient><filter id="payrollGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                <CartesianGrid vertical={false} stroke="rgba(100,116,139,.12)" strokeDasharray="4 6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={9} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={compactCurrency} />
                <Tooltip content={<PayrollTooltip />} cursor={{ stroke: "rgba(10,132,255,.16)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="total" name="total" stroke="#0a84ff" strokeWidth={3} fill="url(#payrollTotalFill)" filter="url(#payrollGlow)" dot={(dotProps) => { const { key, ...liveDotProps } = dotProps; return <LivePayrollDot key={key} {...liveDotProps} lastIndex={props.trend.length - 1} /> }} activeDot={{ r: 6, stroke: "white", strokeWidth: 3 }} isAnimationActive animationBegin={120} animationDuration={1800} animationEasing="ease-out" />
                <Area type="monotone" dataKey="paid" name="paid" stroke="#30b85a" strokeWidth={2.5} fill="url(#payrollPaidFill)" activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }} isAnimationActive animationBegin={380} animationDuration={2100} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-slate-200/70 bg-white/80 p-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">Composición estimada</h3><p className="text-xs text-slate-400">Conceptos del período actual.</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-blue-700">{readablePeriod}</span></div>
            <div className="mt-3"><CompositionRow label="Sueldos base" value={props.baseTotal} /><CompositionRow label="Horas extra / trabajos" value={props.overtimeTotal} color="blue" /><CompositionRow label="Premios y adicionales" value={props.additionsTotal} color="emerald" /><CompositionRow label="Aguinaldo" value={props.aguinaldoTotal} color="violet" /><CompositionRow label="Descuentos" value={props.deductionsTotal} color="rose" negative /></div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white"><span className="text-xs text-slate-300">Nómina neta</span><strong>{formatPrice(props.payrollTotal)}</strong></div>
          </div>
          <div className="rounded-[24px] border border-slate-200/70 bg-white/80 p-5">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-950">Liquidaciones del mes</p><p className="mt-0.5 text-[11px] text-slate-400">{props.liquidatedEmployees} de {props.payrollEmployees} generadas</p></div><strong className="text-lg text-blue-700">{completion}%</strong></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${completion}%` }} /></div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-orange-50 px-3 py-2.5 text-xs text-orange-800"><Clock3 className="h-4 w-4 shrink-0" /><span><strong>{props.pendingOvertimeHours.toFixed(1)} h</strong> extra todavía sin liquidar.</span></div>
          </div>
        </aside>
      </div>
    </div>
  </section>
}
