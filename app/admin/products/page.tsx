"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { RequireAuth } from "@/lib/admin-auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type ApiProduct = {
  id: number
  name: string
  description: string | null
  sku: string | null
  price: number
  stock: number
  isActive: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

type ListResponse = {
  items: ApiProduct[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminProductsDbPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get("page") ?? "1")
  const limit = Number(searchParams.get("limit") ?? "20")
  const initialSearch = searchParams.get("search") ?? ""
  const initialIsActive = searchParams.get("isActive")

  const [search, setSearch] = useState(initialSearch)
  const [isActive, setIsActive] = useState<string>(initialIsActive ?? "")
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const queryString = useMemo(() => {
    const qs = new URLSearchParams()
    if (search.trim()) qs.set("search", search.trim())
    if (isActive === "true" || isActive === "false") qs.set("isActive", isActive)
    qs.set("page", String(Number.isFinite(page) && page > 0 ? page : 1))
    qs.set("limit", String(Number.isFinite(limit) && limit > 0 ? limit : 20))
    return qs.toString()
  }, [search, isActive, page, limit])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")

    fetch(`/api/products?${queryString}`)
      .then(async (r) => {
        if (!r.ok) {
          const payload = await r.json().catch(() => null)
          throw new Error(payload?.error ?? `Error ${r.status}`)
        }
        return r.json() as Promise<ListResponse>
      })
      .then((payload) => {
        if (cancelled) return
        setData(payload)
      })
      .catch((e: any) => {
        if (cancelled) return
        setError(e?.message ?? "Error")
        setData(null)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [queryString])

  function applyFilters(next: { search?: string; isActive?: string; page?: number }) {
    const qs = new URLSearchParams(searchParams.toString())
    if (next.search !== undefined) {
      const v = next.search.trim()
      if (v) qs.set("search", v)
      else qs.delete("search")
    }
    if (next.isActive !== undefined) {
      if (next.isActive === "true" || next.isActive === "false") qs.set("isActive", next.isActive)
      else qs.delete("isActive")
    }
    if (next.page !== undefined) qs.set("page", String(next.page))
    if (!qs.get("limit")) qs.set("limit", "20")
    router.push(`/admin/products?${qs.toString()}`)
  }

  async function handleSoftDelete(id: number) {
    if (!confirm("¿Desactivar (soft delete) este producto?") ) return
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      alert(payload?.error ?? `Error ${res.status}`)
      return
    }
    // refetch by nudging same route
    router.refresh()
    // also update client data optimistically
    setData((prev) =>
      prev
        ? { ...prev, items: prev.items.map((p) => (p.id === id ? { ...p, isActive: false } : p)) }
        : prev
    )
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Productos (DB)</h1>
              <p className="text-sm text-muted-foreground">
                {data ? `${data.total} productos` : "-"}
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/products/new">Nuevo producto</Link>
            </Button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="Buscar por nombre o SKU"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters({ search, page: 1 })
                  }}
                />
                <Button variant="secondary" onClick={() => applyFilters({ search, page: 1 })}>
                  Buscar
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={isActive}
                  onChange={(e) => {
                    setIsActive(e.target.value)
                    applyFilters({ isActive: e.target.value, page: 1 })
                  }}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && data?.items?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        Sin resultados
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && data?.items?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.sku ?? "-"}</TableCell>
                      <TableCell className="text-right">{p.price.toLocaleString("es-AR")}</TableCell>
                      <TableCell className="text-right">{p.stock}</TableCell>
                      <TableCell>
                        {p.isActive ? (
                          <Badge variant="secondary">Activo</Badge>
                        ) : (
                          <Badge variant="outline">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/products/${p.id}`}>Editar</Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSoftDelete(p.id)}
                            disabled={!p.isActive}
                          >
                            Desactivar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {data.page} de {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => applyFilters({ page: Math.max(1, page - 1) })}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => applyFilters({ page: Math.min(data.totalPages, page + 1) })}
                    disabled={page >= data.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
