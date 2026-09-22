/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ClipboardCheck,
  Eye,
  FilePlus2,
  FileText,
  Plus,
  ReceiptText,
  Search,
  Trash2,
} from "lucide-react"
import { formatPrice } from "@/lib/data"
import { defaultErpSettings, type ErpSettings } from "@/lib/erp-settings"
import {
  documentCode,
  documentStatusLabels,
  documentTypeLabels,
  invoiceStatuses,
  quoteStatuses,
} from "@/lib/documents"

type Customer = {
  id: number
  name: string
  phone: string | null
  email: string | null
  taxId: string | null
  address: string | null
  vehiclePlate: string | null
  vehicleBrand: string | null
  vehicleModel: string | null
  vehicleYear: number | null
}

type Product = {
  id: number
  name: string
  sku: string | null
  price: number
  isActive: boolean
}

type DocumentItem = {
  id: number
  productId: number | null
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
}

type CommercialDocument = {
  id: number
  type: "QUOTE" | "QUOTATION" | "INVOICE"
  status: keyof typeof documentStatusLabels
  customerId: number | null
  customerName: string
  customerTaxId: string | null
  customerPhone: string | null
  customerEmail: string | null
  customerAddress: string | null
  vehicleDescription: string | null
  vehiclePlate: string | null
  issueDate: string
  validUntil: string | null
  dueDate: string | null
  discount: number
  taxRate: number
  notes: string | null
  terms: string | null
  total: number
  items: DocumentItem[]
}

type FormLine = {
  productId: string
  description: string
  quantity: string
  unitPrice: string
}

const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm"
const emptyLine = (): FormLine => ({ productId: "", description: "", quantity: "1", unitPrice: "0" })

function dateInput(daysFromToday = 0) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  return date.toISOString().slice(0, 10)
}

function storedDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ""
}

const emptyForm = (settings: ErpSettings = defaultErpSettings) => ({
  type: "QUOTE" as "QUOTE" | "QUOTATION" | "INVOICE",
  customerId: "",
  customerName: "",
  customerTaxId: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  vehicleDescription: "",
  vehiclePlate: "",
  issueDate: dateInput(),
  validUntil: dateInput(settings.quoteValidityDays),
  dueDate: dateInput(settings.invoiceDueDays),
  discount: "0",
  taxRate: String(settings.defaultTaxRate),
  notes: "",
  terms: settings.defaultTerms || "",
})

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<CommercialDocument[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(emptyForm)
  const [lines, setLines] = useState<FormLine[]>([emptyLine()])
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [settings, setSettings] = useState<ErpSettings>(defaultErpSettings)

  async function load() {
    const [documentsResponse, customersResponse, productsResponse, settingsResponse] = await Promise.all([
      fetch("/api/admin/documents", { cache: "no-store" }),
      fetch("/api/admin/customers", { cache: "no-store" }),
      fetch("/api/products", { cache: "no-store" }),
      fetch("/api/admin/settings", { cache: "no-store" }),
    ])
    if (documentsResponse.ok) setDocuments(await documentsResponse.json())
    if (customersResponse.ok) setCustomers(await customersResponse.json())
    if (productsResponse.ok) setProducts(await productsResponse.json())
    if (settingsResponse.ok) {
      const loadedSettings = (await settingsResponse.json()) as ErpSettings
      setSettings(loadedSettings)
      const requestedId = Number(new URLSearchParams(window.location.search).get("editar"))
      if (!Number.isInteger(requestedId) || requestedId <= 0) {
        const requestedType = new URLSearchParams(window.location.search).get("nuevo")
        const type =
          requestedType === "factura"
            ? "INVOICE"
            : requestedType === "cotizacion"
              ? "QUOTATION"
              : "QUOTE"
        setForm({ ...emptyForm(loadedSettings), type })
      }
    }
  }

  async function loadForEdit(id: number) {
    setMessage("")
    try {
      const response = await fetch(`/api/admin/documents/${id}`, { cache: "no-store" })
      const document = (await response.json().catch(() => null)) as CommercialDocument | { error?: string } | null
      if (!response.ok || !document || !("id" in document)) {
        setMessage((document && "error" in document && document.error) || "No se pudo cargar el comprobante.")
        return
      }
      if (document.status !== "DRAFT") {
        setMessage("Este comprobante ya no está en borrador. Cambialo a borrador para poder editarlo.")
        return
      }
      setEditingId(document.id)
      setForm({
        type: document.type,
        customerId: document.customerId ? String(document.customerId) : "",
        customerName: document.customerName,
        customerTaxId: document.customerTaxId || "",
        customerPhone: document.customerPhone || "",
        customerEmail: document.customerEmail || "",
        customerAddress: document.customerAddress || "",
        vehicleDescription: document.vehicleDescription || "",
        vehiclePlate: document.vehiclePlate || "",
        issueDate: storedDateInput(document.issueDate),
        validUntil: storedDateInput(document.validUntil),
        dueDate: storedDateInput(document.dueDate),
        discount: String(document.discount),
        taxRate: String(document.taxRate),
        notes: document.notes || "",
        terms: document.terms || "",
      })
      setLines(
        document.items.map((item) => ({
          productId: item.productId ? String(item.productId) : "",
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
        }))
      )
    } catch {
      setMessage("No se pudo conectar con el servidor para cargar el comprobante.")
    }
  }

  useEffect(() => {
    void load()
    const requestedId = Number(new URLSearchParams(window.location.search).get("editar"))
    if (Number.isInteger(requestedId) && requestedId > 0) void loadForEdit(requestedId)
  }, [])

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0),
    [lines]
  )
  const discount = Math.min(Math.max(Number(form.discount) || 0, 0), subtotal)
  const taxAmount = (subtotal - discount) * ((Number(form.taxRate) || 0) / 100)
  const total = subtotal - discount + taxAmount

  const visibleDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return documents.filter((document) => {
      const matchesType = typeFilter === "ALL" || document.type === typeFilter
      const matchesQuery =
        !normalized ||
        `${documentCode(document.type, document.id)} ${document.customerName} ${document.vehiclePlate || ""}`
          .toLowerCase()
          .includes(normalized)
      return matchesType && matchesQuery
    })
  }, [documents, query, typeFilter])

  function selectCustomer(value: string) {
    const customer = customers.find((item) => item.id === Number(value))
    setForm((current) => ({
      ...current,
      customerId: value,
      customerName: customer?.name || "",
      customerTaxId: customer?.taxId || "",
      customerPhone: customer?.phone || "",
      customerEmail: customer?.email || "",
      customerAddress: customer?.address || "",
      vehiclePlate: customer?.vehiclePlate || "",
      vehicleDescription: customer
        ? [customer.vehicleBrand, customer.vehicleModel, customer.vehicleYear].filter(Boolean).join(" · ")
        : "",
    }))
  }

  function updateLine(index: number, data: Partial<FormLine>) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...data } : line)))
  }

  function selectProduct(index: number, value: string) {
    const product = products.find((item) => item.id === Number(value))
    updateLine(index, {
      productId: value,
      description: product?.name || "",
      unitPrice: product ? String(product.price) : "0",
    })
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    setSaving(true)
    try {
      const response = await fetch(editingId ? `/api/admin/documents/${editingId}` : "/api/admin/documents", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(editingId ? { action: "update" } : {}), items: lines }),
      })
      const data = (await response.json().catch(() => null)) as { error?: string; id?: number; type?: "QUOTE" | "QUOTATION" | "INVOICE" } | null
      if (!response.ok || !data?.id || !data.type) {
        setMessage(data?.error || "El servidor no pudo crear el comprobante. Recargá la página e intentá nuevamente.")
        return
      }
      setForm(emptyForm(settings))
      setLines([emptyLine()])
      window.location.assign(`/admin/documentos/${data.id}`)
    } catch {
      setMessage("No se pudo conectar con el servidor. Revisá la conexión y volvé a intentar.")
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(document: CommercialDocument, status: string) {
    const response = await fetch(`/api/admin/documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const data = await response.json()
    if (!response.ok) {
      setMessage(data.error || "No se pudo cambiar el estado.")
      return
    }
    setDocuments((current) => current.map((item) => (item.id === document.id ? data : item)))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="rounded-xl border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Documentación comercial</p>
        <h1 className="mt-1 text-2xl font-bold">Presupuestos, cotizaciones y facturas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Prepará comprobantes detallados, hacé seguimiento y entregalos impresos o en PDF.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FilePlus2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">{editingId ? `Editando ${documentCode(form.type, editingId)}` : "Nuevo comprobante"}</h2>
              <p className="text-xs text-muted-foreground">{editingId ? "Modificá los datos y guardá los cambios." : "Los datos quedan guardados como fueron emitidos."}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={editingId !== null}
              onClick={() => setForm((current) => ({ ...current, type: "QUOTE" }))}
              className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed ${form.type === "QUOTE" ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <FileText className="h-4 w-4" /> Presupuesto
            </button>
            <button
              type="button"
              disabled={editingId !== null}
              onClick={() => setForm((current) => ({ ...current, type: "QUOTATION" }))}
              className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed ${form.type === "QUOTATION" ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <ClipboardCheck className="h-4 w-4" /> Cotización
            </button>
            <button
              type="button"
              disabled={editingId !== null}
              onClick={() => setForm((current) => ({ ...current, type: "INVOICE" }))}
              className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed ${form.type === "INVOICE" ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <ReceiptText className="h-4 w-4" /> Factura
            </button>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Cliente y vehículo</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-medium text-muted-foreground">
              Cliente registrado
              <select className={`${inputClass} mt-1`} value={form.customerId} onChange={(event) => selectCustomer(event.target.value)}>
                <option value="">Completar manualmente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}{customer.vehiclePlate ? ` · ${customer.vehiclePlate}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Nombre o razón social (opcional)
              <input className={`${inputClass} mt-1`} value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} placeholder="Consumidor final" />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              CUIT / DNI
              <input className={`${inputClass} mt-1`} value={form.customerTaxId} onChange={(event) => setForm({ ...form, customerTaxId: event.target.value })} />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Teléfono
              <input className={`${inputClass} mt-1`} value={form.customerPhone} onChange={(event) => setForm({ ...form, customerPhone: event.target.value })} />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Correo
              <input type="email" className={`${inputClass} mt-1`} value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Dirección
              <input className={`${inputClass} mt-1`} value={form.customerAddress} onChange={(event) => setForm({ ...form, customerAddress: event.target.value })} />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Vehículo
              <input className={`${inputClass} mt-1`} value={form.vehicleDescription} onChange={(event) => setForm({ ...form, vehicleDescription: event.target.value })} />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Patente
              <input className={`${inputClass} mt-1 uppercase`} value={form.vehiclePlate} onChange={(event) => setForm({ ...form, vehiclePlate: event.target.value })} />
            </label>
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          Si ingresás un nombre, el cliente se guardará automáticamente en la agenda. Si dejás todos los datos vacíos, el comprobante se emitirá como Consumidor final.
        </p>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Detalle</h3>
            <button type="button" onClick={() => setLines((current) => [...current, emptyLine()])} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-muted">
              <Plus className="h-4 w-4" /> Agregar ítem
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1.1fr_2fr_100px_140px_44px] md:items-end">
                <label className="text-xs font-medium text-muted-foreground">
                  Producto opcional
                  <select className={`${inputClass} mt-1`} value={line.productId} onChange={(event) => selectProduct(index, event.target.value)}>
                    <option value="">Ítem libre / servicio</option>
                    {products.filter((product) => product.isActive).map((product) => (
                      <option key={product.id} value={product.id}>{product.name}{product.sku ? ` · ${product.sku}` : ""}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Descripción *
                  <input className={`${inputClass} mt-1`} value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} required />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Cantidad
                  <input type="number" min="0.01" step="0.01" className={`${inputClass} mt-1`} value={line.quantity} onChange={(event) => updateLine(index, { quantity: event.target.value })} required />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Precio unitario
                  <input type="number" min="0" step="0.01" className={`${inputClass} mt-1`} value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: event.target.value })} required />
                </label>
                <button type="button" aria-label="Eliminar ítem" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="flex h-10 w-10 items-center justify-center rounded-md border text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-30">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted-foreground">
              Fecha de emisión
              <input type="date" className={`${inputClass} mt-1`} value={form.issueDate} onChange={(event) => setForm({ ...form, issueDate: event.target.value })} />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              {form.type === "INVOICE" ? "Fecha de vencimiento" : "Válido hasta"}
              <input type="date" className={`${inputClass} mt-1`} value={form.type === "INVOICE" ? form.dueDate : form.validUntil} onChange={(event) => setForm({ ...form, [form.type === "INVOICE" ? "dueDate" : "validUntil"]: event.target.value })} />
            </label>
            <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
              Observaciones para el cliente
              <textarea className={`${inputClass} mt-1 min-h-20`} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </label>
            <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
              Condiciones
              <textarea className={`${inputClass} mt-1 min-h-20`} value={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.value })} />
            </label>
          </section>

          <aside className="rounded-lg bg-muted p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <label className="flex items-center justify-between gap-3">
                <span>Descuento</span>
                <input type="number" min="0" step="0.01" className="w-32 rounded-md border bg-background px-2 py-1 text-right" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>IVA / impuesto %</span>
                <input type="number" min="0" max="100" step="0.01" className="w-32 rounded-md border bg-background px-2 py-1 text-right" value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: event.target.value })} />
              </label>
              <div className="flex items-center justify-between"><span>Impuestos</span><strong>{formatPrice(taxAmount)}</strong></div>
              <div className="flex items-center justify-between border-t pt-3 text-lg"><span className="font-bold">Total</span><strong className="text-primary">{formatPrice(total)}</strong></div>
            </div>
            <button disabled={saving || subtotal <= 0} className="mt-4 w-full rounded-md bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-40">
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : `Crear ${documentTypeLabels[form.type].toLowerCase()}`}
            </button>
            {editingId && <Link href={`/admin/documentos/${editingId}`} className="mt-2 block text-center text-xs font-semibold text-muted-foreground hover:text-foreground">Cancelar edición</Link>}
            {form.type === "INVOICE" && <p className="mt-2 text-xs text-muted-foreground">Comprobante interno; no genera CAE ni reemplaza la factura electrónica de ARCA.</p>}
          </aside>
        </div>
        {message && <p className="rounded-md bg-muted px-3 py-2 text-sm">{message}</p>}
      </form>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">Comprobantes emitidos ({visibleDocuments.length})</h2>
            <p className="text-xs text-muted-foreground">Actualizá el estado o abrí la hoja de entrega.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="ALL">Todos</option>
              <option value="QUOTE">Presupuestos</option>
              <option value="QUOTATION">Cotizaciones</option>
              <option value="INVOICE">Facturas</option>
            </select>
            <label className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input className="rounded-md border bg-background py-2 pl-9 pr-3 text-sm" placeholder="Buscar cliente, patente o Nº" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr><th className="p-3">Comprobante</th><th className="p-3">Fecha</th><th className="p-3">Cliente</th><th className="p-3">Estado</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Acción</th></tr>
            </thead>
            <tbody>
              {visibleDocuments.map((document) => {
                const statuses = document.type === "INVOICE" ? invoiceStatuses : quoteStatuses
                return (
                  <tr key={document.id} className="border-t">
                    <td className="p-3"><p className="font-semibold">{documentCode(document.type, document.id)}</p><p className="text-xs text-muted-foreground">{documentTypeLabels[document.type]}</p></td>
                    <td className="p-3">{new Date(document.issueDate).toLocaleDateString("es-AR")}</td>
                    <td className="p-3"><p className="font-medium">{document.customerName}</p>{document.vehiclePlate && <p className="text-xs text-muted-foreground">{document.vehiclePlate}</p>}</td>
                    <td className="p-3">
                      <select className="rounded-md border bg-background px-2 py-1 text-xs" value={document.status} onChange={(event) => void changeStatus(document, event.target.value)}>
                        {statuses.map((status) => <option key={status} value={status}>{documentStatusLabels[status]}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-right font-bold">{formatPrice(document.total)}</td>
                    <td className="p-3 text-right"><Link href={`/admin/documentos/${document.id}`} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 font-semibold hover:bg-muted"><Eye className="h-4 w-4" /> Ver / imprimir</Link></td>
                  </tr>
                )
              })}
              {!visibleDocuments.length && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No hay comprobantes que coincidan.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
