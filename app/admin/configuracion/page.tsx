"use client"

import { useEffect, useState } from "react"
import { Building2, FileText, Save, Settings } from "lucide-react"
import { defaultErpSettings, type ErpSettings } from "@/lib/erp-settings"

const inputClass =
  "mt-1.5 min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"

export default function ConfigurationPage() {
  const [form, setForm] = useState<ErpSettings>(defaultErpSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/settings", { cache: "no-store" })
        const data = (await response.json().catch(() => null)) as
          | ErpSettings
          | { error?: string }
          | null

        if (!response.ok || !data || !("businessName" in data)) {
          setError((data && "error" in data && data.error) || "No se pudo cargar la configuración.")
          return
        }
        setForm(data)
      } catch {
        setError("No se pudo conectar con el servidor.")
      } finally {
        setLoading(false)
      }
    }

    void loadSettings()
  }, [])

  function update<K extends keyof ErpSettings>(field: K, value: ErpSettings[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await response.json().catch(() => null)) as
        | ErpSettings
        | { error?: string }
        | null

      if (!response.ok || !data || !("businessName" in data)) {
        setError((data && "error" in data && data.error) || "No se pudo guardar la configuración.")
        return
      }

      setForm(data)
      setMessage("Configuración guardada correctamente.")
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <Settings className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Sistema</p>
            <h1 className="mt-1 text-2xl font-bold">Configuración</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Administrá los datos del negocio y los valores predeterminados de los comprobantes.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={save} className="space-y-5">
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-5 flex items-center gap-2 border-b pb-4">
            <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Datos del negocio</h2>
              <p className="text-xs text-muted-foreground">
                Esta información se usa en presupuestos y facturas.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Nombre del negocio
              <input
                className={inputClass}
                value={form.businessName}
                onChange={(event) => update("businessName", event.target.value)}
                maxLength={160}
                required
              />
            </label>
            <label className="text-sm font-medium">
              Descripción breve
              <input
                className={inputClass}
                value={form.tagline || ""}
                onChange={(event) => update("tagline", event.target.value || null)}
                maxLength={191}
                placeholder="Especialistas en refrigeración automotor"
              />
            </label>
            <label className="text-sm font-medium">
              CUIT / identificación fiscal
              <input
                className={inputClass}
                value={form.taxId || ""}
                onChange={(event) => update("taxId", event.target.value || null)}
                maxLength={40}
              />
            </label>
            <label className="text-sm font-medium">
              Teléfono
              <input
                className={inputClass}
                value={form.phone || ""}
                onChange={(event) => update("phone", event.target.value || null)}
                maxLength={40}
              />
            </label>
            <label className="text-sm font-medium">
              Correo electrónico
              <input
                className={inputClass}
                type="email"
                value={form.email || ""}
                onChange={(event) => update("email", event.target.value || null)}
                maxLength={191}
              />
            </label>
            <label className="text-sm font-medium">
              Número de WhatsApp
              <input
                className={inputClass}
                value={form.whatsapp || ""}
                onChange={(event) => update("whatsapp", event.target.value || null)}
                maxLength={40}
                placeholder="5493804524590"
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Dirección
              <input
                className={inputClass}
                value={form.address || ""}
                onChange={(event) => update("address", event.target.value || null)}
                maxLength={255}
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <div className="mb-5 flex items-center gap-2 border-b pb-4">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Presupuestos y facturas</h2>
              <p className="text-xs text-muted-foreground">
                Se aplican automáticamente al crear un comprobante nuevo.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium">
              Validez del presupuesto
              <div className="relative">
                <input
                  className={`${inputClass} pr-14`}
                  type="number"
                  min={1}
                  max={365}
                  value={form.quoteValidityDays}
                  onChange={(event) => update("quoteValidityDays", Number(event.target.value))}
                  required
                />
                <span className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-xs text-muted-foreground">días</span>
              </div>
            </label>
            <label className="text-sm font-medium">
              Vencimiento de factura
              <div className="relative">
                <input
                  className={`${inputClass} pr-14`}
                  type="number"
                  min={0}
                  max={365}
                  value={form.invoiceDueDays}
                  onChange={(event) => update("invoiceDueDays", Number(event.target.value))}
                  required
                />
                <span className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-xs text-muted-foreground">días</span>
              </div>
            </label>
            <label className="text-sm font-medium">
              IVA / impuesto predeterminado
              <div className="relative">
                <input
                  className={`${inputClass} pr-9`}
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.defaultTaxRate}
                  onChange={(event) => update("defaultTaxRate", Number(event.target.value))}
                  required
                />
                <span className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </label>
            <label className="text-sm font-medium sm:col-span-3">
              Condiciones predeterminadas
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={form.defaultTerms || ""}
                onChange={(event) => update("defaultTerms", event.target.value || null)}
                maxLength={5000}
              />
            </label>
          </div>
        </section>

        {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</p> : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || saving}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {loading ? "Cargando..." : saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </form>
    </div>
  )
}
