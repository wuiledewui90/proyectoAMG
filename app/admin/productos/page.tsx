"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Ban, FileDown, FileUp, ImageUp, Loader2, Pencil, Plus, Save, Search, Star, Trash2, X } from "lucide-react"

import { brands, categories, formatPrice } from "@/lib/data"
import { AdminMobileExpandableText } from "@/components/admin-mobile-expandable-text"

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
  stock: number
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
  stock: string
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
  stock: "",
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUploadError, setImageUploadError] = useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")

  const [editing, setEditing] = useState<EditorState | null>(null)
  const [isNew, setIsNew] = useState(false)

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
      stock: String(product.stock),
      imageUrl: product.imageUrl ?? product.images?.[0] ?? "/images/radiador-1.jpg",
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    })
    setIsNew(false)
    setImageUploadError("")
    setImagePreviewUrl("")
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
    const stock = parseNonNegativeInteger(editing.stock)

    if (price === null) {
      alert("Ingresa un precio valido.")
      return
    }

    if (stock === null) {
      alert("Ingresa un stock valido, sin decimales.")
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
      stock,
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
            <h1 className="mt-0.5 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">Productos</h1>
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
        <div className="grid gap-2 sm:flex sm:items-center max-lg:hidden">
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
          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/products/export"
            }}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/90 bg-white/75 px-5 text-sm font-semibold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,.07)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white sm:w-auto"
          >
            <FileDown className="h-4 w-4" />
            Exportar Excel
          </button>
          <button
            onClick={handleNew}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,23,42,.2)] transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        </div>
      </header>

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

      <section className="grid gap-3 rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-[0_18px_55px_rgba(15,23,42,.07)] backdrop-blur-2xl sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(240px,1fr)_170px_200px_180px_160px]">
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

      {editing && (
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
            <Field label="Precio">
              <input
                type="number"
                className={editorControlClass}
                placeholder="Ej: 25000"
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: e.target.value })}
              />
            </Field>
            <Field label="Stock">
              <input
                type="number"
                className={editorControlClass}
                placeholder="Ej: 5"
                value={editing.stock}
                onChange={(e) => setEditing({ ...editing, stock: e.target.value })}
              />
            </Field>
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
              <th className="w-36 px-4 py-3 font-medium">Precio</th>
              <th className="w-24 px-4 py-3 font-medium">Stock</th>
              <th className="w-28 px-4 py-3 font-medium">Estado</th>
              <th className="w-32 px-4 py-3 font-medium">Acciones</th>
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
                <td className="px-4 py-3 font-semibold">{formatPrice(product.price)}</td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3">
                  <StatusBadge active={product.isActive} />
                </td>
                <td className="px-4 py-3">
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
                </td>
              </tr>
            ))}
            {!loading && data?.items?.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
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
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stock</p>
                    <p className="font-semibold">{product.stock}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
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
            </div>
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

      <button
        type="button"
        onClick={handleNew}
        className="admin-mobile-tap fixed bottom-[calc(5.7rem+env(safe-area-inset-bottom))] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#0878f9] text-white shadow-[0_14px_32px_rgba(8,120,249,.34)] lg:hidden"
        aria-label="Nuevo producto"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
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
