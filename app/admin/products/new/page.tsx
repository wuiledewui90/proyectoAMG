"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { RequireAuth } from "@/lib/admin-auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function AdminNewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sku, setSku] = useState("")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [category, setCategory] = useState("")
  const [compatibility, setCompatibility] = useState("")
  const [price, setPrice] = useState("0")
  const [stock, setStock] = useState("0")
  const [imageUrl, setImageUrl] = useState("")
  const [isActive, setIsActive] = useState(true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/products", {
      method: "POST",
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
      setLoading(false)
      return
    }

    const created = await res.json()
    router.push(`/admin/products/${created.id}`)
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Nuevo producto</h1>
              <p className="text-sm text-muted-foreground">Crear producto en base de datos</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/products">Volver</Link>
            </Button>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-lg border border-border bg-card p-6">
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

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

              <div className="flex items-center justify-end gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
