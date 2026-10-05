/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useMemo, useState } from "react"
import { BadgeDollarSign, CarFront, ChevronLeft, ChevronRight, Plus, Search, ShoppingBag, UserPlus, Users, X } from "lucide-react"
import { AdminMobileMetrics } from "@/components/admin-mobile-metrics"

type Customer = {
  id: number
  name: string
  phone: string | null
  email: string | null
  vehiclePlate: string | null
  vehicleBrand: string | null
  vehicleModel: string | null
  vehicleYear: number | null
  currentAccountEnabled: boolean
  hasCurrentAccount?: boolean
  _count?: { sales: number; workOrders: number }
}

const empty = { name: "", phone: "", email: "", taxId: "", address: "", vehiclePlate: "", vehicleBrand: "", vehicleModel: "", vehicleYear: "", notes: "", currentAccountEnabled: false }
const rowsPerPage = 8
const inputClass = "h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState(empty)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    const response = await fetch("/api/admin/customers", { cache: "no-store" })
    if (response.ok) setCustomers(await response.json())
  }

  useEffect(() => { void load() }, [])

  useEffect(() => {
    if (!createOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) setCreateOpen(false) }
    window.addEventListener("keydown", closeWithEscape)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeWithEscape) }
  }, [createOpen, saving])

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return customers
    return customers.filter((customer) =>
      `${customer.name} ${customer.phone || ""} ${customer.email || ""} ${customer.vehiclePlate || ""} ${customer.vehicleBrand || ""} ${customer.vehicleModel || ""}`
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [customers, query])

  const totalPages = Math.max(1, Math.ceil(visible.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const rows = visible.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const customersWithVehicle = customers.filter((customer) => customer.vehiclePlate || customer.vehicleBrand || customer.vehicleModel).length
  const currentAccountCustomers = customers.filter((customer) => customer.hasCurrentAccount).length
  const totalOperations = customers.reduce((sum, customer) => sum + (customer._count?.sales || 0) + (customer._count?.workOrders || 0), 0)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    setSaving(true)
    const response = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await response.json()
    if (!response.ok) { setMessage(data.error || "No se pudo guardar."); setSaving(false); return }
    setForm(empty)
    setMessage(data.currentAccountEnabled ? "Cliente con cuenta corriente guardado en la agenda de Ventas." : "Cliente guardado en la agenda de Ventas.")
    setCreateOpen(false)
    setPage(1)
    await load()
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-widest text-primary">CRM del taller</p><h1 className="mt-1 text-2xl font-bold">Clientes y vehículos</h1><p className="mt-1 text-sm text-muted-foreground">Historial centralizado por cliente, teléfono y patente.</p></div>
        <button type="button" onClick={() => { setForm(empty); setMessage(""); setCreateOpen(true) }} className="flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,.16)] transition hover:bg-slate-800"><UserPlus className="h-4 w-4" /> Agregar cliente</button>
      </header>

      <AdminMobileMetrics items={[
        { label: "Clientes", value: customers.length, detail: "Registros activos", icon: Users, tone: "blue" },
        { label: "Con vehículo", value: customersWithVehicle, detail: "Ficha automotor", icon: CarFront, tone: "violet" },
        { label: "Operaciones", value: totalOperations, detail: "Ventas y órdenes", icon: ShoppingBag, tone: "cyan" },
        { label: "Cuenta corriente", value: currentAccountCustomers, detail: "Habilitados en Ventas", icon: BadgeDollarSign, tone: "emerald" },
      ]} />

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Users className="h-4 w-4" /></span>
            <div>
              <h2 className="font-semibold">Clientes</h2>
              <p className="text-xs text-muted-foreground">{visible.length} registro{visible.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
              placeholder="Buscar cliente, teléfono o patente"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1) }}
            />
          </label>
        </div>

        <div className="admin-customer-table-wrap overflow-x-auto">
          <table className="admin-customer-table w-full min-w-[850px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Contacto</th>
                <th className="px-5 py-3 font-semibold">Vehículo</th>
                <th className="px-5 py-3 font-semibold">Patente</th>
                <th className="px-5 py-3 font-semibold">Cuenta</th>
                <th className="px-5 py-3 text-center font-semibold">Ventas</th>
                <th className="px-5 py-3 text-center font-semibold">Órdenes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((customer) => {
                const vehicle = [customer.vehicleBrand, customer.vehicleModel, customer.vehicleYear].filter(Boolean).join(" · ")
                return (
                  <tr key={customer.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/40">
                    <td data-label="Cliente" className="px-5 py-4 font-semibold">{customer.name}</td>
                    <td data-label="Contacto" className="px-5 py-4"><p>{customer.phone || "Sin teléfono"}</p>{customer.email && <p className="mt-0.5 text-xs text-muted-foreground">{customer.email}</p>}</td>
                    <td data-label="Vehículo" className="px-5 py-4 text-muted-foreground">{vehicle || "Vehículo sin completar"}</td>
                    <td data-label="Patente" className="px-5 py-4"><span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">{customer.vehiclePlate || "Sin patente"}</span></td>
                    <td data-label="Cuenta" className="px-5 py-4">{customer.hasCurrentAccount ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><BadgeDollarSign className="h-3.5 w-3.5" /> Corriente</span> : <span className="text-xs text-slate-400">Cliente común</span>}</td>
                    <td data-label="Ventas" className="px-5 py-4 text-center font-semibold">{customer._count?.sales || 0}</td>
                    <td data-label="Órdenes" className="px-5 py-4 text-center font-semibold">{customer._count?.workOrders || 0}</td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No encontramos clientes con esa búsqueda.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Mostrando {visible.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, visible.length)} de {visible.length}</span>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} className="inline-flex h-8 w-8 items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
            <span className="min-w-20 text-center">Página {currentPage} de {totalPages}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      {createOpen && <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/45 p-2 backdrop-blur-md sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setCreateOpen(false) }}>
        <form onSubmit={submit} className="my-auto flex max-h-[calc(100vh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_35px_120px_rgba(15,23,42,.3)] sm:max-h-[calc(100vh-2.5rem)]">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><UserPlus className="h-5 w-5" /></span><div><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-600">Agenda comercial</p><h2 className="text-2xl font-semibold tracking-tight text-slate-950">Agregar cliente</h2><p className="mt-1 text-xs text-slate-500">Quedará disponible inmediatamente en la agenda del módulo Ventas.</p></div></div>
            <button type="button" disabled={saving} onClick={() => setCreateOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200" aria-label="Cerrar"><X className="h-5 w-5" /></button>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-5 sm:p-6">
            <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 sm:p-5">
              <div><h3 className="font-semibold text-slate-950">Datos del cliente</h3><p className="text-xs text-slate-400">El nombre es obligatorio; los demás datos se pueden completar luego.</p></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-xs font-medium text-slate-500">Nombre o razón social *<input autoFocus required className={`${inputClass} mt-1`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nombre completo" /></label>
                <label className="text-xs font-medium text-slate-500">Teléfono<input className={`${inputClass} mt-1`} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Número de contacto" /></label>
                <label className="text-xs font-medium text-slate-500">Correo electrónico<input type="email" className={`${inputClass} mt-1`} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Opcional" /></label>
                <label className="text-xs font-medium text-slate-500">CUIT / DNI<input className={`${inputClass} mt-1`} value={form.taxId} onChange={(event) => setForm({ ...form, taxId: event.target.value })} placeholder="Documento fiscal" /></label>
                <label className="text-xs font-medium text-slate-500 sm:col-span-2">Dirección<input className={`${inputClass} mt-1`} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Domicilio del cliente" /></label>
              </div>
            </section>

            <button type="button" role="switch" aria-checked={form.currentAccountEnabled} onClick={() => setForm({ ...form, currentAccountEnabled: !form.currentAccountEnabled })} className={`flex w-full items-center justify-between gap-4 rounded-[24px] border p-4 text-left transition sm:p-5 ${form.currentAccountEnabled ? "border-emerald-300 bg-emerald-50 shadow-[0_12px_35px_rgba(16,185,129,.1)]" : "border-slate-200 bg-white hover:border-emerald-200"}`}>
              <span className="flex min-w-0 items-center gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${form.currentAccountEnabled ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}><BadgeDollarSign className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-950">Habilitar cuenta corriente</strong><span className="mt-1 block text-xs leading-5 text-slate-500">El cliente seguirá apareciendo entre los clientes comunes y también dentro de “Cuenta corriente” en la agenda de Ventas.</span></span></span>
              <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${form.currentAccountEnabled ? "bg-emerald-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${form.currentAccountEnabled ? "left-6" : "left-1"}`} /></span>
            </button>

            <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 sm:p-5">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><CarFront className="h-5 w-5" /></span><div><h3 className="font-semibold text-slate-950">Vehículo asociado</h3><p className="text-xs text-slate-400">Opcional; facilita encontrar al cliente por patente.</p></div></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs font-medium text-slate-500">Patente<input className={`${inputClass} mt-1 uppercase`} value={form.vehiclePlate} onChange={(event) => setForm({ ...form, vehiclePlate: event.target.value })} placeholder="Ej. AA123BB" /></label>
                <label className="text-xs font-medium text-slate-500">Marca<input className={`${inputClass} mt-1`} value={form.vehicleBrand} onChange={(event) => setForm({ ...form, vehicleBrand: event.target.value })} /></label>
                <label className="text-xs font-medium text-slate-500">Modelo<input className={`${inputClass} mt-1`} value={form.vehicleModel} onChange={(event) => setForm({ ...form, vehicleModel: event.target.value })} /></label>
                <label className="text-xs font-medium text-slate-500">Año<input type="number" min="1900" max="2100" className={`${inputClass} mt-1`} value={form.vehicleYear} onChange={(event) => setForm({ ...form, vehicleYear: event.target.value })} /></label>
              </div>
            </section>

            <label className="block text-xs font-medium text-slate-500">Notas internas<textarea className="mt-1 min-h-24 w-full border border-slate-300 bg-white p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Observaciones, referencias o condiciones comerciales" /></label>
          </div>

          <footer className="flex flex-col-reverse gap-2 border-t border-slate-200/80 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-400">Podrás seleccionarlo desde Ventas, presupuestos y órdenes de taller.</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" disabled={saving} onClick={() => setCreateOpen(false)} className="h-11 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-600">Cancelar</button><button disabled={saving} className="flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />{saving ? "Guardando…" : form.currentAccountEnabled ? "Crear cuenta corriente" : "Guardar cliente"}</button></div>
          </footer>
        </form>
      </div>}

      {message && <p className="fixed bottom-5 right-5 z-[90] max-w-sm rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">{message}</p>}
    </div>
  )
}
