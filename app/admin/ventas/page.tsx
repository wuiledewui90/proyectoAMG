/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Loader2,
  ReceiptText,
  Trash2,
  Wrench,
  X,
} from "lucide-react"
import { formatPrice } from "@/lib/data"
import { defaultErpSettings, type ErpSettings } from "@/lib/erp-settings"
import { CustomerPickerModal } from "@/components/customer-picker-modal"

type Product = {
  id: number
  name: string
  sku: string | null
  price: number
  stock: number
  isActive: boolean
  category: string | null
  stockType: string | null
  stockCategory: string | null
}

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
  hasCurrentAccount?: boolean
}

type Sale = {
  id: number
  subtotal: number
  discount: number
  taxRate: number
  taxAmount: number
  cardInstallments?: number | null
  cardSurchargeRate?: number
  cardSurchargeAmount?: number
  total: number
  paymentMethod: string
  status: string
  createdAt: string
  voidReason?: string | null
  voidedAt?: string | null
  voidedBy?: { id: string; name: string } | null
  customer: Customer | null
  items: { productName: string; quantity: number }[]
  payments: { method: string; amount: number }[]
}

type InvoiceMode = "INTERNAL" | "ARCA"
type OperationType = "SALE" | "QUOTE" | "QUOTATION"
type PaymentMethod = "CASH" | "TRANSFER" | "CARD" | "MERCADO_PAGO" | "CURRENT_ACCOUNT"
type PaymentSplit = { id: number; method: PaymentMethod; amount: string; reference: string }
type CatalogGroup = "PRODUCTS" | "SERVICES" | "LABOR"
type LaborLine = {
  id: number
  description: string
  quantity: number
  unitPrice: string
}

const payLabels: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  MERCADO_PAGO: "Mercado Pago",
  CURRENT_ACCOUNT: "Cuenta corriente",
  COMBINED: "Pago combinado",
}

const payableMethods = Object.entries(payLabels).filter(
  ([value]) => value !== "COMBINED"
) as Array<[PaymentMethod, string]>

const initialPaymentSplits = (): PaymentSplit[] => [
  { id: 1, method: "CASH", amount: "", reference: "" },
  { id: 2, method: "TRANSFER", amount: "", reference: "" },
]

const arcaUrl = "https://www.arca.gob.ar/"
const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm"

function dateInput(daysFromToday = 0) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  return date.toISOString().slice(0, 10)
}

function openInNewTab(url: string) {
  const popup = window.open(url, "_blank")
  if (!popup) return false
  popup.opener = null
  return true
}

function isService(product: Product) {
  return `${product.stockType || ""} ${product.category || ""} ${product.stockCategory || ""}`
    .toLowerCase()
    .includes("servicio")
}

function catalogCategory(product: Product) {
  return product.stockCategory?.trim() || product.category?.trim() || "SIN CATEGORÍA"
}

async function loadAllActiveProducts() {
  const response = await fetch("/api/admin/product-picker", { cache: "no-store" })
  return response.ok ? ((await response.json()) as Product[]) : null
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [cart, setCart] = useState<Record<number, number>>({})
  const [linePrices, setLinePrices] = useState<Record<number, string>>({})
  const [catalogGroup, setCatalogGroup] = useState<CatalogGroup>("PRODUCTS")
  const [laborLines, setLaborLines] = useState<LaborLine[]>([])
  const [laborDescription, setLaborDescription] = useState("")
  const [laborPrice, setLaborPrice] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerTaxId, setCustomerTaxId] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [vehicleDescription, setVehicleDescription] = useState("")
  const [vehiclePlate, setVehiclePlate] = useState("")
  const [saveCustomer, setSaveCustomer] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [paymentReference, setPaymentReference] = useState("")
  const [cardInstallments, setCardInstallments] = useState(
    String(defaultErpSettings.cardInstallmentRates[0].installments)
  )
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>(initialPaymentSplits)
  const [discount, setDiscount] = useState("0")
  const [taxRate, setTaxRate] = useState(String(defaultErpSettings.defaultTaxRate))
  const [issueDate, setIssueDate] = useState(dateInput())
  const [validUntil, setValidUntil] = useState(
    dateInput(defaultErpSettings.quoteValidityDays)
  )
  const [notes, setNotes] = useState("")
  const [terms, setTerms] = useState(defaultErpSettings.defaultTerms || "")
  const [settings, setSettings] = useState<ErpSettings>(defaultErpSettings)
  const [query, setQuery] = useState("")
  const [openCatalogCategories, setOpenCatalogCategories] = useState<Record<string, boolean>>({})
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false)
  const [mobileAddedItem, setMobileAddedItem] = useState<string | null>(null)
  const [mobileCatalogError, setMobileCatalogError] = useState("")
  const [message, setMessage] = useState("")
  const [workingAction, setWorkingAction] = useState<"QUOTE" | "QUOTATION" | "SALE" | null>(null)
  const [operationType, setOperationType] = useState<OperationType>("SALE")
  const [saleToInvoice, setSaleToInvoice] = useState<Sale | null>(null)
  const [invoiceMode, setInvoiceMode] = useState<InvoiceMode>("INTERNAL")
  const [invoicing, setInvoicing] = useState(false)
  const [voidingId, setVoidingId] = useState<number | null>(null)
  const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null)
  const [voidReason, setVoidReason] = useState("")
  const [voidError, setVoidError] = useState("")

  async function load() {
    const [loadedProducts, customersResponse, salesResponse, settingsResponse] = await Promise.all([
      loadAllActiveProducts(),
      fetch("/api/admin/customers", { cache: "no-store" }),
      fetch("/api/admin/sales", { cache: "no-store" }),
      fetch("/api/admin/settings", { cache: "no-store" }),
    ])
    if (loadedProducts) setProducts(loadedProducts)
    if (customersResponse.ok) setCustomers(await customersResponse.json())
    if (salesResponse.ok) setSales(await salesResponse.json())
    if (settingsResponse.ok) {
      const loadedSettings = (await settingsResponse.json()) as ErpSettings
      setSettings(loadedSettings)
      setTaxRate(String(loadedSettings.defaultTaxRate))
      setCardInstallments(String(loadedSettings.cardInstallmentRates[0]?.installments ?? 1))
      setValidUntil(dateInput(loadedSettings.quoteValidityDays))
      setTerms(loadedSettings.defaultTerms || "")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isActive &&
          (catalogGroup === "SERVICES" ? isService(product) : catalogGroup === "PRODUCTS" ? !isService(product) : false) &&
          `${product.name} ${product.sku || ""}`
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [catalogGroup, products, query]
  )

  const productsByCategory = useMemo(() => {
    const grouped = new Map<string, Product[]>()
    visibleProducts.forEach((product) => {
      const category = catalogCategory(product)
      grouped.set(category, [...(grouped.get(category) || []), product])
    })
    return [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right, "es"))
      .map(([category, items]) => ({
        category,
        items: [...items].sort((left, right) => left.name.localeCompare(right.name, "es")),
      }))
  }, [visibleProducts])

  const selectedProducts = useMemo(
    () => products.filter((product) => (cart[product.id] || 0) > 0),
    [cart, products]
  )
  const subtotal = selectedProducts.reduce(
    (sum, product) =>
      sum +
      (cart[product.id] || 0) *
        (isService(product) ? Number(linePrices[product.id]) || 0 : product.price),
    laborLines.reduce(
      (sum, line) => sum + line.quantity * (Number(line.unitPrice) || 0),
      0
    )
  )
  const appliedDiscount = Math.min(
    Math.max(Number(discount) || 0, 0),
    subtotal
  )
  const taxAmount =
    (subtotal - appliedDiscount) *
    (Math.min(Math.max(Number(taxRate) || 0, 0), 100) / 100)
  const totalBeforeCardSurcharge = subtotal - appliedDiscount + taxAmount
  const selectedCardPlan = settings.cardInstallmentRates.find(
    (plan) => plan.installments === Number(cardInstallments)
  ) ?? settings.cardInstallmentRates[0]
  const cardSurchargeRate =
    operationType === "SALE" && paymentMethod === "CARD"
      ? selectedCardPlan?.surchargeRate || 0
      : 0
  const cardSurchargeAmount =
    Math.round(totalBeforeCardSurcharge * (cardSurchargeRate / 100) * 100) / 100
  const total = Math.round((totalBeforeCardSurcharge + cardSurchargeAmount) * 100) / 100
  const combinedDistributed = paymentSplits.reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0
  )
  const combinedRemaining = total - combinedDistributed
  const combinedPaymentValid =
    paymentMethod !== "COMBINED" ||
    (paymentSplits.length >= 2 &&
      paymentSplits.every((payment) => Number(payment.amount) > 0) &&
      new Set(paymentSplits.map((payment) => payment.method)).size ===
        paymentSplits.length &&
      Math.abs(combinedRemaining) <= 0.01)

  function changePaymentMethod(value: string) {
    setPaymentMethod(value)
    if (value === "CARD" && !settings.cardInstallmentRates.some((plan) => plan.installments === Number(cardInstallments))) {
      setCardInstallments(String(settings.cardInstallmentRates[0]?.installments ?? 1))
    }
    if (value === "COMBINED") {
      const firstAmount = Math.round((total / 2) * 100) / 100
      setPaymentSplits([
        { id: 1, method: "CASH", amount: String(firstAmount), reference: "" },
        {
          id: 2,
          method: "TRANSFER",
          amount: String(Math.round((total - firstAmount) * 100) / 100),
          reference: "",
        },
      ])
    }
  }

  function updatePaymentSplit(id: number, change: Partial<Omit<PaymentSplit, "id">>) {
    setPaymentSplits((current) =>
      current.map((payment) =>
        payment.id === id ? { ...payment, ...change } : payment
      )
    )
  }

  function addPaymentSplit() {
    const nextMethod = payableMethods.find(
      ([method]) => !paymentSplits.some((payment) => payment.method === method)
    )?.[0]
    if (!nextMethod) return
    setPaymentSplits((current) => [
      ...current,
      {
        id: Math.max(...current.map((payment) => payment.id)) + 1,
        method: nextMethod,
        amount: "",
        reference: "",
      },
    ])
  }

  function completeCombinedBalance() {
    setPaymentSplits((current) => {
      if (!current.length) return current
      const otherTotal = current
        .slice(0, -1)
        .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
      return current.map((payment, index) =>
        index === current.length - 1
          ? {
              ...payment,
              amount: String(Math.max(0, Math.round((total - otherTotal) * 100) / 100)),
            }
          : payment
      )
    })
  }

  function selectCustomer(value: string) {
    const customer = customers.find((item) => item.id === Number(value))
    setCustomerId(value)
    setCustomerName(customer?.name || "")
    setCustomerTaxId(customer?.taxId || "")
    setCustomerPhone(customer?.phone || "")
    setCustomerEmail(customer?.email || "")
    setCustomerAddress(customer?.address || "")
    setVehiclePlate(customer?.vehiclePlate || "")
    setVehicleDescription(
      customer
        ? [customer.vehicleBrand, customer.vehicleModel, customer.vehicleYear]
            .filter(Boolean)
            .join(" · ")
        : ""
    )
  }

  function customerPayload() {
    return {
      customerId: customerId || null,
      customerName: customerName.trim() || "Consumidor final",
      customerTaxId,
      customerPhone,
      customerEmail,
      customerAddress,
      vehicleDescription,
      vehiclePlate,
      saveCustomer,
    }
  }

  function resetSaleForm() {
    setCart({})
    setLinePrices({})
    setLaborLines([])
    setLaborDescription("")
    setLaborPrice("")
    setCustomerId("")
    setCustomerName("")
    setCustomerTaxId("")
    setCustomerPhone("")
    setCustomerEmail("")
    setCustomerAddress("")
    setVehicleDescription("")
    setVehiclePlate("")
    setSaveCustomer(false)
    setPaymentMethod("CASH")
    setPaymentReference("")
    setCardInstallments(String(settings.cardInstallmentRates[0]?.installments ?? 1))
    setPaymentSplits(initialPaymentSplits())
    setDiscount("0")
    setTaxRate(String(settings.defaultTaxRate))
    setIssueDate(dateInput())
    setValidUntil(dateInput(settings.quoteValidityDays))
    setNotes("")
    setTerms(settings.defaultTerms || "")
  }

  function add(product: Product) {
    if (!isService(product) && (cart[product.id] || 0) >= product.stock) return
    if (isService(product) && linePrices[product.id] === undefined) {
      setLinePrices((current) => ({ ...current, [product.id]: String(product.price) }))
    }
    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] || 0) + 1,
    }))
  }

  function addFromMobileCatalog(product: Product) {
    if (!isService(product) && (cart[product.id] || 0) >= product.stock) return
    add(product)
    setMobileCatalogOpen(false)
    setMobileAddedItem(product.name)
  }

  function toggleCatalogCategory(category: string) {
    setOpenCatalogCategories((current) => ({
      ...current,
      [category]: !current[category],
    }))
  }

  function changeQuantity(productId: number, quantity: number) {
    setCart((current) => ({ ...current, [productId]: Math.max(0, quantity) }))
  }

  function removeProduct(productId: number) {
    setCart((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
    setLinePrices((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  function documentItems() {
    return [
      ...selectedProducts.map((product) => ({
        productId: product.id,
        description: product.name,
        quantity: cart[product.id],
        unitPrice: isService(product)
          ? Number(linePrices[product.id]) || 0
          : product.price,
      })),
      ...laborLines.map((line) => ({
        productId: null,
        description: line.description,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice) || 0,
      })),
    ]
  }

  function addLaborLine() {
    const description = laborDescription.trim()
    const price = Number(laborPrice)
    if (!description || !Number.isFinite(price) || price < 0) {
      setMessage("Completá la descripción y el precio de la mano de obra.")
      return false
    }
    setLaborLines((current) => [
      ...current,
      {
        id: current.length ? Math.max(...current.map((line) => line.id)) + 1 : 1,
        description,
        quantity: 1,
        unitPrice: String(price),
      },
    ])
    setLaborDescription("")
    setLaborPrice("")
    setMessage("")
    return true
  }

  function addLaborFromMobileCatalog() {
    const addedDescription = laborDescription.trim()
    const price = Number(laborPrice)
    if (!addedDescription || !Number.isFinite(price) || price < 0) {
      setMobileCatalogError("Completá el trabajo y su precio para agregar la mano de obra.")
      return
    }
    if (!addLaborLine()) return
    setMobileCatalogError("")
    setMobileCatalogOpen(false)
    setMobileAddedItem(addedDescription)
  }

  async function createPreSaleDocument(type: "QUOTE" | "QUOTATION") {
    if (!subtotal) return
    setMessage("")
    setWorkingAction(type)

    const label = type === "QUOTE" ? "presupuesto" : "cotización"
    const article = type === "QUOTE" ? "el" : "la"

    try {
      const response = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...customerPayload(),
          issueDate,
          validUntil,
          discount: Number(discount) || 0,
          taxRate: Number(taxRate) || 0,
          notes:
            notes.trim() ||
            `${type === "QUOTE" ? "Presupuesto" : "Cotización"} generado desde ventas de mostrador.`,
          terms,
          items: documentItems(),
        }),
      })
      const data = (await response.json().catch(() => null)) as
        | { error?: string; id?: number }
        | null
      if (!response.ok || !data?.id) {
        throw new Error(data?.error || `No se pudo generar ${article} ${label}.`)
      }

      setMessage(`${type === "QUOTE" ? "Presupuesto" : "Cotización"} #${data.id} generado sin descontar stock.`)
      const documentUrl = `/admin/documentos/${data.id}`
      if (!openInNewTab(documentUrl)) window.location.href = documentUrl
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : `No se pudo generar ${article} ${label}.`
      )
    } finally {
      setWorkingAction(null)
    }
  }

  async function checkout() {
    if (!subtotal) return
    setMessage("")
    setWorkingAction("SALE")
    const items = [
      ...selectedProducts.map((product) => ({
        productId: product.id,
        description: product.name,
        quantity: cart[product.id],
        unitPrice: isService(product)
          ? Number(linePrices[product.id]) || 0
          : product.price,
        kind: "PRODUCT",
      })),
      ...laborLines.map((line) => ({
        productId: null,
        description: line.description,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice) || 0,
        kind: "LABOR",
      })),
    ]

    try {
      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          ...customerPayload(),
          paymentMethod,
          paymentReference,
          cardInstallments: paymentMethod === "CARD" ? Number(cardInstallments) : null,
          payments:
            paymentMethod === "COMBINED"
              ? paymentSplits.map(({ method, amount, reference }) => ({ method, amount, reference }))
              : [],
          discount: Number(discount) || 0,
          taxRate: Number(taxRate) || 0,
          notes,
        }),
      })
      const data = (await response.json().catch(() => null)) as
        | (Sale & { error?: string })
        | null
      if (!response.ok || !data?.id) {
        throw new Error(data?.error || "No se pudo registrar la venta.")
      }

      resetSaleForm()
      setSaleToInvoice(data)
      setMessage(
        `Venta #${data.id} registrada. Ahora podés emitir la factura.`
      )
      await load()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo registrar la venta."
      )
    } finally {
      setWorkingAction(null)
    }
  }

  async function issueInvoice() {
    if (!saleToInvoice) return
    setMessage("")

    if (invoiceMode === "ARCA") {
      if (!openInNewTab(arcaUrl)) {
        window.location.href = arcaUrl
        return
      }
      setMessage(
        "ARCA se abrió en otra pestaña. Ingresá con clave fiscal y elegí Comprobantes en línea."
      )
      return
    }

    setInvoicing(true)
    try {
      const response = await fetch(
        `/api/admin/sales/${saleToInvoice.id}/invoice`,
        { method: "POST" }
      )
      const data = (await response.json().catch(() => null)) as
        | { error?: string; id?: number; existing?: boolean }
        | null
      if (!response.ok || !data?.id) {
        throw new Error(data?.error || "No se pudo emitir la factura.")
      }

      setMessage(
        data.existing
          ? `La venta #${saleToInvoice.id} ya tenía una factura.`
          : `Factura de la venta #${saleToInvoice.id} emitida correctamente.`
      )
      const documentUrl = `/admin/documentos/${data.id}`
      if (!openInNewTab(documentUrl)) window.location.href = documentUrl
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo emitir la factura."
      )
    } finally {
      setInvoicing(false)
    }
  }

  function chooseSaleToInvoice(sale: Sale) {
    setOperationType("SALE")
    setSaleToInvoice(sale)
    setMessage("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function confirmVoidSale() {
    if (!saleToVoid) return
    const reason = voidReason.trim()
    if (reason.length < 5) {
      setVoidError("Escribí un motivo de al menos 5 caracteres.")
      return
    }

    const sale = saleToVoid
    setMessage("")
    setVoidError("")
    setVoidingId(sale.id)
    try {
      const response = await fetch("/api/admin/sales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sale.id, reason }),
      })
      const data = (await response.json().catch(() => null)) as Sale | { error?: string } | null
      if (!response.ok || !data || !("status" in data)) {
        throw new Error(data && "error" in data ? data.error : "No se pudo anular la venta.")
      }
      setSales((current) => current.map((item) => (item.id === sale.id ? { ...item, ...data } : item)))
      if (saleToInvoice?.id === sale.id) setSaleToInvoice(null)
      setMessage(`Venta #${sale.id} anulada. El stock fue repuesto y los balances fueron actualizados.`)
      setSaleToVoid(null)
      setVoidReason("")
      void load()
    } catch (error) {
      setVoidError(error instanceof Error ? error.message : "No se pudo anular la venta.")
    } finally {
      setVoidingId(null)
    }
  }

  return (
    <div className="w-full space-y-4">
      <header className="px-1">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Punto de venta
        </p>
        <h1 className="mt-1 text-2xl font-bold">Ventas de mostrador</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cargá productos, cliente, vehículo y cobro desde un solo panel.
        </p>
      </header>

      <div className="grid items-start gap-3 lg:grid-cols-2">
        <section className="order-2 hidden min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm lg:order-1 lg:block">
          <div className="border-b p-4">
            <div className="mb-3">
              <h2 data-quick-access-label="Catálogo" className="font-semibold">Catálogo</h2>
              <p className="text-xs text-muted-foreground">
                Elegí repuestos, servicios o cargá la mano de obra.
              </p>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2" role="group" aria-label="Categoría del catálogo">
              {([
                ["PRODUCTS", "Productos"],
                ["SERVICES", "Servicios"],
                ["LABOR", "Mano de obra"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCatalogGroup(value)}
                  className={`rounded-md border px-2 py-2 text-xs font-semibold transition ${
                    catalogGroup === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {catalogGroup !== "LABOR" && (
              <input
                className={inputClass}
                placeholder={catalogGroup === "SERVICES" ? "Buscar servicio" : "Buscar producto o SKU"}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            )}
          </div>
          <div className="space-y-5 p-4">
            {catalogGroup === "LABOR" && (
              <div className="col-span-full rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                <p className="font-semibold">Agregar mano de obra</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Describí el trabajo y asigná el precio correspondiente a esta operación.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_170px_auto] sm:items-end">
                  <label className="text-xs font-medium text-muted-foreground">
                    Trabajo realizado
                    <input
                      className={`${inputClass} mt-1`}
                      value={laborDescription}
                      onChange={(event) => setLaborDescription(event.target.value)}
                      placeholder="Ej.: Reparación y colocación de radiador"
                    />
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">
                    Precio
                    <input
                      className={`${inputClass} mt-1`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={laborPrice}
                      onChange={(event) => setLaborPrice(event.target.value)}
                      placeholder="0"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={addLaborLine}
                    className="rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}
            {catalogGroup !== "LABOR" && productsByCategory.map(({ category, items }) => (
              <section key={category}>
                <button type="button" onClick={() => toggleCatalogCategory(category)} aria-expanded={Boolean(openCatalogCategories[category])} className="flex w-full items-center justify-between gap-3 border-b pb-2 text-left">
                  <span><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{category}</span><span className="ml-2 text-xs text-muted-foreground">{items.length} {items.length === 1 ? "ítem" : "ítems"}</span></span>
                  <span className="grid h-6 w-6 place-items-center rounded-full border text-lg font-medium leading-none text-foreground" aria-hidden="true">{openCatalogCategories[category] ? "−" : "+"}</span>
                </button>
                {openCatalogCategories[category] && <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {items.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => add(product)}
                        disabled={!isService(product) && !product.stock}
                        className="rounded-lg border p-4 text-left transition hover:border-primary disabled:opacity-40"
                      >
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold">{product.name}</span>
                          <span className="font-bold text-primary">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {isService(product)
                            ? `Servicio · Cargado ${cart[product.id] || 0}`
                            : `Stock ${product.stock} · En ventas ${cart[product.id] || 0}`}
                        </p>
                      </button>
                    ))}
                  </div>}
              </section>
            ))}
            {catalogGroup !== "LABOR" && !visibleProducts.length && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                No hay elementos que coincidan con la búsqueda.
              </p>
            )}
          </div>

          <div className="border-t">
            <div className="border-b px-5 py-4">
              <h2 data-quick-access-label="Últimas ventas" className="font-semibold">Últimas ventas</h2>
              <p className="text-xs text-muted-foreground">
                Las ventas alimentan Caja y Reportes. Facturar crea el comprobante sin duplicar la operación.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[690px] text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Nº</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Pago</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 20).map((sale) => (
                    <tr key={sale.id} className={`border-t ${sale.status === "VOID" ? "bg-slate-50/80 text-slate-400" : ""}`}>
                      <td className="p-3 font-semibold">#{sale.id}</td>
                      <td className="p-3">{new Date(sale.createdAt).toLocaleString("es-AR")}</td>
                      <td className="p-3">{sale.customer?.name || "Consumidor final"}</td>
                      <td className="p-3">{payLabels[sale.paymentMethod]}</td>
                      <td className={`p-3 text-right font-bold ${sale.status === "VOID" ? "line-through" : ""}`}>{formatPrice(sale.total)}</td>
                      <td className="p-3 text-right">
                        {sale.status === "COMPLETED" ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => chooseSaleToInvoice(sale)}
                              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted"
                            >
                              <ReceiptText className="h-3.5 w-3.5" /> Facturar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSaleToVoid(sale)
                                setVoidReason("")
                                setVoidError("")
                              }}
                              disabled={voidingId === sale.id}
                              className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            >
                              {voidingId === sale.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                              Anular
                            </button>
                          </div>
                        ) : (
                          <div className="ml-auto max-w-64 text-left">
                            <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Anulada</span>
                            {sale.voidReason && (
                              <p className="mt-1.5 break-words text-[11px] leading-relaxed text-slate-600">
                                <span className="font-semibold">Motivo:</span> {sale.voidReason}
                              </p>
                            )}
                            {sale.voidedAt && (
                              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                                {new Date(sale.voidedAt).toLocaleString("es-AR")}
                                {sale.voidedBy?.name ? ` · ${sale.voidedBy.name}` : ""}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!sales.length && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Todavía no hay ventas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="order-1 h-fit rounded-xl border bg-card shadow-sm lg:order-2 lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto">
          <div className="border-b p-5">
            <h2 className="font-semibold">Operación actual</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Elegí qué comprobante necesitás generar.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Tipo de operación">
              {([
                ["SALE", "Venta", ReceiptText],
                ["QUOTE", "Presupuesto", FileText],
                ["QUOTATION", "Cotización", ClipboardCheck],
              ] as const).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOperationType(value)}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[0.68rem] font-bold transition ${
                    operationType === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Detalle</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {selectedProducts.length + laborLines.length} ítems
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileCatalogError("")
                    setMobileCatalogOpen(true)
                  }}
                  className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground lg:hidden"
                >
                  Buscar producto
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
            {selectedProducts.map((product) => {
              const unitPrice = isService(product)
                ? Number(linePrices[product.id]) || 0
                : product.price
              return (
              <div
                key={product.id}
                className="rounded-lg border bg-background p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{product.name}</p>
                    {isService(product) ? (
                      <label className="mt-2 block text-xs text-muted-foreground">
                        Precio del servicio
                        <input
                          className="mt-1 w-36 rounded-md border bg-background px-2 py-1.5 text-sm"
                          type="number"
                          min="0"
                          step="0.01"
                          value={linePrices[product.id] ?? String(product.price)}
                          onChange={(event) =>
                            setLinePrices((current) => ({
                              ...current,
                              [product.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatPrice(product.price)} c/u
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <strong className="text-primary">
                      {formatPrice(unitPrice * (cart[product.id] || 0))}
                    </strong>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                      aria-label={`Eliminar ${product.name} de la venta`}
                      title="Eliminar producto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => changeQuantity(product.id, (cart[product.id] || 0) - 1)} className="h-8 w-8 rounded border" aria-label={`Quitar una unidad de ${product.name}`}>−</button>
                  <span className="min-w-8 text-center font-semibold">{cart[product.id]}</span>
                  <button type="button" onClick={() => add(product)} className="h-8 w-8 rounded border" aria-label={`Agregar una unidad de ${product.name}`}>+</button>
                </div>
              </div>
              )
            })}
            {laborLines.map((line) => (
              <div key={`labor-${line.id}`} className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">Mano de obra</p>
                    <input
                      className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 font-semibold"
                      value={line.description}
                      onChange={(event) =>
                        setLaborLines((current) =>
                          current.map((item) =>
                            item.id === line.id
                              ? { ...item, description: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLaborLines((current) =>
                        current.filter((item) => item.id !== line.id)
                      )
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground"
                    aria-label={`Quitar ${line.description}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground">
                    Cantidad
                    <input
                      className={`${inputClass} mt-1`}
                      type="number"
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(event) =>
                        setLaborLines((current) =>
                          current.map((item) =>
                            item.id === line.id
                              ? { ...item, quantity: Math.max(1, Number(event.target.value) || 1) }
                              : item
                          )
                        )
                      }
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Precio
                    <input
                      className={`${inputClass} mt-1`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(event) =>
                        setLaborLines((current) =>
                          current.map((item) =>
                            item.id === line.id
                              ? { ...item, unitPrice: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                  </label>
                </div>
                <p className="mt-2 text-right font-bold text-primary">
                  {formatPrice(line.quantity * (Number(line.unitPrice) || 0))}
                </p>
              </div>
            ))}
            {!selectedProducts.length && !laborLines.length && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Seleccioná productos, servicios o mano de obra
              </p>
            )}
            </div>
          </div>

          <div className="space-y-4 border-b p-5">
            <h3 className="text-sm font-semibold">Cliente y vehículo</h3>
            <div className="block text-xs font-medium text-muted-foreground">
              Cliente registrado
              <CustomerPickerModal customers={customers} selectedId={customerId} onSelect={selectCustomer} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground">Nombre o razón social<input className={`${inputClass} mt-1`} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Consumidor final" /></label>
              <label className="text-xs font-medium text-muted-foreground">CUIT / DNI<input className={`${inputClass} mt-1`} value={customerTaxId} onChange={(event) => setCustomerTaxId(event.target.value)} /></label>
              <label className="text-xs font-medium text-muted-foreground">Teléfono<input className={`${inputClass} mt-1`} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></label>
              <label className="text-xs font-medium text-muted-foreground">Correo<input type="email" className={`${inputClass} mt-1`} value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} /></label>
              <label className="text-xs font-medium text-muted-foreground sm:col-span-2 lg:col-span-1 xl:col-span-2">Dirección<input className={`${inputClass} mt-1`} value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} /></label>
              <label className="text-xs font-medium text-muted-foreground">Vehículo<input className={`${inputClass} mt-1`} value={vehicleDescription} onChange={(event) => setVehicleDescription(event.target.value)} /></label>
              <label className="text-xs font-medium text-muted-foreground">Patente<input className={`${inputClass} mt-1 uppercase`} value={vehiclePlate} onChange={(event) => setVehiclePlate(event.target.value)} /></label>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md border bg-muted/30 px-3 py-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={saveCustomer}
                onChange={(event) => setSaveCustomer(event.target.checked)}
                className="h-4 w-4 rounded border accent-primary"
              />
              <span>Guardar cliente</span>
              <span className="text-xs font-normal text-muted-foreground">Agrega o actualiza sus datos en la agenda.</span>
            </label>
          </div>

          <div className="space-y-4 border-b p-5">
            <h3 className="text-sm font-semibold">Datos comerciales</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground">Fecha de emisión<input type="date" className={`${inputClass} mt-1`} value={issueDate} onChange={(event) => setIssueDate(event.target.value)} /></label>
              <label className="text-xs font-medium text-muted-foreground">Válido hasta<input type="date" className={`${inputClass} mt-1`} value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></label>
            </div>
            <label className="block text-xs font-medium text-muted-foreground">Observaciones<textarea className={`${inputClass} mt-1 min-h-20`} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            <label className="block text-xs font-medium text-muted-foreground">Condiciones<textarea className={`${inputClass} mt-1 min-h-20`} value={terms} onChange={(event) => setTerms(event.target.value)} /></label>
          </div>

          <div className="p-5">
            {operationType === "SALE" && (
              <label className="block text-xs font-medium text-muted-foreground">
                Medio de pago
              <select
                  className={`${inputClass} mt-1`}
              value={paymentMethod}
              onChange={(event) => changePaymentMethod(event.target.value)}
            >
              {Object.entries(payLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
            )}

            {operationType === "SALE" && ["CARD", "MERCADO_PAGO"].includes(paymentMethod) && (
              <label className="mt-3 block text-xs font-medium text-muted-foreground">
                {paymentMethod === "MERCADO_PAGO" ? "N.º de operación de Mercado Pago" : "N.º de cupón u operación de la tarjeta"}
                <input
                  className={`${inputClass} mt-1`}
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  maxLength={120}
                  placeholder="Opcional, para conciliar el cobro"
                />
              </label>
            )}

            {operationType === "SALE" && paymentMethod === "CARD" && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3">
                <label className="block text-xs font-medium text-slate-600">
                  Cantidad de cuotas
                  <select
                    className={`${inputClass} mt-1 bg-white`}
                    value={cardInstallments}
                    onChange={(event) => setCardInstallments(event.target.value)}
                  >
                    {settings.cardInstallmentRates.map((plan) => (
                      <option key={plan.installments} value={plan.installments}>
                        {plan.installments} {plan.installments === 1 ? "cuota" : "cuotas"} · {plan.surchargeRate > 0 ? `${plan.surchargeRate}% de recargo` : "sin recargo"}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-white/80 p-2.5">
                    <span className="text-slate-500">Recargo</span>
                    <strong className="mt-0.5 block text-slate-950">{formatPrice(cardSurchargeAmount)}</strong>
                  </div>
                  <div className="rounded-md bg-white/80 p-2.5 text-right">
                    <span className="text-slate-500">Valor por cuota</span>
                    <strong className="mt-0.5 block text-slate-950">
                      {formatPrice(total / Math.max(1, Number(cardInstallments)))}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {operationType === "SALE" && paymentMethod === "COMBINED" && (
              <div className="mt-3 rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Distribución del pago</p>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Usá al menos dos medios diferentes.
                    </p>
                  </div>
                  {paymentSplits.length < payableMethods.length && (
                    <button
                      type="button"
                      onClick={addPaymentSplit}
                      className="shrink-0 rounded-md border bg-background px-2.5 py-1.5 text-xs font-semibold"
                    >
                      + Agregar
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {paymentSplits.map((payment, index) => (
                    <div key={payment.id} className="space-y-2">
                      <div className="grid grid-cols-[1fr_125px_34px] gap-2">
                        <select
                        aria-label={`Medio de pago ${index + 1}`}
                        className={inputClass}
                        value={payment.method}
                        onChange={(event) =>
                          updatePaymentSplit(payment.id, {
                            method: event.target.value as PaymentMethod,
                          })
                        }
                      >
                        {payableMethods.map(([value, label]) => (
                          <option
                            key={value}
                            value={value}
                            disabled={paymentSplits.some(
                              (other) =>
                                other.id !== payment.id && other.method === value
                            )}
                          >
                            {label}
                          </option>
                        ))}
                        </select>
                        <input
                        aria-label={`Importe del medio ${index + 1}`}
                        className={`${inputClass} text-right`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={payment.amount}
                        onChange={(event) =>
                          updatePaymentSplit(payment.id, {
                            amount: event.target.value,
                          })
                        }
                        />
                        <button
                        type="button"
                        onClick={() =>
                          setPaymentSplits((current) =>
                            current.filter((item) => item.id !== payment.id)
                          )
                        }
                        disabled={paymentSplits.length <= 2}
                        className="flex h-10 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground disabled:opacity-30"
                        aria-label={`Quitar medio ${index + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {["CARD", "MERCADO_PAGO"].includes(payment.method) && (
                        <input
                          aria-label={`Referencia del medio ${index + 1}`}
                          className={inputClass}
                          value={payment.reference}
                          onChange={(event) =>
                            updatePaymentSplit(payment.id, { reference: event.target.value })
                          }
                          maxLength={120}
                          placeholder={payment.method === "MERCADO_PAGO" ? "N.º de operación de Mercado Pago (opcional)" : "N.º de cupón u operación (opcional)"}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={completeCombinedBalance}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Completar el saldo en el último medio
                </button>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                  <span>
                    Distribuido<br />
                    <strong>{formatPrice(combinedDistributed)}</strong>
                  </span>
                  <span className="text-right">
                    {combinedRemaining >= 0 ? "Falta" : "Excede"}<br />
                    <strong className={combinedPaymentValid ? "text-green-600" : "text-primary"}>
                      {formatPrice(Math.abs(combinedRemaining))}
                    </strong>
                  </span>
                </div>
                {!combinedPaymentValid && (
                  <p className="mt-2 text-[0.68rem] font-medium text-primary">
                    La distribución debe coincidir exactamente con el total.
                  </p>
                )}
              </div>
            )}

            <div className={`grid gap-3 ${operationType === "SALE" ? "mt-3" : ""} grid-cols-2`}>
              <label className="text-xs font-medium text-muted-foreground">Descuento<input className={`${inputClass} mt-1`} type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} /></label>
              <label className="text-xs font-medium text-muted-foreground">IVA / impuesto %<input className={`${inputClass} mt-1`} type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} /></label>
            </div>

          <div className="mt-4 space-y-1 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Descuento</span>
              <span>- {formatPrice(appliedDiscount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Impuestos</span>
              <span>{formatPrice(taxAmount)}</span>
            </div>
            {cardSurchargeAmount > 0 && (
              <div className="flex justify-between font-medium text-blue-700">
                <span>Recargo tarjeta ({cardInstallments} cuotas · {cardSurchargeRate}%)</span>
                <span>+ {formatPrice(cardSurchargeAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
                onClick={() =>
                  operationType === "SALE"
                    ? void checkout()
                    : void createPreSaleDocument(operationType)
                }
              disabled={
                !subtotal ||
                workingAction !== null ||
                (operationType === "SALE" && !combinedPaymentValid)
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-40"
            >
                {workingAction !== null && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
                {operationType === "SALE"
                  ? "Confirmar venta"
                  : operationType === "QUOTE"
                    ? "Generar presupuesto"
                    : "Generar cotización"}
            </button>
          </div>

          {saleToInvoice && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    Facturar venta #{saleToInvoice.id}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Total {formatPrice(saleToInvoice.total)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSaleToInvoice(null)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border"
                  aria-label="Cerrar opciones de facturación"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <label className="mt-3 block text-xs text-muted-foreground">
                Tipo de factura
                <select
                  value={invoiceMode}
                  onChange={(event) =>
                    setInvoiceMode(event.target.value as InvoiceMode)
                  }
                  className="mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground"
                >
                  <option value="INTERNAL">Factura normal (interna)</option>
                  <option value="ARCA">Factura electrónica por ARCA</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => void issueInvoice()}
                disabled={invoicing}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground disabled:opacity-50"
              >
                {invoicing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : invoiceMode === "ARCA" ? (
                  <ExternalLink className="h-4 w-4" />
                ) : (
                  <ReceiptText className="h-4 w-4" />
                )}
                {invoiceMode === "ARCA" ? "Abrir ARCA" : "Emitir factura"}
              </button>
              <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                {invoiceMode === "ARCA"
                  ? "La autorización fiscal y el CAE se completan en Comprobantes en línea."
                  : "Comprobante interno imprimible; no reemplaza la factura fiscal de ARCA."}
              </p>
            </div>
          )}

            {message && <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">{message}</p>}
          </div>
        </aside>
      </div>

      {mobileCatalogOpen && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/55 p-3 backdrop-blur-md lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-catalog-title">
          <div className="flex h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-white/60 bg-white/75 shadow-[0_24px_80px_rgba(2,8,23,.45)] backdrop-blur-3xl">
            <div className="flex items-start justify-between border-b border-white/60 bg-white/30 p-5">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary">Operación actual</p>
                <h2 id="mobile-catalog-title" className="mt-1 text-xl font-bold">Agregar a la venta</h2>
                <p className="mt-1 text-xs text-muted-foreground">Elegí un producto, servicio o mano de obra.</p>
              </div>
              <button type="button" onClick={() => setMobileCatalogOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-slate-400/70 bg-white/45 shadow-sm backdrop-blur-xl" aria-label="Cerrar catálogo">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-white/15 p-4">
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tipo de ítem">
                {([
                  ["PRODUCTS", "Productos"],
                  ["SERVICES", "Servicios"],
                  ["LABOR", "Mano de obra"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCatalogGroup(value)}
                    className={`min-h-12 rounded-xl border px-2 text-xs font-bold shadow-sm backdrop-blur-xl transition ${catalogGroup === value ? "border-primary bg-primary text-primary-foreground shadow-primary/20" : "border-white/70 bg-white/45"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {catalogGroup !== "LABOR" && (
                <input
                  autoFocus
                  className={`${inputClass} mt-3`}
                  placeholder={catalogGroup === "SERVICES" ? "Buscar servicio" : "Buscar producto o SKU"}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              )}

              {catalogGroup === "LABOR" ? (
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.03] p-4">
                  <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /><p className="font-bold">Nueva mano de obra</p></div>
                  <label className="mt-4 block text-xs font-medium text-muted-foreground">Trabajo realizado
                    <input className={`${inputClass} mt-1`} value={laborDescription} onChange={(event) => { setLaborDescription(event.target.value); setMobileCatalogError("") }} placeholder="Ej.: Reparación y colocación de radiador" />
                  </label>
                  <label className="mt-3 block text-xs font-medium text-muted-foreground">Precio
                    <input className={`${inputClass} mt-1`} type="number" min="0" step="0.01" value={laborPrice} onChange={(event) => { setLaborPrice(event.target.value); setMobileCatalogError("") }} placeholder="0" />
                  </label>
                  {mobileCatalogError && <p className="mt-3 text-xs font-medium text-destructive">{mobileCatalogError}</p>}
                  <button type="button" onClick={addLaborFromMobileCatalog} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"><Wrench className="h-4 w-4" /> Agregar mano de obra</button>
                </div>
              ) : (
                <div className="mt-4 space-y-5">
                  {productsByCategory.map(({ category, items }) => (
                    <section key={category}>
                      <button type="button" onClick={() => toggleCatalogCategory(category)} aria-expanded={Boolean(openCatalogCategories[category])} className="flex w-full items-center justify-between gap-3 border-b pb-2 text-left">
                        <span><span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">{category}</span><span className="ml-2 text-xs text-muted-foreground">{items.length}</span></span>
                        <span className="grid h-7 w-7 place-items-center rounded-full border text-xl font-medium leading-none text-foreground" aria-hidden="true">{openCatalogCategories[category] ? "−" : "+"}</span>
                      </button>
                      {openCatalogCategories[category] && <div className="mt-3 space-y-2">
                          {items.map((product) => (
                          <button key={product.id} type="button" onClick={() => addFromMobileCatalog(product)} disabled={!isService(product) && !product.stock} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/55 p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,.08)] backdrop-blur-xl transition active:scale-[.99] disabled:opacity-40">
                              <span className="min-w-0"><strong className="block text-sm leading-snug">{product.name}</strong><small className="mt-1 block text-xs text-muted-foreground">{isService(product) ? "Servicio" : `Stock ${product.stock}`}</small></span>
                              <strong className="shrink-0 text-sm text-primary">{formatPrice(product.price)}</strong>
                            </button>
                          ))}
                        </div>}
                    </section>
                  ))}
                  {!visibleProducts.length && <p className="py-10 text-center text-sm text-muted-foreground">No hay elementos que coincidan con la búsqueda.</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mobileAddedItem && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 p-5 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-labelledby="item-added-title">
          <div className="w-full max-w-sm rounded-[28px] bg-card p-6 text-center shadow-2xl">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></span>
            <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emerald-700">Ítem agregado</p>
            <h2 id="item-added-title" className="mt-1 text-lg font-bold">{mobileAddedItem}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Ya está incluido en la operación actual.</p>
            <div className="mt-6 grid gap-2">
              <button type="button" onClick={() => { setMobileAddedItem(null); setMobileCatalogOpen(true) }} className="h-12 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">Agregar otro ítem</button>
              <button type="button" onClick={() => setMobileAddedItem(null)} className="h-12 rounded-xl border px-4 text-sm font-bold">Ver operación</button>
            </div>
          </div>
        </div>
      )}

      {saleToVoid && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="void-sale-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/70 bg-white text-slate-950 shadow-2xl shadow-slate-950/25">
            <div className="border-b border-slate-200/80 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <Ban className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">Acción contable</p>
                  <h2 id="void-sale-title" className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Primero se debe anular la venta
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    No se borra el historial. Se corregirán stock, Caja y balances, y quedarán registrados el motivo, el usuario, la fecha y la hora.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-7">
              <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Venta</p>
                  <p className="font-bold text-slate-950">#{saleToVoid.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">Total</p>
                  <p className="font-bold text-slate-950">{formatPrice(saleToVoid.total)}</p>
                </div>
              </div>

              <label className="block text-sm font-semibold text-slate-800">
                Motivo de la anulación <span className="text-rose-600">*</span>
                <textarea
                  autoFocus
                  value={voidReason}
                  onChange={(event) => {
                    setVoidReason(event.target.value)
                    if (voidError) setVoidError("")
                  }}
                  maxLength={500}
                  rows={4}
                  placeholder="Ej.: carga duplicada, producto incorrecto o devolución del cliente"
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                <span className="mt-1.5 flex items-center justify-between text-[11px] font-medium">
                  <span className={voidError ? "text-rose-600" : "text-slate-500"}>
                    {voidError || "Mínimo 5 caracteres."}
                  </span>
                  <span className="text-slate-400">{voidReason.length}/500</span>
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSaleToVoid(null)
                    setVoidReason("")
                    setVoidError("")
                  }}
                  disabled={voidingId !== null}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void confirmVoidSale()}
                  disabled={voidReason.trim().length < 5 || voidingId !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {voidingId !== null && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar anulación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
