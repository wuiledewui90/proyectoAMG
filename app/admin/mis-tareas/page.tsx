/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock3, RefreshCw, Wrench } from "lucide-react"

type Customer = {
  name: string
  phone: string | null
}

type WorkOrder = {
  id: number
  vehiclePlate: string
  vehicleDescription: string | null
  problem: string
  diagnosis: string | null
  workPerformed: string | null
  status: string
  estimatedDelivery: string | null
  updatedAt: string
  customer: Customer | null
}

type Draft = {
  status: string
  diagnosis: string
  workPerformed: string
}

const statusLabels: Record<string, string> = {
  OPEN: "Ingresada",
  DIAGNOSIS: "En diagnóstico",
  WAITING_PARTS: "Esperando repuestos",
  IN_PROGRESS: "En reparación",
  READY: "Lista para entregar",
  DELIVERED: "Entregada",
  CANCELLED: "Cancelada",
}

const activeStatuses = new Set(["OPEN", "DIAGNOSIS", "WAITING_PARTS", "IN_PROGRESS", "READY"])

export default function MyTasksPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [mechanicName, setMechanicName] = useState("Mecánico")
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [message, setMessage] = useState("")

  async function load() {
    setLoading(true)
    const [ordersResponse, sessionResponse] = await Promise.all([
      fetch("/api/admin/work-orders", { cache: "no-store" }),
      fetch("/api/admin/session", { cache: "no-store" }),
    ])

    if (ordersResponse.ok) {
      const data = (await ordersResponse.json()) as WorkOrder[]
      setOrders(data)
      setDrafts(
        Object.fromEntries(
          data.map((order) => [
            order.id,
            {
              status: order.status,
              diagnosis: order.diagnosis || "",
              workPerformed: order.workPerformed || "",
            },
          ])
        )
      )
    } else {
      setMessage("No se pudieron cargar tus tareas.")
    }

    if (sessionResponse.ok) {
      const session = (await sessionResponse.json()) as { name?: string }
      if (session.name) setMechanicName(session.name)
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const activeOrders = useMemo(
    () => orders.filter((order) => activeStatuses.has(order.status)),
    [orders]
  )
  const readyCount = orders.filter((order) => order.status === "READY").length
  const completedCount = orders.filter((order) => order.status === "DELIVERED").length

  function updateDraft(id: number, changes: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...changes },
    }))
  }

  async function save(order: WorkOrder) {
    const draft = drafts[order.id]
    if (!draft) return

    setSavingId(order.id)
    setMessage("")
    const response = await fetch("/api/admin/work-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, ...draft }),
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      setMessage(data.error || "No se pudo guardar la tarea.")
      setSavingId(null)
      return
    }

    setMessage(`Orden #${order.id} actualizada correctamente.`)
    setSavingId(null)
    await load()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="rounded-xl border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Panel del mecánico</p>
        <h1 className="mt-1 text-2xl font-bold">Hola, {mechanicName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acá podés ver únicamente las órdenes que fueron asignadas a tu usuario.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" /> Tareas activas</div>
          <p className="mt-2 text-3xl font-bold">{activeOrders.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wrench className="h-4 w-4" /> Listas para entregar</div>
          <p className="mt-2 text-3xl font-bold">{readyCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> Entregadas</div>
          <p className="mt-2 text-3xl font-bold">{completedCount}</p>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Mis órdenes asignadas</h2>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
          <RefreshCw className="h-4 w-4" /> Actualizar
        </button>
      </div>

      {message && <p className="rounded-md border bg-card px-4 py-3 text-sm">{message}</p>}

      {loading ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">Cargando tareas...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-bold">No tenés tareas asignadas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Las nuevas órdenes aparecerán aquí cuando el administrador te las asigne.</p>
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => {
            const draft = drafts[order.id]
            if (!draft) return null

            return (
              <article key={order.id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Orden #{order.id}</p>
                    <h3 className="mt-1 text-xl font-bold uppercase">{order.vehiclePlate}</h3>
                    <p className="text-sm text-muted-foreground">{order.vehicleDescription || "Vehículo sin detalle"}</p>
                  </div>
                  <select value={draft.status} onChange={(event) => updateDraft(order.id, { status: event.target.value })} className="rounded-md border px-3 py-2 text-sm font-semibold">
                    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><span className="text-muted-foreground">Cliente:</span> <strong>{order.customer?.name || "Sin registrar"}</strong></div>
                  <div><span className="text-muted-foreground">Teléfono:</span> <strong>{order.customer?.phone || "Sin informar"}</strong></div>
                  <div className="sm:col-span-2 rounded-md bg-muted p-3"><span className="font-semibold">Trabajo solicitado:</span><p className="mt-1">{order.problem}</p></div>
                </div>

                <div className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-sm font-medium">
                    Diagnóstico
                    <textarea value={draft.diagnosis} onChange={(event) => updateDraft(order.id, { diagnosis: event.target.value })} className="min-h-20 rounded-md border p-3 font-normal" placeholder="Escribí el diagnóstico del vehículo" />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Trabajo realizado
                    <textarea value={draft.workPerformed} onChange={(event) => updateDraft(order.id, { workPerformed: event.target.value })} className="min-h-20 rounded-md border p-3 font-normal" placeholder="Detallá las tareas realizadas" />
                  </label>
                </div>

                <button type="button" onClick={() => void save(order)} disabled={savingId === order.id} className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-50">
                  {savingId === order.id ? "Guardando..." : "Guardar avance"}
                </button>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
