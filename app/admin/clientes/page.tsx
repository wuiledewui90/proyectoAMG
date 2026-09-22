/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react"

type Customer = {
  id: number
  name: string
  phone: string | null
  email: string | null
  vehiclePlate: string | null
  vehicleBrand: string | null
  vehicleModel: string | null
  vehicleYear: number | null
  _count?: { sales: number; workOrders: number }
}

const empty = { name: "", phone: "", email: "", taxId: "", address: "", vehiclePlate: "", vehicleBrand: "", vehicleModel: "", vehicleYear: "", notes: "" }
const rowsPerPage = 8

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState(empty)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState("")

  async function load() {
    const response = await fetch("/api/admin/customers", { cache: "no-store" })
    if (response.ok) setCustomers(await response.json())
  }

  useEffect(() => { void load() }, [])

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

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    const response = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await response.json()
    if (!response.ok) return setMessage(data.error || "No se pudo guardar.")
    setForm(empty)
    setMessage("Cliente guardado.")
    setPage(1)
    void load()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="rounded-xl border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">CRM del taller</p>
        <h1 className="mt-1 text-2xl font-bold">Clientes y vehículos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historial centralizado por cliente, teléfono y patente.</p>
      </header>

      <form onSubmit={submit} className="grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
        <input className="rounded-md border px-3 py-2" placeholder="Nombre *" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <input className="rounded-md border px-3 py-2" placeholder="Teléfono" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <input className="rounded-md border px-3 py-2" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="rounded-md border px-3 py-2 uppercase" placeholder="Patente" value={form.vehiclePlate} onChange={(event) => setForm({ ...form, vehiclePlate: event.target.value })} />
        <input className="rounded-md border px-3 py-2" placeholder="Marca" value={form.vehicleBrand} onChange={(event) => setForm({ ...form, vehicleBrand: event.target.value })} />
        <input className="rounded-md border px-3 py-2" placeholder="Modelo" value={form.vehicleModel} onChange={(event) => setForm({ ...form, vehicleModel: event.target.value })} />
        <input className="rounded-md border px-3 py-2" type="number" placeholder="Año" value={form.vehicleYear} onChange={(event) => setForm({ ...form, vehicleYear: event.target.value })} />
        <button className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Agregar cliente</button>
        {message && <p className="text-sm sm:col-span-2 lg:col-span-4">{message}</p>}
      </form>

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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Contacto</th>
                <th className="px-5 py-3 font-semibold">Vehículo</th>
                <th className="px-5 py-3 font-semibold">Patente</th>
                <th className="px-5 py-3 text-center font-semibold">Ventas</th>
                <th className="px-5 py-3 text-center font-semibold">Órdenes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((customer) => {
                const vehicle = [customer.vehicleBrand, customer.vehicleModel, customer.vehicleYear].filter(Boolean).join(" · ")
                return (
                  <tr key={customer.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/40">
                    <td className="px-5 py-4 font-semibold">{customer.name}</td>
                    <td className="px-5 py-4"><p>{customer.phone || "Sin teléfono"}</p>{customer.email && <p className="mt-0.5 text-xs text-muted-foreground">{customer.email}</p>}</td>
                    <td className="px-5 py-4 text-muted-foreground">{vehicle || "Vehículo sin completar"}</td>
                    <td className="px-5 py-4"><span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">{customer.vehiclePlate || "Sin patente"}</span></td>
                    <td className="px-5 py-4 text-center font-semibold">{customer._count?.sales || 0}</td>
                    <td className="px-5 py-4 text-center font-semibold">{customer._count?.workOrders || 0}</td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No encontramos clientes con esa búsqueda.</td></tr>
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
    </div>
  )
}
