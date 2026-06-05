"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Ban, FileUp, ImageUp, Loader2, Pencil, Plus, Save, Search, Star, Trash2, X } from "lucide-react"

import { brands, categories, formatPrice } from "@/lib/data"

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
  "h-10 w-full rounded-md border-2 border-slate-300 bg-white px-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"

const editorTextareaClass =
  "min-h-24 w-full rounded-md border-2 border-slate-300 bg-white p-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const page = Number(searchParams.get("page") ?? "1")
  const limit = Number(searchParams.get("limit") ?? "20")
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [isActive, setIsActive] = useState(searchParams.get("isActive") ?? "")
  const [orderMode, setOrderMode] = useState<"updated" | "category">("updated")

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
    qs.set("page", String(page))
    qs.set("limit", String(limit))
    return qs.toString()
  }, [search, isActive, page, limit])

  useEffect(() => {
    let cancel = false
    setLoading(true)
    setError("")

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
    }
    return items
  }, [data?.items, orderMode])

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
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} productos cargados` : "Listado de productos de la base de datos"}
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:items-center">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => void handleImportProducts(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60 sm:w-auto"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            {importing ? "Importando..." : "Importar Excel/CSV"}
          </button>
          <button
            onClick={handleNew}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_180px_180px]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            placeholder="Buscar por nombre, SKU o slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar producto"
          />
        </div>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Estado</span>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Orden</span>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            value={orderMode}
            onChange={(e) => setOrderMode(e.target.value === "category" ? "category" : "updated")}
          >
            <option value="updated">Recientes</option>
            <option value="category">Categoria</option>
          </select>
        </label>
      </div>

      {loading && (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Cargando productos...
        </div>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </p>
      )}
      {importResult && (
        <div className="rounded-lg border bg-card p-4 text-sm">
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
        <div className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{isNew ? "Nuevo producto" : "Editar producto"}</h2>
            <button
              onClick={() => {
                setEditing(null)
                setIsNew(false)
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:text-foreground"
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
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
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
            <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm md:mt-6">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
              />
              Activo
            </label>
            <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm md:mt-6">
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
            <button
              onClick={() => {
                setEditing(null)
                setIsNew(false)
              }}
              className="h-10 rounded-md border px-4 text-sm transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="hidden overflow-hidden rounded-lg border bg-card lg:block">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
              <th className="w-24 px-4 py-3 font-medium">Imagen</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="w-36 px-4 py-3 font-medium">Precio</th>
              <th className="w-24 px-4 py-3 font-medium">Stock</th>
              <th className="w-28 px-4 py-3 font-medium">Estado</th>
              <th className="w-32 px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orderedItems.map((product) => (
              <tr key={product.id} className="border-b last:border-0">
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
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No hay productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {orderedItems.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-lg border bg-card p-3">
            <div className="flex gap-3">
              <ProductImage product={product} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 min-w-0 text-sm font-semibold leading-snug">
                    {product.name}
                  </h2>
                  {product.isFeatured && (
                    <Star
                      className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500"
                      aria-label="Destacado"
                    />
                  )}
                  <StatusBadge active={product.isActive} />
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {productSubtitle(product)}
                </p>
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
                className="inline-flex h-9 items-center justify-center gap-1 rounded-md border text-xs font-medium"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                onClick={() => handleSoftDelete(product.id)}
                disabled={!product.isActive}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-md border text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Ban className="h-3.5 w-3.5" />
                Pausar
              </button>
              <button
                onClick={() => handleHardDelete(product.id)}
                className="col-span-2 inline-flex h-9 items-center justify-center gap-1 rounded-md border text-xs font-medium text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Borrar
              </button>
            </div>
          </article>
        ))}

        {!loading && data?.items?.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No hay productos.
          </div>
        )}
      </div>
    </div>
  )
}

function productSubtitle(product: ApiProduct) {
  return [product.brand, product.model, product.category].filter(Boolean).join(" · ") || "Sin categoria"
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function ProductImage({ product, size }: { product: ApiProduct; size: "sm" | "md" }) {
  const image = product.imageUrl ?? product.images?.[0] ?? "/placeholder.svg"
  const sizeClass = size === "sm" ? "h-14 w-14" : "h-20 w-20"

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-md border bg-white ${sizeClass}`}>
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
    <div className="relative h-40 w-full overflow-hidden rounded-md border bg-white md:w-40">
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
        active ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
