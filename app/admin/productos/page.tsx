"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, Ban, BarChart3, CloudDownload, FileDown, FileUp, ImageUp, Loader2, Pencil, Plus, Save, Search, Star, Trash2, Wallet, X } from "lucide-react"

import { brands, categories, formatPrice } from "@/lib/data"
import { AdminMobileExpandableText } from "@/components/admin-mobile-expandable-text"
import { isServiceProduct } from "@/lib/products/stock-classification"

type ApiProduct = {
  id: number
  name: string
  description: string | null
  sku: string | null
  brand: string | null
  model: string | null
  category: string | null
  compatibility: string | null
  slug: string
  images: string[]
  imageUrl: string | null
  thumbnailUrl?: string
  price: number
  cost: number | null
  stock: number
  minimumStock: number
  stockType: string | null
  stockCategory: string | null
  isActive: boolean
  isFeatured: boolean
}

type ListResponse = {
  items: ApiProduct[]
  page: number
  limit: number
  total: number
  totalPages: number
  availableCategories: string[]
  availableBrands: string[]
}

type ImportResponse = {
  created: number
  updated: number
  failed: number
  total: number
  errors: Array<{ row: number; error: string }>
}

type SupabaseImportPreview = {
  total: number
  alreadyPresent: number
  toCreate: number
  withImage: number
  conflictCount: number
  conflicts: Array<{ code: string; reason: string }>
  fingerprint: string
  stockNotice: string
}

type SupabaseImportResult = {
  created: number
  skipped: number
  total: number
  withImage: number
  stockNotice: string
}

type InventoryAnalytics = {
  activeProducts: number
  units: number
  lowStock: number
  outOfStock: number
  missingCostProducts: number
  missingCostUnits: number
  missingCost: Array<{ id: number; name: string; sku: string | null; stock: number }>
  investment: number
  potentialRevenue: number
  potentialGrossProfit: number
  potentialMarginPercent: number
  byCategory: Array<{ name: string; investment: number; units: number }>
  recentMovements: Array<{
    id: number
    type: "SALE" | "PURCHASE" | "ADJUSTMENT" | "RETURN" | "WORK_ORDER"
    quantity: number
    previousStock: number
    newStock: number
    notes: string | null
    createdAt: string
    product: { name: string; sku: string | null }
  }>
  month: {
    revenueWithKnownCost: number
    costOfGoodsSold: number
    grossProfit: number
    uncostedSaleLines: number
    legacySaleLines: number
  }
}

type EditorState = {
  id?: number
  name: string
  slug: string
  description: string
  sku: string
  brand: string
  model: string
  category: string
  compatibility: string
  price: string
  cost: string
  stock: string
  originalStock: number
  stockAdjustmentReason: string
  minimumStock: string
  imageUrl: string
  isActive: boolean
  isFeatured: boolean
}

const emptyEditor: EditorState = {
  name: "",
  slug: "",
  description: "",
  sku: "",
  brand: "",
  model: "",
  category: "",
  compatibility: "",
  price: "",
  cost: "",
  stock: "",
  originalStock: 0,
  stockAdjustmentReason: "",
  minimumStock: "0",
  imageUrl: "",
  isActive: true,
  isFeatured: false,
}

const editorControlClass =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white/85 px-4 text-sm text-slate-950 shadow-[0_4px_14px_rgba(15,23,42,.04)] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"

const editorTextareaClass =
  "min-h-28 w-full rounded-2xl border border-slate-200 bg-white/85 p-4 text-sm text-slate-950 shadow-[0_4px_14px_rgba(15,23,42,.04)] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"

function toValidId(value: unknown): number | null {
  const raw = String(value ?? "").trim()
  const id = Number.parseInt(raw, 10)
  if (!Number.isFinite(id) || id <= 0) return null
  return id
}

function parseNonNegativeNumber(value: string) {
  const normalized = value.trim().replace(",", ".")
  if (!normalized) return null

  const number = Number(normalized)
  if (!Number.isFinite(number) || number < 0) return null

  return number
}

function parseNonNegativeInteger(value: string) {
  const number = parseNonNegativeNumber(value)
  if (number === null || !Number.isInteger(number)) return null

  return number
}

export default function AdminProductosPage() {
  return (
    <Suspense fallback={<AdminProductosLoading />}>
      <AdminProductosContent />
    </Suspense>
  )
}

function AdminProductosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const page = Number(searchParams.get("page") ?? "1")
  const limit = Number(searchParams.get("limit") ?? "20")
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [isActive, setIsActive] = useState(searchParams.get("isActive") ?? "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") ?? "")
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") ?? "")
  const [orderMode, setOrderMode] = useState<"updated" | "category" | "stock">("updated")

  const [data, setData] = useState<ListResponse | null>(null)
  const [canManageProducts, setCanManageProducts] = useState(false)
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null)
  const [analyticsError, setAnalyticsError] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [supabasePreview, setSupabasePreview] = useState<SupabaseImportPreview | null>(null)
  const [supabaseResult, setSupabaseResult] = useState<SupabaseImportResult | null>(null)
  const [supabaseBusy, setSupabaseBusy] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUploadError, setImageUploadError] = useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")

  const [editing, setEditing] = useState<EditorState | null>(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ role?: string }> : null)
      .then((session) => { if (!cancelled) setCanManageProducts(session?.role === "ADMIN") })
      .catch(() => { if (!cancelled) setCanManageProducts(false) })
    return () => { cancelled = true }
  }, [])

  const queryString = useMemo(() => {
    const qs = new URLSearchParams()
    if (search.trim()) qs.set("search", search.trim())
    if (isActive === "true" || isActive === "false") qs.set("isActive", isActive)
    if (selectedCategory) qs.set("category", selectedCategory)
    if (selectedBrand) qs.set("brand", selectedBrand)
    qs.set("page", String(page))
    qs.set("limit", String(limit))
    return qs.toString()
  }, [search, isActive, selectedCategory, selectedBrand, page, limit])

  useEffect(() => {
    let cancel = false
    queueMicrotask(() => {
      if (cancel) return
      setLoading(true)
      setError("")
    })

    fetch(`/api/products?${queryString}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const payload = await r.json().catch(() => null)
          throw new Error(payload?.error ?? `Error ${r.status}`)
        }
        return r.json() as Promise<ListResponse>
      })
      .then((json) => {
        if (!cancel) setData(json)
      })
      .catch((e: unknown) => {
        if (!cancel) setError(e instanceof Error ? e.message : "Error")
      })
      .finally(() => {
        if (!cancel) setLoading(false)
      })

    return () => {
      cancel = true
    }
  }, [queryString, reloadKey])

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/inventory-analytics", { cache: "no-store" })
      .then((response) => {
        if (response.status === 403) return null
        if (!response.ok) throw new Error("No se pudo calcular la analítica del inventario. Revisá las migraciones de la base de datos.")
        return response.json() as Promise<InventoryAnalytics>
      })
      .then((result) => { if (!cancelled && result) { setAnalytics(result); setAnalyticsError("") } })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAnalytics(null)
          setAnalyticsError(error instanceof Error ? error.message : "No se pudo calcular la analítica.")
        }
      })
    return () => { cancelled = true }
  }, [reloadKey])

  const orderedItems = useMemo(() => {
    const items = data?.items ? [...data.items] : []
    if (orderMode === "category") {
      items.sort((a, b) => {
        const categoryCompare = (a.category ?? "").localeCompare(b.category ?? "", "es")
        if (categoryCompare !== 0) return categoryCompare
        return a.name.localeCompare(b.name, "es")
      })
    } else if (orderMode === "stock") {
      items.sort((a, b) => b.stock - a.stock || a.name.localeCompare(b.name, "es"))
    }
    return items
  }, [data, orderMode])

  const categoryOptions = Array.from(
    new Set([...categories, ...(data?.availableCategories ?? [])])
  ).sort((a, b) => a.localeCompare(b, "es"))
  const brandOptions = Array.from(
    new Set([...brands, ...(data?.availableBrands ?? [])])
  ).sort((a, b) => a.localeCompare(b, "es"))

  const firstVisibleProduct = data && data.total > 0 ? (data.page - 1) * data.limit + 1 : 0
  const lastVisibleProduct = data
    ? Math.min(data.page * data.limit, data.total)
    : 0

  function navigateToPage(nextPage: number) {
    if (!data) return

    const targetPage = Math.min(Math.max(nextPage, 1), data.totalPages)
    const qs = new URLSearchParams(searchParams.toString())

    if (search.trim()) qs.set("search", search.trim())
    else qs.delete("search")
    if (isActive) qs.set("isActive", isActive)
    else qs.delete("isActive")
    if (selectedCategory) qs.set("category", selectedCategory)
    else qs.delete("category")
    if (selectedBrand) qs.set("brand", selectedBrand)
    else qs.delete("brand")

    qs.set("page", String(targetPage))
    qs.set("limit", String(limit))
    router.push(`/admin/productos?${qs.toString()}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleNew() {
    setEditing({ ...emptyEditor })
    setIsNew(true)
    setImageUploadError("")
    setImagePreviewUrl("")
  }

  function handleEdit(product: ApiProduct) {
    const id = toValidId(product.id)
    if (!id) {
      alert("ID invalido del producto.")
      return
    }

    setEditing({
      id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      sku: product.sku ?? "",
      brand: product.brand ?? "",
      model: product.model ?? "",
      category: product.category ?? "",
      compatibility: product.compatibility ?? "",
      price: String(product.price),
      cost: product.cost === null ? "" : String(product.cost),
      stock: String(product.stock),
      originalStock: product.stock,
      stockAdjustmentReason: "",
      minimumStock: String(product.minimumStock),
      imageUrl: product.imageUrl ?? product.images?.[0] ?? "/images/radiador-1.jpg",
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    })
    setIsNew(false)
    setImageUploadError("")
    setImagePreviewUrl("")
  }

  async function openProductById(id: number) {
    const response = await fetch(`/api/products/${id}`, { cache: "no-store" })
    if (!response.ok) {
      setError("No se pudo abrir el producto para completar su costo.")
      return
    }
    handleEdit(await response.json() as ApiProduct)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleUploadProductImage(file: File | null) {
    if (!file || !editing) return

    const previewUrl = URL.createObjectURL(file)
    setImagePreviewUrl(previewUrl)
    setImageUploading(true)
    setImageUploadError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/products/upload-image", {
        method: "POST",
        body: formData,
      })
      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(payload?.error ?? `Error ${res.status}`)
      }

      const imageUrl = String(payload?.url ?? "")
      if (!imageUrl) throw new Error("La subida no devolvio una ruta de imagen.")

      setEditing((current) => (current ? { ...current, imageUrl } : current))
      setImagePreviewUrl("")
      URL.revokeObjectURL(previewUrl)
    } catch (err) {
      setImageUploadError(err instanceof Error ? err.message : "No se pudo subir la imagen.")
    } finally {
      setImageUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ""
    }
  }

  async function handleSave() {
    if (!editing) return

    const price = parseNonNegativeNumber(editing.price)
    const cost = editing.cost.trim() ? parseNonNegativeNumber(editing.cost) : 0
    const stock = parseNonNegativeInteger(editing.stock)
    const minimumStock = parseNonNegativeInteger(editing.minimumStock)

    if (price === null) {
      alert("Ingresa un precio valido.")
      return
    }

    if (stock === null) {
      alert("Ingresa un stock valido, sin decimales.")
      return
    }

    if (cost === null || minimumStock === null) {
      alert("Ingresá un costo y un stock mínimo válidos, sin valores negativos.")
      return
    }

    if (!isNew && stock !== editing.originalStock && editing.stockAdjustmentReason.trim().length < 5) {
      alert("Indicá un motivo de al menos 5 caracteres para ajustar el stock.")
      return
    }

    const payload = {
      name: editing.name,
      slug: editing.slug,
      description: editing.description || "",
      sku: editing.sku || "",
      brand: editing.brand || "",
      model: editing.model || "",
      category: editing.category || "",
      compatibility: editing.compatibility || "",
      price,
      cost,
      stock,
      minimumStock,
      ...(!isNew && stock !== editing.originalStock
        ? { stockAdjustmentReason: editing.stockAdjustmentReason.trim() }
        : {}),
      imageUrl: editing.imageUrl || "",
      images: editing.imageUrl ? [editing.imageUrl] : [],
      isActive: editing.isActive,
      isFeatured: editing.isFeatured,
    }

    let url = "/api/products"
    let method: "POST" | "PUT" = "POST"

    if (!isNew) {
      const id = toValidId(editing.id)
      if (!id) {
        alert("ID invalido para actualizar.")
        return
      }
      url = `/api/products/${id}`
      method = "PUT"
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      alert(err?.error ?? `Error ${res.status}`)
      return
    }

    setEditing(null)
    setIsNew(false)
    setReloadKey((key) => key + 1)
    router.refresh()
  }

  async function handleSoftDelete(id: number) {
    const validId = toValidId(id)
    if (!validId) {
      alert("ID invalido para eliminar.")
      return
    }

    if (!confirm("Desactivar producto?")) return

    const res = await fetch(`/api/products/${validId}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      alert(err?.error ?? `Error ${res.status}`)
      return
    }

    setReloadKey((key) => key + 1)
    router.refresh()
  }

  async function handleHardDelete(id: number) {
    const validId = toValidId(id)
    if (!validId) {
      alert("ID invalido para eliminar.")
      return
    }

    if (!confirm("Eliminar definitivamente este producto?")) return

    const res = await fetch(`/api/products/${validId}?hard=true`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      alert(err?.error ?? `Error ${res.status}`)
      return
    }

    setReloadKey((key) => key + 1)
    router.refresh()
  }

  async function handleImportProducts(file: File | null) {
    if (!file) return

    setImporting(true)
    setImportResult(null)
    setError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      })
      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(payload?.error ?? `Error ${res.status}`)
      }

      setImportResult(payload as ImportResponse)
      setReloadKey((key) => key + 1)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el archivo.")
    } finally {
      setImporting(false)
      if (importInputRef.current) importInputRef.current.value = ""
    }
  }

  async function handlePreviewSupabase() {
    setSupabaseBusy(true)
    setSupabasePreview(null)
    setSupabaseResult(null)
    setError("")
    try {
      const response = await fetch("/api/products/import-supabase", { cache: "no-store" })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || `Error ${response.status}`)
      setSupabasePreview(payload as SupabaseImportPreview)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo revisar Supabase.")
    } finally {
      setSupabaseBusy(false)
    }
  }

  async function handleImportSupabase() {
    if (!supabasePreview || supabasePreview.conflictCount || !supabasePreview.toCreate) return
    setSupabaseBusy(true)
    setError("")
    try {
      const response = await fetch("/api/products/import-supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true, fingerprint: supabasePreview.fingerprint }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || `Error ${response.status}`)
      setSupabaseResult(payload as SupabaseImportResult)
      setSupabasePreview(null)
      setReloadKey((key) => key + 1)
      router.refresh()
    } catch (err) {
      setSupabasePreview(null)
      setError(err instanceof Error ? err.message : "No se pudo importar desde Supabase.")
    } finally {
      setSupabaseBusy(false)
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[1500px] space-y-6 pb-10 text-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-52 -z-10 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />

      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-white/80 bg-white/75 shadow-[0_12px_35px_rgba(15,23,42,.1)] backdrop-blur-xl">
            <Image src="/images/admin-icons/productos.webp" alt="" width={192} height={192} className="h-12 w-12 object-contain" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Inventario</p>
            <h1 className="mt-0.5 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">PRODUCTOS Y STOCK</h1>
            <p className="mt-1 text-sm text-slate-500">
              {data ? `${data.total} productos cargados` : "Listado de productos de la base de datos"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Catálogo vinculado
              </span>
              <span>Productos en MySQL · imágenes asociadas por código</span>
            </div>
          </div>
        </div>
        {canManageProducts && <div className="grid gap-2 sm:flex sm:items-center max-lg:hidden">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => void handleImportProducts(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/90 bg-white/75 px-5 text-sm font-semibold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,.07)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-60 sm:w-auto"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            {importing ? "Importando..." : "Importar Excel/CSV"}
          </button>
          <form action="/api/products/export" method="get">
            <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/90 bg-white/75 px-5 text-sm font-semibold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,.07)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white sm:w-auto">
              <FileDown className="h-4 w-4" />
              Exportar Excel
            </button>
          </form>
          <button
            onClick={handleNew}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,23,42,.2)] transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        </div>}
      </header>

      {analytics && (
        <InventoryAnalyticsPanel
          analytics={analytics}
          onEditMissingCost={(id) => void openProductById(id)}
        />
      )}
      {canManageProducts && analyticsError && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">{analyticsError}</p>}

      {canManageProducts && <section className="rounded-[28px] border border-blue-100 bg-white/80 p-4 shadow-[0_18px_55px_rgba(15,23,42,.06)] backdrop-blur-2xl sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Catálogo externo</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Productos de Supabase</h2>
            <p className="mt-1 text-sm text-slate-600">Compará ambos catálogos antes de agregar los productos que faltan. Los existentes no se sobrescriben.</p>
          </div>
          <button
            type="button"
            onClick={() => void handlePreviewSupabase()}
            disabled={supabaseBusy}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:opacity-60"
          >
            {supabaseBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
            Revisar importación
          </button>
        </div>

        {supabasePreview && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800" aria-live="polite">
            <p className="font-semibold">Vista previa: {supabasePreview.total} en Supabase · {supabasePreview.alreadyPresent} ya presentes · {supabasePreview.toCreate} para agregar · {supabasePreview.withImage} nuevos con imagen.</p>
            <p className="mt-2 text-slate-600">{supabasePreview.stockNotice}</p>
            {supabasePreview.conflictCount > 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="font-semibold">Hay {supabasePreview.conflictCount} conflictos. No se importará nada hasta resolverlos.</p>
                <ul className="mt-1 list-inside list-disc">
                  {supabasePreview.conflicts.map((item, index) => (
                    <li key={`${item.code}-${index}`}>{item.code}: {item.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleImportSupabase()}
                disabled={supabaseBusy || supabasePreview.conflictCount > 0 || supabasePreview.toCreate === 0}
                className="min-h-10 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Agregar {supabasePreview.toCreate} productos
              </button>
              <button type="button" onClick={() => setSupabasePreview(null)} className="min-h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700">Cancelar</button>
            </div>
          </div>
        )}
        {supabaseResult && (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900" role="status">
            Se agregaron {supabaseResult.created} productos. {supabaseResult.skipped} ya estaban presentes o se omitieron por duplicados. {supabaseResult.stockNotice}
          </p>
        )}
      </section>}

      <div className="grid grid-cols-3 rounded-2xl border border-white/80 bg-white/80 p-1 shadow-sm backdrop-blur-xl lg:hidden">
        {([
          ["updated", "Todos"],
          ["category", "Categorías"],
          ["stock", "Stock"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setOrderMode(value)}
            className={`admin-mobile-tap min-h-10 rounded-xl px-2 text-xs font-semibold transition ${
              orderMode === value
                ? "bg-[#071b33] text-white shadow-sm"
                : "text-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section data-quick-access-label="Inventario" className="grid gap-3 rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-[0_18px_55px_rgba(15,23,42,.07)] backdrop-blur-2xl sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(240px,1fr)_170px_200px_180px_160px]">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            placeholder="Buscar por nombre, SKU o slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar producto"
          />
        </div>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Estado</span>
          <select
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Categoría</span>
          <select
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Marca</span>
          <select
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            <option value="">Todas</option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Orden</span>
          <select
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            value={orderMode}
            onChange={(e) => {
              const value = e.target.value
              setOrderMode(value === "category" || value === "stock" ? value : "updated")
            }}
          >
            <option value="updated">Recientes</option>
            <option value="category">Categoria</option>
            <option value="stock">Mayor stock</option>
          </select>
        </label>
      </section>

      {loading && (
        <div className="rounded-2xl border border-white/80 bg-white/75 p-4 text-sm text-slate-500 shadow-sm backdrop-blur-xl">
          Cargando productos...
        </div>
      )}
      {error && (
        <p className="rounded-2xl border border-red-200/70 bg-red-50/90 p-4 text-sm text-red-600 shadow-sm">
          {error}
        </p>
      )}
      {importResult && (
        <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-sm shadow-sm backdrop-blur-xl">
          <p className="font-medium">
            Importacion finalizada: {importResult.created} creados, {importResult.updated}{" "}
            actualizados, {importResult.failed} con error.
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-red-600">
              {importResult.errors.slice(0, 5).map((item) => (
                <li key={`${item.row}-${item.error}`}>
                  Fila {item.row}: {item.error}
                </li>
              ))}
              {importResult.errors.length > 5 && (
                <li>Hay {importResult.errors.length - 5} errores mas.</li>
              )}
            </ul>
          )}
        </div>
      )}

      {canManageProducts && editing && (
        <section className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.1)] backdrop-blur-2xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Editor</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">{isNew ? "Nuevo producto" : "Editar producto"}</h2>
            </div>
            <button
              onClick={() => {
                setEditing(null)
                setIsNew(false)
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Nombre">
              <input
                className={editorControlClass}
                placeholder="Ej: Radiador Toyota Corolla"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </Field>
            <Field label="Slug">
              <input
                className={editorControlClass}
                placeholder="Ej: radiador-toyota-corolla"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              />
            </Field>
            <Field label="SKU">
              <input
                className={editorControlClass}
                placeholder="Ej: AMG-001"
                value={editing.sku}
                onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
              />
            </Field>
            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <label className="text-sm font-medium">Imagen</label>
              <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                <ProductImagePreview
                  image={imagePreviewUrl || editing.imageUrl}
                  name={editing.name || "Producto"}
                  loading={imageUploading}
                />
                <div className="grid content-start gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => void handleUploadProductImage(e.target.files?.[0] ?? null)}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={imageUploading}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {imageUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImageUp className="h-4 w-4" />
                      )}
                      {imageUploading ? "Subiendo..." : "Subir imagen"}
                    </button>
                    <input
                      className={`${editorControlClass} min-w-0 flex-1`}
                      value={editing.imageUrl}
                      onChange={(e) => {
                        setImagePreviewUrl("")
                        setEditing({ ...editing, imageUrl: e.target.value })
                      }}
                      placeholder="/uploads/products/producto.jpg"
                      aria-label="Ruta o URL de imagen"
                    />
                  </div>
                  {imageUploadError && <p className="text-sm text-red-600">{imageUploadError}</p>}
                </div>
              </div>
            </div>
            <Field label="Precio de venta">
              <input
                type="number"
                min="0"
                step="0.01"
                className={editorControlClass}
                placeholder="Ej: 25000"
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: e.target.value })}
              />
            </Field>
            <Field label="Costo unitario de compra">
              <input
                type="number"
                min="0"
                step="0.01"
                className={editorControlClass}
                placeholder="Pendiente de cargar"
                value={editing.cost}
                onChange={(e) => setEditing({ ...editing, cost: e.target.value })}
              />
            </Field>
            <Field label="Stock">
              <input
                type="number"
                min="0"
                step="1"
                className={editorControlClass}
                placeholder="Ej: 5"
                value={editing.stock}
                onChange={(e) => setEditing({ ...editing, stock: e.target.value })}
              />
            </Field>
            <Field label="Stock mínimo (alerta)">
              <input
                type="number"
                min="0"
                step="1"
                className={editorControlClass}
                placeholder="Ej: 2"
                value={editing.minimumStock}
                onChange={(e) => setEditing({ ...editing, minimumStock: e.target.value })}
              />
            </Field>
            {!isNew && Number(editing.stock) !== editing.originalStock && (
              <Field label="Motivo del ajuste de stock *">
                <input
                  className={editorControlClass}
                  maxLength={255}
                  placeholder="Ej: compra, conteo físico o rotura"
                  value={editing.stockAdjustmentReason}
                  onChange={(e) => setEditing({ ...editing, stockAdjustmentReason: e.target.value })}
                />
              </Field>
            )}
            <p className="self-end rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-xs text-slate-600 md:col-span-2 xl:col-span-2">
              {Number(editing.cost) > 0 && Number(editing.price) > 0
                ? `Margen bruto estimado por unidad: ${formatPrice(Number(editing.price) - Number(editing.cost))} (${(((Number(editing.price) - Number(editing.cost)) / Number(editing.price)) * 100).toFixed(1)}%). No incluye gastos ni impuestos.`
                : "Sin costo de compra no se puede calcular el margen ni la inversión de este producto."}
            </p>
            <Field label="Marca">
              <select
                className={editorControlClass}
                value={editing.brand}
                onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Categoria">
              <select
                className={editorControlClass}
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm md:mt-6">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
              />
              Activo
            </label>
            <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm md:mt-6">
              <input
                type="checkbox"
                checked={editing.isFeatured}
                onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
              />
              <Star
                className={`h-4 w-4 ${
                  editing.isFeatured ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                }`}
              />
              Destacado en inicio
            </label>
            <div className="space-y-1 md:col-span-2 xl:col-span-3">
              <label className="text-sm font-medium">Descripcion</label>
              <textarea
                className={editorTextareaClass}
                placeholder="Escribi una descripcion clara del producto, compatibilidad o detalles importantes."
                rows={3}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={handleSave}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,.18)] transition hover:bg-slate-800"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
            <button
              onClick={() => {
                setEditing(null)
                setIsNew(false)
              }}
              className="h-11 rounded-full border border-slate-200 bg-white px-6 text-sm font-medium transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      <div className="hidden overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,.07)] backdrop-blur-2xl lg:block">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-slate-200/70 bg-slate-50/70 text-left text-xs text-slate-400">
              <th className="w-16 px-4 py-3 text-center font-medium">N.º</th>
              <th className="w-24 px-4 py-3 font-medium">Imagen</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="w-40 px-4 py-3 font-medium">{canManageProducts ? "Venta / costo" : "Precio"}</th>
              <th className="w-24 px-4 py-3 font-medium">Stock</th>
              <th className="w-28 px-4 py-3 font-medium">Estado</th>
              {canManageProducts && <th className="w-32 px-4 py-3 font-medium">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {orderedItems.map((product, index) => (
              <tr key={product.id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/80">
                <td className="px-4 py-3 text-center font-semibold text-muted-foreground">
                  {(data?.page ?? page) * (data?.limit ?? limit) - (data?.limit ?? limit) + index + 1}
                </td>
                <td className="px-4 py-3">
                  <ProductImage product={product} size="sm" />
                </td>
                <td className="min-w-0 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-medium text-foreground">{product.name}</p>
                    {product.isFeatured && (
                      <Star
                        className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500"
                        aria-label="Destacado"
                      />
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {productSubtitle(product)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{formatPrice(product.price)}</p>
                  {canManageProducts && <p className={`text-xs ${Number(product.cost) > 0 ? "text-slate-500" : "font-semibold text-amber-700"}`}>
                    {Number(product.cost) > 0 ? `Costo ${formatPrice(Number(product.cost))}` : isServiceProduct(product) ? "Servicio" : "Costo pendiente"}
                  </p>}
                </td>
                <td className="px-4 py-3">
                  <p>{isServiceProduct(product) ? "—" : product.stock}</p>
                  {!isServiceProduct(product) && product.stock === 0 && <span className="text-xs font-semibold text-rose-600">Agotado</span>}
                  {!isServiceProduct(product) && product.stock > 0 && product.minimumStock > 0 && product.stock <= product.minimumStock && (
                    <span className="text-xs font-semibold text-amber-700">Stock bajo</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge active={product.isActive} />
                </td>
                {canManageProducts && <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <ActionButton onClick={() => handleEdit(product)} label="Editar">
                      <Pencil className="h-4 w-4" />
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleSoftDelete(product.id)}
                      disabled={!product.isActive}
                      label="Desactivar"
                    >
                      <Ban className="h-4 w-4" />
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleHardDelete(product.id)}
                      label="Eliminar definitivamente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  </div>
                </td>}
              </tr>
            ))}
            {!loading && data?.items?.length === 0 && (
              <tr>
                <td colSpan={canManageProducts ? 7 : 6} className="p-8 text-center text-muted-foreground">
                  No hay productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {orderedItems.map((product, index) => (
          <article key={product.id} className="overflow-hidden rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_12px_38px_rgba(15,23,42,.07)] backdrop-blur-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
              Artículo #{(data?.page ?? page) * (data?.limit ?? limit) - (data?.limit ?? limit) + index + 1}
            </p>
            <div className="flex gap-3">
              <ProductImage product={product} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <AdminMobileExpandableText
                    value={product.name}
                    label="Nombre del producto"
                    lines={2}
                    className="text-sm font-semibold leading-snug text-slate-900"
                  />
                  {product.isFeatured && (
                    <Star
                      className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500"
                      aria-label="Destacado"
                    />
                  )}
                  <StatusBadge active={product.isActive} />
                </div>
                <AdminMobileExpandableText
                  value={productSubtitle(product)}
                  label="Datos del producto"
                  className="mt-1 text-xs text-muted-foreground"
                />
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Precio</p>
                    <p className="font-semibold">{formatPrice(product.price)}</p>
                    {canManageProducts && <p className={`text-xs ${Number(product.cost) > 0 ? "text-slate-500" : "font-semibold text-amber-700"}`}>
                      {Number(product.cost) > 0 ? `Costo ${formatPrice(Number(product.cost))}` : isServiceProduct(product) ? "Servicio" : "Costo pendiente"}
                    </p>}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stock</p>
                    <p className="font-semibold">{isServiceProduct(product) ? "No aplica" : product.stock}</p>
                    {!isServiceProduct(product) && product.stock > 0 && product.minimumStock > 0 && product.stock <= product.minimumStock && (
                      <p className="text-xs font-semibold text-amber-700">Bajo mínimo ({product.minimumStock})</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {canManageProducts && <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleEdit(product)}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white text-xs font-medium"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                onClick={() => handleSoftDelete(product.id)}
                disabled={!product.isActive}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Ban className="h-3.5 w-3.5" />
                Pausar
              </button>
              <button
                onClick={() => handleHardDelete(product.id)}
                className="col-span-2 inline-flex h-9 items-center justify-center gap-1 rounded-full border border-rose-200 bg-rose-50 text-xs font-medium text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Borrar
              </button>
            </div>}
          </article>
        ))}

        {!loading && data?.items?.length === 0 && (
          <div className="rounded-[24px] border border-white/80 bg-white/80 p-8 text-center text-sm text-slate-400 shadow-sm">
            No hay productos.
          </div>
        )}
      </div>

      {data && data.total > 0 && (
        <nav
          className="flex flex-col gap-3 rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_12px_38px_rgba(15,23,42,.06)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
          aria-label="Paginación de productos"
        >
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{firstVisibleProduct}</span>–
            <span className="font-semibold text-foreground">{lastVisibleProduct}</span> de{" "}
            <span className="font-semibold text-foreground">{data.total}</span> artículos
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigateToPage(data.page - 1)}
              disabled={data.page <= 1}
              className="h-9 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            {Array.from({ length: data.totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => navigateToPage(pageNumber)}
                aria-current={pageNumber === data.page ? "page" : undefined}
                aria-label={`Ir a la página ${pageNumber}`}
                className={`h-9 min-w-9 rounded-full border px-2 text-sm font-semibold transition-colors ${
                  pageNumber === data.page
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => navigateToPage(data.page + 1)}
              disabled={data.page >= data.totalPages}
              className="h-9 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </nav>
      )}

      {canManageProducts && <button
        type="button"
        onClick={handleNew}
        className="admin-mobile-tap fixed bottom-[calc(5.7rem+env(safe-area-inset-bottom))] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#0878f9] text-white shadow-[0_14px_32px_rgba(8,120,249,.34)] lg:hidden"
        aria-label="Nuevo producto"
      >
        <Plus className="h-6 w-6" />
      </button>}
    </div>
  )
}

function InventoryAnalyticsPanel({
  analytics,
  onEditMissingCost,
}: {
  analytics: InventoryAnalytics
  onEditMissingCost: (id: number) => void
}) {
  const maxInvestment = Math.max(1, ...analytics.byCategory.map((item) => item.investment))
  const incompleteSales = analytics.month.uncostedSaleLines + analytics.month.legacySaleLines

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/80 bg-white/80 p-4 shadow-[0_24px_70px_rgba(15,23,42,.09)] backdrop-blur-2xl sm:p-6" aria-label="Analítica de stock y rentabilidad">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600"><BarChart3 className="h-4 w-4" /> Stock analytics</p>
          <h2 data-quick-access-label="Stock y analytics" className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Inversión y rentabilidad</h2>
          <p className="mt-1 text-sm text-slate-600">Valores calculados sobre productos físicos activos del ERP; no modifican Supabase.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">{analytics.activeProducts} productos · {analytics.units} unidades</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
          <Wallet className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Invertido en stock</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{formatPrice(analytics.investment)}</p>
          <p className="mt-1 text-xs text-slate-500">Solo unidades con costo cargado</p>
        </div>
        <div className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
          <BarChart3 className="h-5 w-5 text-violet-600" aria-hidden="true" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ganancia bruta potencial</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{formatPrice(analytics.potentialGrossProfit)}</p>
          <p className="mt-1 text-xs text-slate-500">{analytics.potentialMarginPercent.toFixed(1)}% si se vende el stock costeado al precio actual</p>
        </div>
        <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
          <BarChart3 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ganancia bruta registrada este mes</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{formatPrice(analytics.month.grossProfit)}</p>
          <p className="mt-1 text-xs text-slate-500">Ventas de productos con costo al vender, sin impuestos ni gastos</p>
        </div>
        <div className="rounded-[24px] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Costos pendientes</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{analytics.missingCostProducts}</p>
          <p className="mt-1 text-xs text-slate-500">{analytics.missingCostUnits} unidades sin inversión calculable</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-950">Inversión por categoría</h3>
          <div className="mt-4 space-y-3">
            {analytics.byCategory.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between gap-2 text-xs"><span className="truncate font-medium text-slate-600">{item.name}</span><span className="shrink-0 font-semibold text-slate-900">{formatPrice(item.investment)}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${Math.max(2, item.investment / maxInvestment * 100)}%` }} /></div>
              </div>
            ))}
            {!analytics.byCategory.length && <p className="text-sm text-slate-500">Cargá costos para ver la distribución.</p>}
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-950">Alertas del inventario</h3>
          <p className="mt-2 text-sm text-slate-600">{analytics.outOfStock} agotados · {analytics.lowStock} bajo el mínimo configurado.</p>
          {incompleteSales > 0 && (
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              La ganancia del mes es parcial: {analytics.month.uncostedSaleLines} líneas vendidas sin costo y {analytics.month.legacySaleLines} líneas anteriores sin costo histórico. No se estiman con el costo actual.
            </p>
          )}
          {analytics.missingCost.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Completar costo de compra</p>
              {analytics.missingCost.map((item) => (
                <button key={item.id} type="button" onClick={() => onEditMissingCost(item.id)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white bg-white p-2.5 text-left text-xs shadow-sm transition hover:border-blue-300">
                  <span className="min-w-0 truncate font-medium text-slate-800">{item.name} {item.sku ? `· ${item.sku}` : ""}</span>
                  <span className="shrink-0 font-semibold text-blue-600">Editar</span>
                </button>
              ))}
              {analytics.missingCostProducts > analytics.missingCost.length && <p className="text-xs text-slate-500">Se muestran los primeros {analytics.missingCost.length} de {analytics.missingCostProducts}.</p>}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-950">Últimos movimientos de stock</h3>
        <p className="mt-1 text-xs text-slate-500">Los cambios manuales conservan el motivo y las cantidades anterior y nueva.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {analytics.recentMovements.map((movement) => (
            <div key={movement.id} className="min-w-0 rounded-2xl border border-white bg-white p-3 text-xs shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 break-words font-semibold text-slate-900">{movement.product.name}</span>
                <span className={`shrink-0 font-semibold ${movement.quantity < 0 ? "text-rose-600" : "text-emerald-700"}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</span>
              </div>
              <p className="mt-1 text-slate-600">{movement.previousStock} → {movement.newStock} unidades · {movement.type === "ADJUSTMENT" ? "Ajuste" : movement.type === "SALE" ? "Venta" : movement.type === "RETURN" ? "Devolución" : movement.type === "PURCHASE" ? "Compra" : "Taller"}</p>
              {movement.notes && <p className="mt-1 break-words text-slate-500">{movement.notes}</p>}
              <p className="mt-1 text-slate-400">{new Date(movement.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" })}</p>
            </div>
          ))}
          {!analytics.recentMovements.length && <p className="text-sm text-slate-500">Todavía no hay movimientos registrados.</p>}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Inversión = stock × costo. Ganancia potencial = stock × (venta − costo). La ganancia registrada descuenta el costo guardado al vender y distribuye los descuentos; no equivale a utilidad neta.</p>
    </section>
  )
}

function AdminProductosLoading() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Cargando productos" />
    </div>
  )
}

function productSubtitle(product: ApiProduct) {
  return [product.brand, product.model, product.category].filter(Boolean).join(" · ") || "Sin categoria"
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function ProductImage({ product, size }: { product: ApiProduct; size: "sm" | "md" }) {
  const image = product.thumbnailUrl ?? product.imageUrl ?? product.images?.[0] ?? "/placeholder.svg"
  const sizeClass = size === "sm" ? "h-14 w-14" : "h-20 w-20"

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${sizeClass}`}>
      <Image src={image} alt={product.name} fill sizes="96px" className="object-contain p-1" />
    </div>
  )
}

function ProductImagePreview({
  image,
  loading,
  name,
}: {
  image: string
  loading: boolean
  name: string
}) {
  const src = image || "/placeholder.svg"

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,.07)] md:w-40">
      {src.startsWith("blob:") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-contain p-2" />
      ) : (
        <Image src={src} alt={name} fill sizes="160px" className="object-contain p-2" />
      )}
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-white/70">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  )
}

function ActionButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
