"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { RequireAuth } from "@/lib/admin-auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type ApiProduct = {
  id: number
  slug: string
  name: string
  description: string | null
  sku: string | null
  price: number
  stock: number
  isActive: boolean
  brand: string | null
  model: string | null
  category: string | null
  compatibility: string | null
  images: unknown
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminEditProductPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [product, setProduct] = useState<ApiProduct | null>(null)

  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sku, setSku] = useState("")
  const [price, setPrice] = useState("0")
  const [stock, setStock] = useState("0")
  const [imageUrl, setImageUrl] = useState("")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")

    fetch(`/api/products/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          const payload = await r.json().catch(() => null)
          throw new Error(payload?.error ?? `Error ${r.status}`)
        }
        return r.json() as Promise<ApiProduct>
      })
      .then((p) => {
        if (cancelled) return
        setProduct(p)
        setSlug(p.slug ?? "")
        setName(p.name)
        setDescription(p.description ?? "")
        setSku(p.sku ?? "")
        setBrand(p.brand ?? "")
        setModel(p.model ?? "")
        setCategory(p.category ?? "")
        setCompatibility(p.compatibility ?? "")
        setPrice(String(p.price))
        setStock(String(p.stock))
        setImageUrl(p.imageUrl ?? "")
        setIsActive(p.isActive)
      })
      .catch((e: any) => {
        if (cancelled) return
        setError(e?.message ?? "Error")
        setProduct(null)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        name,
        description,
        sku,
        brand,
        model,
        category,
        compatibility,
        price: Number(price),
        stock: Number(stock),
        imageUrl,
        isActive,
      }),
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setError(payload?.error ?? `Error ${res.status}`)
      setSaving(false)
      return
    }

    const updated = (await res.json()) as ApiProduct
    setProduct(updated)
    setSaving(false)
  }

  async function handleSoftDelete() {
    if (!confirm("¿Desactivar (soft delete) este producto?") ) return
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setError(payload?.error ?? `Error ${res.status}`)
      return
    }
    const updated = (await res.json()) as ApiProduct
    setProduct(updated)
    setIsActive(false)
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Editar producto</h1>
              <p className="text-sm text-muted-foreground">ID: {id}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/products">Volver</Link>
            </Button>
          </div>

          <div className="p-6">
            {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}

            {!loading && error && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!loading && product && (
              <form onSubmit={handleSave} className="max-w-2xl space-y-4 rounded-lg border border-border bg-card p-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug *</label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SKU (único)</label>
                    <Input value={sku} onChange={(e) => setSku(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Imagen URL</label>
                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Marca</label>
                    <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Modelo</label>
                    <Input value={model} onChange={(e) => setModel(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoría</label>
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Compatibilidad</label>
                    <Input value={compatibility} onChange={(e) => setCompatibility(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio *</label>
                    <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock</label>
                    <Input type="number" min={0} step="1" value={stock} onChange={(e) => setStock(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <select
                      value={isActive ? "true" : "false"}
                      onChange={(e) => setIsActive(e.target.value === "true")}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button type="button" variant="destructive" onClick={handleSoftDelete} disabled={!isActive}>
                    Desactivar
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
