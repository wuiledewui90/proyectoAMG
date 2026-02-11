// app/admin/productos/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Pencil, Trash2, X, Save } from "lucide-react"

import { categories, brands, formatPrice } from "@/lib/data"

// ========================
// Tipos que vienen de la API (DB)
// ========================
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
}

type ListResponse = {
  items: ApiProduct[]
  page: number
  limit: number
  total: number
  totalPages: number
}

// ========================
// Estado del formulario (editor)
// ========================
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
  price: number
  stock: number
  imageUrl: string
  isActive: boolean
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
  price: 0,
  stock: 0,
  imageUrl: "/images/radiador-1.jpg",
  isActive: true,
}

// ✅ Helper para asegurar que el id sea un number válido
function toValidId(value: unknown): number | null {
  const raw = String(value ?? "").trim()
  const id = Number.parseInt(raw, 10)
  if (!Number.isFinite(id) || id <= 0) return null
  return id
}

export default function AdminProductosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ========================
  // Filtros por URL
  // ========================
  const page = Number(searchParams.get("page") ?? "1")
  const limit = Number(searchParams.get("limit") ?? "20")
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [isActive, setIsActive] = useState(searchParams.get("isActive") ?? "")

  // ========================
  // Datos
  // ========================
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Editor
  const [editing, setEditing] = useState<EditorState | null>(null)
  const [isNew, setIsNew] = useState(false)

  // ========================
  // QueryString alineado a API
  // ========================
  const queryString = useMemo(() => {
    const qs = new URLSearchParams()
    if (search.trim()) qs.set("search", search.trim())
    if (isActive === "true" || isActive === "false") qs.set("isActive", isActive)
    qs.set("page", String(page))
    qs.set("limit", String(limit))
    return qs.toString()
  }, [search, isActive, page, limit])

  // ========================
  // Fetch REAL a la DB
  // ========================
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
        if (cancel) return
        setData(json)
      })
      .catch((e: any) => {
        if (cancel) return
        setError(e?.message ?? "Error")
      })
      .finally(() => {
        if (cancel) return
        setLoading(false)
      })

    return () => {
      cancel = true
    }
  }, [queryString])

  // ========================
  // Acciones
  // ========================
  function handleNew() {
    setEditing({ ...emptyEditor })
    setIsNew(true)
  }

  function handleEdit(p: ApiProduct) {
    const id = toValidId(p.id)
    if (!id) {
      alert("ID inválido del producto.")
      return
    }

    setEditing({
      id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      sku: p.sku ?? "",
      brand: p.brand ?? "",
      model: p.model ?? "",
      category: p.category ?? "",
      compatibility: p.compatibility ?? "",
      price: p.price,
      stock: p.stock,
      imageUrl: p.imageUrl ?? p.images?.[0] ?? "/images/radiador-1.jpg",
      isActive: p.isActive,
    })

    setIsNew(false)
  }

  async function handleSave() {
    if (!editing) return

    const payload = {
      name: editing.name,
      slug: editing.slug,
      description: editing.description || null,
      sku: editing.sku || null,
      brand: editing.brand || null,
      model: editing.model || null,
      category: editing.category || null,
      compatibility: editing.compatibility || null,
      price: editing.price,
      stock: editing.stock,
      imageUrl: editing.imageUrl || null,
      images: editing.imageUrl ? [editing.imageUrl] : [],
      isActive: editing.isActive,
    }

    // ✅ URL y método correctos
    let url = "/api/products"
    let method: "POST" | "PUT" = "POST"

    if (!isNew) {
      const id = toValidId(editing.id)
      if (!id) {
        alert("ID inválido para actualizar.")
        return
      }
      console.log("[admin productos] update id", id)
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
    router.refresh()
  }

  async function handleSoftDelete(id: number) {
    const validId = toValidId(id)
    if (!validId) {
      alert("ID inválido para eliminar.")
      return
    }

    if (!confirm("¿Desactivar producto?")) return

    const res = await fetch(`/api/products/${validId}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      alert(err?.error ?? `Error ${res.status}`)
      return
    }

    router.refresh()
  }

  // ========================
  // Render
  // ========================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Productos (DB)</h1>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {loading && <p>Cargando…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Modal */}
      {editing && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isNew ? "Nuevo" : "Editar"}</h2>
            <button
              onClick={() => {
                setEditing(null)
                setIsNew(false)
              }}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Nombre">
              <input
                className="w-full rounded border p-2"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </Field>

            <Field label="Slug">
              <input
                className="w-full rounded border p-2"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              />
            </Field>

            <Field label="SKU">
              <input
                className="w-full rounded border p-2"
                value={editing.sku}
                onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
              />
            </Field>

            <Field label="Imagen URL">
              <input
                className="w-full rounded border p-2"
                value={editing.imageUrl}
                onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
              />
            </Field>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Descripción</label>
              <textarea
                className="w-full rounded border p-2"
                rows={3}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>

            <Field label="Precio">
              <input
                type="number"
                className="w-full rounded border p-2"
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
              />
            </Field>

            <Field label="Stock">
              <input
                type="number"
                className="w-full rounded border p-2"
                value={editing.stock}
                onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
              />
            </Field>

            <Field label="Marca">
              <select
                className="w-full rounded border p-2"
                value={editing.brand}
                onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Categoría">
              <select
                className="w-full rounded border p-2"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
              />
              Activo
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Save className="h-4 w-4" /> Guardar
            </button>

            <button
              onClick={() => {
                setEditing(null)
                setIsNew(false)
              }}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left">Imagen</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Precio</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {data?.items?.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                    <Image
                      src={p.imageUrl ?? "/placeholder.svg"}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                </td>

                <td className="p-3">{p.name}</td>
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">{p.isActive ? "Activo" : "Inactivo"}</td>

                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleSoftDelete(p.id)}
                      disabled={!p.isActive}
                      aria-label="Desactivar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && data?.items?.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No hay productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}
