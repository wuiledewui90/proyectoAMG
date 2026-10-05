"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Banknote,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  LockKeyhole,
  Plus,
  ReceiptText,
  RefreshCcw,
  Truck,
  Wallet,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { formatPrice } from "@/lib/data"

type Movement = {
  id: string
  source: string
  type: "INCOME" | "EXPENSE"
  description: string
  detail: string
  paymentMethod: string
  amount: number
  createdAt: string
}

type CashData = {
  date: string
  today: string
  session: null | {
    id: number
    openingBalance: number
    openedAt: string
    closedAt: string | null
    countedCash: number | null
    difference: number | null
    notes: string | null
    openedBy: { name: string } | null
    closedBy: { name: string } | null
  }
  summary: {
    income: number
    expense: number
    cashIncome: number
    cashExpense: number
    expectedCash: number
    balance: number
    incomeCount: number
    expenseCount: number
  }
  movements: Movement[]
}

type GroupValue = { amount: number; count: number }

const paymentLabels: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencias",
  CARD: "Tarjetas",
  MERCADO_PAGO: "Mercado Pago",
  CURRENT_ACCOUNT: "Cuenta corriente",
  COMBINED: "Combinado",
}

const sourceLabels: Record<string, string> = {
  SALE: "Venta cobrada",
  EXPENSE: "Gasto registrado",
  PAYROLL: "Sueldo pagado",
  MANUAL: "Movimiento manual",
}

const inputClass =
  "h-11 w-full border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#0a73e8] focus:ring-4 focus:ring-blue-500/10"

function longDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function movementTime(value: string) {
  return new Date(value).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function sumGroup(items: Movement[]) {
  return items.reduce<GroupValue>(
    (result, item) => ({
      amount: result.amount + item.amount,
      count: result.count + 1,
    }),
    { amount: 0, count: 0 }
  )
}

export default function CashPage() {
  const [date, setDate] = useState("")
  const [data, setData] = useState<CashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [openingBalance, setOpeningBalance] = useState("0")
  const [countedCash, setCountedCash] = useState("")
  const [notes, setNotes] = useState("")
  const [showMovement, setShowMovement] = useState(false)
  const [movement, setMovement] = useState({
    type: "INCOME",
    description: "",
    amount: "",
    paymentMethod: "CASH",
  })

  const load = useCallback(async (requested?: string) => {
    setLoading(true)
    setMessage("")
    const response = await fetch(
      `/api/admin/cash${requested ? `?date=${requested}` : ""}`,
      { cache: "no-store" }
    )
    const payload = await response.json().catch(() => null)
    if (response.ok) {
      setData(payload)
      setDate(payload.date)
      setCountedCash(String(payload.summary.expectedCash))
      setNotes(payload.session?.notes || "")
    } else {
      setMessage(payload?.error || "No se pudo cargar la caja.")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => void load())
  }, [load])

  async function action(payload: Record<string, unknown>) {
    setBusy(true)
    setMessage("")
    const response = await fetch("/api/admin/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: data?.date, ...payload }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setMessage(result?.error || "No se pudo completar la operación.")
    } else {
      setMessage("Operación registrada correctamente.")
      setShowMovement(false)
      setMovement({
        type: "INCOME",
        description: "",
        amount: "",
        paymentMethod: "CASH",
      })
      await load(data?.date)
    }
    setBusy(false)
  }

  const dashboard = useMemo(() => {
    const movements = data?.movements || []
    const incomes = movements.filter((item) => item.type === "INCOME")
    const expenses = movements.filter((item) => item.type === "EXPENSE")
    const cashIncome = sumGroup(
      incomes.filter((item) => item.paymentMethod === "CASH")
    )
    const transferIncome = sumGroup(
      incomes.filter((item) => item.paymentMethod === "TRANSFER")
    )
    const mercadoPagoIncome = sumGroup(
      incomes.filter((item) => item.paymentMethod === "MERCADO_PAGO")
    )
    const otherIncome = sumGroup(
      incomes.filter(
        (item) => !["CASH", "TRANSFER", "MERCADO_PAGO"].includes(item.paymentMethod)
      )
    )
    const materialWords = ["repuesto", "insumo", "herramienta", "material"]
    const serviceWords = ["flete", "servicio", "transporte", "envío", "envio"]
    const materialItems = expenses.filter((item) =>
      materialWords.some((word) =>
        `${item.description} ${item.detail}`.toLowerCase().includes(word)
      )
    )
    const materialIds = new Set(materialItems.map((item) => item.id))
    const serviceItems = expenses.filter((item) =>
      !materialIds.has(item.id) &&
      serviceWords.some((word) =>
        `${item.description} ${item.detail}`.toLowerCase().includes(word)
      )
    )
    const categorizedIds = new Set(
      [...materialItems, ...serviceItems].map((item) => item.id)
    )
    const otherItems = expenses.filter((item) => !categorizedIds.has(item.id))
    const methods = new Map<
      string,
      { income: number; expense: number; count: number }
    >()
    movements.forEach((item) => {
      const current = methods.get(item.paymentMethod) || {
        income: 0,
        expense: 0,
        count: 0,
      }
      if (item.type === "INCOME") current.income += item.amount
      else current.expense += item.amount
      current.count += 1
      methods.set(item.paymentMethod, current)
    })
    return {
      cashIncome,
      transferIncome,
      mercadoPagoIncome,
      otherIncome,
      materialExpense: sumGroup(materialItems),
      serviceExpense: sumGroup(serviceItems),
      otherExpense: sumGroup(otherItems),
      nonCashExpense: expenses
        .filter((item) => item.paymentMethod !== "CASH")
        .reduce((sum, item) => sum + item.amount, 0),
      methods: [...methods.entries()],
    }
  }, [data])

  if (loading && !data) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }
  if (!data) {
    return <p className="rounded-3xl bg-red-50 p-5 text-red-600">{message}</p>
  }

  const isToday = data.date === data.today
  const closed = Boolean(data.session?.closedAt)
  const countedValue = countedCash === "" ? null : Number(countedCash)
  const differencePreview =
    countedValue === null || !Number.isFinite(countedValue)
      ? null
      : countedValue - data.summary.expectedCash

  return (
    <div className="mx-auto w-full max-w-[1540px] space-y-4 pb-10 text-slate-950">
      <header className="overflow-hidden rounded-[22px] border border-[#0878eb] bg-gradient-to-r from-[#0874e5] to-[#3e9af2] px-5 py-4 text-white shadow-[0_12px_35px_rgba(10,115,232,.18)] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/70">Operación diaria · Tesorería</p>
              <h1 data-quick-access-label="Abrir caja" className="text-2xl font-semibold tracking-[-.035em]">Caja</h1>
              <p className="text-xs text-white/75">Ingresos, egresos y arqueo de la jornada en un solo lugar.</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-white/15 px-4 py-2 text-xs font-semibold ring-1 ring-white/25">
            {closed ? "Caja cerrada" : data.session ? "Caja abierta" : "Sin apertura"}
          </span>
        </div>
      </header>

      <section className="flex flex-col gap-3 rounded-[18px] border border-slate-200/80 bg-white/85 px-4 py-3 shadow-[0_8px_28px_rgba(15,23,42,.05)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf6ff] text-[#0874e5]"><CalendarDays className="h-4 w-4" /></span>
          <div><p className="text-[10px] uppercase tracking-[.13em] text-slate-400">Jornada consultada</p><p className="text-sm font-medium capitalize text-slate-700">{longDate(data.date)}</p></div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-[10px] text-slate-400">Elegir fecha<input type="date" className={`${inputClass} mt-1 sm:w-40`} value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <button onClick={() => void load(date)} className="h-11 rounded-xl bg-[#0874e5] px-5 text-xs font-semibold text-white transition hover:bg-[#0768ce]">Consultar</button>
          <button onClick={() => void load()} className="h-11 px-2 text-xs font-semibold text-[#0874e5]">Hoy</button>
        </div>
      </section>

      {!data.session && isToday && (
        <section className="rounded-[18px] border border-blue-200 bg-[#eef6ff] p-5 shadow-[0_8px_28px_rgba(15,23,42,.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#0874e5]">Acción de la jornada</p><h2 className="mt-1 text-xl font-semibold">Abrir caja de hoy</h2><p className="mt-1 text-sm text-slate-500">Ingresá el fondo inicial antes de comenzar la operación.</p></div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-md"><input type="number" min="0" className={inputClass} value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} placeholder="Fondo inicial" /><button disabled={busy} onClick={() => void action({ action: "open", openingBalance: Number(openingBalance) })} className="h-11 shrink-0 rounded-xl bg-[#0874e5] px-6 text-sm font-semibold text-white disabled:opacity-50">Abrir caja</button></div>
          </div>
        </section>
      )}

      <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1.04fr]">
        <SummaryPanel eyebrow="Movimientos del turno" title="Ingresos" total={data.summary.income} tone="income" description="Dinero realmente cobrado durante esta jornada, separado por medio de pago." footer={`${data.summary.incomeCount} cobros registrados`}>
          <CategoryTile icon={Banknote} label="Efectivo" value={dashboard.cashIncome.amount} count={dashboard.cashIncome.count} tone="income" detail="Billetes y monedas que entraron en caja." />
          <CategoryTile icon={Landmark} label="Transferencias" value={dashboard.transferIncome.amount} count={dashboard.transferIncome.count} tone="income" detail="Cobros acreditados por transferencia." />
          <CategoryTile icon={Wallet} label="Mercado Pago" value={dashboard.mercadoPagoIncome.amount} count={dashboard.mercadoPagoIncome.count} tone="income" detail="Ingresos registrados en la cuenta digital del negocio." />
          <CategoryTile icon={CreditCard} label="Tarjetas y otros" value={dashboard.otherIncome.amount} count={dashboard.otherIncome.count} tone="income" detail="Tarjetas, cheques y otros cobros." />
        </SummaryPanel>

        <SummaryPanel eyebrow="Salidas registradas" title="Egresos" total={data.summary.expense} tone="expense" description="Gastos registrados para esta caja, agrupados por concepto." footer={`${data.summary.expenseCount} gastos registrados`}>
          <CategoryTile icon={Boxes} label="Materiales e insumos" value={dashboard.materialExpense.amount} count={dashboard.materialExpense.count} tone="expense" detail="Pinturas, insumos y herramientas." />
          <CategoryTile icon={Truck} label="Fletes y servicios" value={dashboard.serviceExpense.amount} count={dashboard.serviceExpense.count} tone="expense" detail="Transporte y servicios del taller." />
          <CategoryTile icon={ReceiptText} label="Otros gastos" value={dashboard.otherExpense.amount} count={dashboard.otherExpense.count} tone="expense" detail="Sueldos, impuestos y otros egresos." />
          <div className="col-span-full grid grid-cols-2 gap-3 rounded-xl border border-blue-100 bg-[#f2f7fc] px-3 py-2 text-xs"><div><p className="text-slate-400">Efectivo de caja</p><strong className="font-medium text-rose-500">{formatPrice(data.summary.cashExpense)}</strong></div><div><p className="text-slate-400">Otros medios</p><strong className="font-medium text-rose-500">{formatPrice(dashboard.nonCashExpense)}</strong></div></div>
        </SummaryPanel>

        <section className="rounded-[18px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_10px_32px_rgba(15,23,42,.055)]">
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef6ff] text-[#0874e5]"><Wallet className="h-4 w-4" /></span><div><p className="text-[10px] uppercase tracking-[.13em] text-slate-400">Control de efectivo</p><h2 className="text-lg font-semibold text-[#07549f]">Cierre de caja</h2></div></div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">Contá solo el efectivo físico. Las transferencias, tarjetas y otros medios quedan en el detalle de movimientos.</p>
          <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 border border-slate-200 text-center"><CashFigure label="Fondo + cobros en efectivo" value={(data.session?.openingBalance || 0) + data.summary.cashIncome} /><CashFigure label="Gastos de caja" value={-data.summary.cashExpense} expense /><CashFigure label="Efectivo esperado" value={data.summary.expectedCash} /></div>
          {data.session && <p className="mt-3 text-[10px] text-slate-400">Abierta por {data.session.openedBy?.name || "administración"} · {movementTime(data.session.openedAt)}</p>}

          {data.session && !closed && isToday && (
            <div className="mt-4">
              <div className="grid gap-2 sm:grid-cols-2"><label className="text-[10px] text-slate-500">Efectivo físico contado<input type="number" min="0" className={`${inputClass} mt-1`} value={countedCash} onChange={(event) => setCountedCash(event.target.value)} placeholder="Solo billetes y monedas" /></label><label className="text-[10px] text-slate-500">Observación opcional<textarea className="mt-1 min-h-16 w-full border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#0874e5]" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Sobrante, faltante o novedad" /></label></div>
              <p className={`mt-2 rounded-lg px-3 py-2 text-[10px] ${differencePreview === null ? "bg-slate-50 text-slate-500" : differencePreview === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{differencePreview === null ? `Ingresá el efectivo contado para compararlo con ${formatPrice(data.summary.expectedCash)}.` : differencePreview === 0 ? "El efectivo contado coincide con el esperado." : `Diferencia estimada: ${formatPrice(differencePreview)}.`}</p>
              <div className="mt-2 grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => void load(data.date)} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-[#f2f7fc] text-xs font-semibold text-[#07549f]"><RefreshCcw className="h-3.5 w-3.5" /> Actualizar</button><button disabled={busy || countedValue === null} onClick={() => void action({ action: "close", countedCash: Number(countedCash), notes })} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0874e5] text-xs font-semibold text-white disabled:opacity-50"><LockKeyhole className="h-3.5 w-3.5" /> Cerrar caja</button></div>
            </div>
          )}

          {closed && (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Caja cerrada</p><div className="mt-2 grid grid-cols-2 gap-3 text-xs"><div><p className="text-slate-400">Efectivo contado</p><strong>{formatPrice(data.session?.countedCash || 0)}</strong></div><div><p className="text-slate-400">Diferencia</p><strong>{formatPrice(data.session?.difference || 0)}</strong></div></div>{isToday && <button disabled={busy} onClick={() => void action({ action: "reopen" })} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white text-xs font-semibold text-emerald-700"><RefreshCcw className="h-3.5 w-3.5" /> Reabrir caja</button>}</div>
          )}
          {!data.session && !isToday && <p className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500"><LockKeyhole className="h-4 w-4" /> No se registró apertura para esta fecha.</p>}
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <section className="rounded-[18px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_10px_32px_rgba(15,23,42,.05)]">
          <div className="flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[.13em] text-slate-400">Desglose</p><h2 className="mt-1 text-lg font-semibold">Medios de pago</h2></div><span className="text-[10px] text-slate-400">{dashboard.methods.length} medios</span></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[460px] text-xs"><thead className="bg-[#edf5fd] text-[9px] uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-2 text-left font-medium">Medio</th><th className="px-3 py-2 text-right font-medium">Ingresos</th><th className="px-3 py-2 text-right font-medium">Egresos</th></tr></thead><tbody>{dashboard.methods.map(([method, values]) => <tr key={method} className="border-b border-slate-100 last:border-0"><td className="px-3 py-3 font-medium capitalize">{paymentLabels[method] || method}<span className="ml-2 text-[10px] font-normal text-slate-400">{values.count} mov.</span></td><td className="px-3 py-3 text-right text-emerald-700">{formatPrice(values.income)}</td><td className="px-3 py-3 text-right text-rose-600">{formatPrice(values.expense)}</td></tr>)}</tbody></table>{!dashboard.methods.length && <p className="py-10 text-center text-xs text-slate-400">Sin medios registrados.</p>}</div>
        </section>

        <section className="rounded-[18px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_10px_32px_rgba(15,23,42,.05)]">
          <p className="text-[10px] uppercase tracking-[.13em] text-slate-400">Control de efectivo</p><h2 className="mt-1 text-lg font-semibold">Cómo se compone el saldo</h2>
          <div className="mt-4 space-y-3 text-xs"><BalanceRow label="Fondo inicial" value={data.session?.openingBalance || 0} /><BalanceRow label="Ingresos en efectivo" value={data.summary.cashIncome} positive /><BalanceRow label="Egresos en efectivo" value={data.summary.cashExpense} negative /><div className="border-t border-slate-200 pt-3"><BalanceRow label="Efectivo esperado" value={data.summary.expectedCash} strong /></div></div>
          <p className="mt-5 text-[10px] text-slate-400">Los gastos pagados con otros medios quedan registrados en Gastos y no modifican el arqueo de efectivo.</p>
        </section>
      </div>

      <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/90 shadow-[0_10px_32px_rgba(15,23,42,.05)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] uppercase tracking-[.13em] text-slate-400">Trazabilidad</p><h2 data-quick-access-label="Movimientos del día" className="mt-1 text-lg font-semibold">Movimientos del día</h2></div><div className="flex items-center gap-3"><span className="text-[10px] text-slate-400">{data.movements.length} registros</span>{data.session && !closed && isToday && <button onClick={() => setShowMovement((current) => !current)} className="flex h-9 items-center gap-2 rounded-lg bg-[#0874e5] px-4 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Movimiento manual</button>}</div></div>
        {showMovement && (
          <div className="grid gap-2 border-b border-blue-100 bg-[#f4f8fc] p-4 sm:grid-cols-2 xl:grid-cols-[150px_1fr_170px_180px_130px]"><select className={inputClass} value={movement.type} onChange={(event) => setMovement({ ...movement, type: event.target.value })}><option value="INCOME">Ingreso</option><option value="EXPENSE">Egreso</option></select><input className={inputClass} value={movement.description} onChange={(event) => setMovement({ ...movement, description: event.target.value })} placeholder="Concepto del movimiento" /><input type="number" min="0.01" step="0.01" className={inputClass} value={movement.amount} onChange={(event) => setMovement({ ...movement, amount: event.target.value })} placeholder="Importe" /><select className={inputClass} value={movement.paymentMethod} onChange={(event) => setMovement({ ...movement, paymentMethod: event.target.value })}><option value="CASH">Efectivo</option><option value="TRANSFER">Transferencia</option><option value="CARD">Tarjeta</option><option value="MERCADO_PAGO">Mercado Pago</option><option value="CURRENT_ACCOUNT">Cuenta corriente</option></select><button disabled={busy} onClick={() => void action({ action: "movement", ...movement, amount: Number(movement.amount) })} className="h-11 rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white disabled:opacity-50">Registrar</button></div>
        )}
        <div className="overflow-x-auto p-4"><table className="w-full min-w-[760px] text-xs"><thead className="bg-[#edf5fd] text-[9px] uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-2 text-left font-medium">Hora</th><th className="px-3 py-2 text-left font-medium">Concepto</th><th className="px-3 py-2 text-left font-medium">Medio</th><th className="px-3 py-2 text-right font-medium">Entrada</th><th className="px-3 py-2 text-right font-medium">Salida</th></tr></thead><tbody>{data.movements.map((item) => <tr key={item.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-3 text-slate-500">{movementTime(item.createdAt)}</td><td className="px-3 py-3"><p className="font-medium">{sourceLabels[item.source] || item.description}</p><p className="mt-0.5 text-[10px] text-slate-400">{item.source === "MANUAL" ? item.description : item.detail}</p></td><td className="px-3 py-3 capitalize">{paymentLabels[item.paymentMethod] || item.paymentMethod}</td><td className="px-3 py-3 text-right font-medium text-emerald-700">{item.type === "INCOME" ? formatPrice(item.amount) : "—"}</td><td className="px-3 py-3 text-right font-medium text-rose-600">{item.type === "EXPENSE" ? formatPrice(item.amount) : "—"}</td></tr>)}</tbody></table>{!data.movements.length && <p className="py-12 text-center text-xs text-slate-400">No hay movimientos en esta jornada.</p>}</div>
      </section>

      {message && <p className="fixed bottom-5 right-5 z-50 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">{message}</p>}
    </div>
  )
}

function SummaryPanel({ eyebrow, title, total, tone, description, footer, children }: { eyebrow: string; title: string; total: number; tone: "income" | "expense"; description: string; footer: string; children: React.ReactNode }) {
  const color = tone === "income" ? "text-emerald-700" : "text-rose-600"
  return <section className="flex min-h-[350px] flex-col rounded-[18px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_10px_32px_rgba(15,23,42,.055)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[.13em] text-slate-400">{eyebrow}</p><h2 className={`mt-1 text-lg font-semibold ${color}`}>{title}</h2></div><strong className={`text-lg font-medium ${color}`}>{formatPrice(total)}</strong></div><p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{children}</div><div className="mt-auto flex items-center justify-between border border-blue-100 bg-[#f3f8fd] px-3 py-2 text-xs"><span className="uppercase tracking-wide text-slate-400">Total de {title.toLowerCase()}</span><div className="text-right"><strong className={color}>{formatPrice(total)}</strong><p className="text-[9px] text-slate-400">{footer}</p></div></div></section>
}

function CategoryTile({ icon: Icon, label, value, count, tone, detail }: { icon: LucideIcon; label: string; value: number; count: number; tone: "income" | "expense"; detail: string }) {
  const color = tone === "income" ? "text-emerald-700" : "text-rose-600"
  return <div className="flex min-h-36 flex-col rounded-xl border border-blue-100 bg-[#f1f7fd] p-3"><div className="flex min-h-9 items-start gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm"><Icon className="h-3.5 w-3.5" /></span><p className="text-[10px] font-medium leading-tight text-slate-600">{label}</p></div><div className="mt-auto text-center"><strong className={`text-base font-medium ${color}`}>{formatPrice(value)}</strong><p className="mt-1 text-[9px] text-slate-400">{count} movimientos</p><p className="mt-2 text-[9px] leading-tight text-slate-400">{detail}</p></div></div>
}

function CashFigure({ label, value, expense = false }: { label: string; value: number; expense?: boolean }) {
  return <div className="px-2 py-3"><p className="text-[8px] uppercase leading-tight tracking-wide text-slate-400">{label}</p><strong className={`mt-1 block text-sm font-medium ${expense ? "text-rose-600" : "text-[#07549f]"}`}>{formatPrice(value)}</strong></div>
}

function BalanceRow({ label, value, positive = false, negative = false, strong = false }: { label: string; value: number; positive?: boolean; negative?: boolean; strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-3 ${strong ? "text-base" : "text-xs"}`}><span className={strong ? "font-medium text-slate-800" : "text-slate-500"}>{label}</span><strong className={positive ? "text-emerald-700" : negative ? "text-rose-600" : "text-slate-800"}>{positive ? "+ " : negative ? "− " : ""}{formatPrice(value)}</strong></div>
}
