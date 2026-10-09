/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Tags, X } from "lucide-react"

import { formatPrice } from "@/lib/data"

type Expense = {
  id: number
  category: string
  description: string
  amount: number
  paymentMethod: string
  expenseDate: string
  createdBy: { name: string } | null
}

const defaultCategories = ["Repuestos", "Insumos", "Servicios", "Herramientas", "Impuestos", "Otros"]
const payments: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  MERCADO_PAGO: "Mercado Pago",
  CURRENT_ACCOUNT: "Cuenta corriente",
}

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([])
  const [categories, setCategories] = useState(defaultCategories)
  const [message, setMessage] = useState("")
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [categoryError, setCategoryError] = useState("")
  const [savingCategory, setSavingCategory] = useState(false)
  const [form, setForm] = useState({
    category: "Repuestos",
    description: "",
    amount: "",
    paymentMethod: "CASH",
    expenseDate: new Date().toISOString().slice(0, 10),
  })

  async function load() {
    const [expensesResponse, categoriesResponse] = await Promise.all([
      fetch("/api/admin/expenses", { cache: "no-store" }),
      fetch("/api/admin/expense-categories", { cache: "no-store" }),
    ])
    if (expensesResponse.ok) setItems(await expensesResponse.json())
    if (categoriesResponse.ok) {
      const loadedCategories = (await categoriesResponse.json()) as string[]
      if (loadedCategories.length) setCategories(loadedCategories)
    }
  }

  useEffect(() => { void load() }, [])

  useEffect(() => {
    if (!categoryModalOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !savingCategory) setCategoryModalOpen(false)
    }
    window.addEventListener("keydown", closeWithEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeWithEscape)
    }
  }, [categoryModalOpen, savingCategory])

  const total = useMemo(() => items.reduce((sum, expense) => sum + expense.amount, 0), [items])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    const response = await fetch("/api/admin/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await response.json()
    if (!response.ok) return setMessage(data.error || "No se pudo guardar.")
    setForm((current) => ({ ...current, description: "", amount: "" }))
    setMessage("Gasto registrado.")
    void load()
  }

  function openCategoryModal() {
    setNewCategory("")
    setCategoryError("")
    setCategoryModalOpen(true)
  }

  async function createCategory(event: React.FormEvent) {
    event.preventDefault()
    setCategoryError("")
    setSavingCategory(true)
    try {
      const response = await fetch("/api/admin/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) return setCategoryError(data.error || "No se pudo crear la categoría.")

      const createdName = String(data.name)
      setCategories((current) =>
        [...new Set([...current, createdName])].sort((left, right) => left.localeCompare(right, "es"))
      )
      setForm((current) => ({ ...current, category: createdName }))
      setCategoryModalOpen(false)
      setMessage(`Categoría “${createdName}” creada y seleccionada.`)
    } finally {
      setSavingCategory(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Control financiero</p><h1 className="mt-1 text-2xl font-bold">Gastos</h1><p className="mt-1 text-sm text-muted-foreground">Compras, servicios y costos operativos.</p></div>
        <p className="text-2xl font-bold">{formatPrice(total)}</p>
      </header>

      <form onSubmit={submit} className="grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-2 xl:grid-cols-5">
        <div className="flex min-w-0 gap-2">
          <select aria-label="Categoría del gasto" className="min-w-0 flex-1 rounded-md border p-2" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <button type="button" onClick={openCategoryModal} className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-primary/25 bg-primary/5 px-3 text-xs font-semibold text-primary transition hover:bg-primary/10"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Nueva</span></button>
        </div>
        <input className="rounded-md border p-2 xl:col-span-2" placeholder="Descripción" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        <input className="rounded-md border p-2" type="number" min="0" step="0.01" placeholder="Importe" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
        <select className="rounded-md border p-2" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}>{Object.entries(payments).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground xl:col-span-5">Registrar gasto</button>
        {message && <p className="text-sm xl:col-span-5" role="status">{message}</p>}
      </form>

      <section className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-3">Fecha</th><th className="p-3">Categoría</th><th className="p-3">Detalle</th><th className="p-3">Pago</th><th className="p-3 text-right">Importe</th></tr></thead><tbody>{items.map((expense) => <tr key={expense.id} className="border-t"><td className="p-3">{new Date(expense.expenseDate).toLocaleDateString("es-AR")}</td><td className="p-3">{expense.category}</td><td className="p-3 font-medium">{expense.description}</td><td className="p-3">{payments[expense.paymentMethod] || expense.paymentMethod}</td><td className="p-3 text-right font-bold">{formatPrice(expense.amount)}</td></tr>)}</tbody></table></div></section>

      {categoryModalOpen && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="expense-category-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingCategory) setCategoryModalOpen(false) }}>
          <form onSubmit={createCategory} className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white text-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Tags className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Organización</p><h2 id="expense-category-title" className="text-xl font-bold">Nueva categoría</h2></div></div><button type="button" disabled={savingCategory} onClick={() => setCategoryModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Cerrar"><X className="h-5 w-5" /></button></div>
            <div className="p-5"><label className="text-sm font-medium text-slate-700">Nombre de la categoría<input autoFocus required minLength={2} maxLength={80} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" value={newCategory} onChange={(event) => { setNewCategory(event.target.value); setCategoryError("") }} placeholder="Ej.: Alquiler, combustible o publicidad" /></label>{categoryError && <p className="mt-3 text-sm font-medium text-rose-600" role="alert">{categoryError}</p>}<p className="mt-3 text-xs text-slate-500">Quedará guardada y disponible para los próximos gastos en todos tus dispositivos.</p></div>
            <div className="grid gap-2 border-t border-slate-200 p-5 sm:grid-cols-2"><button type="button" disabled={savingCategory} onClick={() => setCategoryModalOpen(false)} className="h-11 rounded-xl border border-slate-200 font-semibold text-slate-600">Cancelar</button><button disabled={savingCategory} className="h-11 rounded-xl bg-slate-950 font-semibold text-white disabled:opacity-50">{savingCategory ? "Guardando…" : "Crear categoría"}</button></div>
          </form>
        </div>
      )}
    </div>
  )
}
