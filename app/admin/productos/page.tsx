"use client"

import { useState } from "react"
import Image from "next/image"
import { RequireAuth } from "@/lib/admin-auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Plus, Pencil, Trash2, X, Save } from "lucide-react"
import { products as initialProducts, categories, brands, formatPrice } from "@/lib/data"
import type { Product } from "@/lib/data"

const emptyProduct: Product = {
  id: "",
  slug: "",
  name: "",
  description: "",
  price: 0,
  stock: 0,
  images: ["/images/radiador-1.jpg"],
  brand: "",
  model: "",
  category: "",
  compatibility: "",
  active: true,
}

export default function AdminProductsPage() {
  const [productList, setProductList] = useState<Product[]>(initialProducts)
  const [editing, setEditing] = useState<Product | null>(null)
  const [isNew, setIsNew] = useState(false)

  function handleNew() {
    setEditing({
      ...emptyProduct,
      id: `${Date.now()}`,
      slug: `producto-${Date.now()}`,
    })
    setIsNew(true)
  }

  function handleEdit(product: Product) {
    setEditing({ ...product })
    setIsNew(false)
  }

  function handleSave() {
    if (!editing) return
    if (isNew) {
      setProductList([...productList, editing])
    } else {
      setProductList(
        productList.map((p) => (p.id === editing.id ? editing : p))
      )
    }
    setEditing(null)
    setIsNew(false)
  }

  function handleDelete(id: string) {
    setProductList(productList.filter((p) => p.id !== id))
  }

  function handleToggle(id: string) {
    setProductList(
      productList.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p
      )
    )
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Productos</h1>
              <p className="text-sm text-muted-foreground">
                {productList.length} productos en total
              </p>
            </div>
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nuevo Producto
            </button>
          </div>

          <div className="p-6">
            {/* Edit / New modal */}
            {editing && (
              <div className="mb-6 rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    {isNew ? "Nuevo Producto" : "Editar Producto"}
                  </h2>
                  <button
                    onClick={() => {
                      setEditing(null)
                      setIsNew(false)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={editing.slug}
                      onChange={(e) =>
                        setEditing({ ...editing, slug: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Descripcion
                    </label>
                    <textarea
                      rows={3}
                      value={editing.description}
                      onChange={(e) =>
                        setEditing({ ...editing, description: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Precio (ARS)
                    </label>
                    <input
                      type="number"
                      value={editing.price}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          price: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={editing.stock}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          stock: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Marca
                    </label>
                    <select
                      value={editing.brand}
                      onChange={(e) =>
                        setEditing({ ...editing, brand: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Seleccionar</option>
                      {brands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={editing.model}
                      onChange={(e) =>
                        setEditing({ ...editing, model: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Categoria
                    </label>
                    <select
                      value={editing.category}
                      onChange={(e) =>
                        setEditing({ ...editing, category: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Seleccionar</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Compatibilidad
                    </label>
                    <input
                      type="text"
                      value={editing.compatibility}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          compatibility: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <input
                        type="checkbox"
                        checked={editing.active}
                        onChange={(e) =>
                          setEditing({ ...editing, active: e.target.checked })
                        }
                        className="rounded"
                      />
                      Producto activo
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4" />
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditing(null)
                      setIsNew(false)
                    }}
                    className="rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Products table */}
            <div className="rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Imagen
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Categoria
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Precio
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productList.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                            <Image
                              src={product.images[0] || "/placeholder.svg"}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.brand} {product.model}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {product.category}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {product.stock}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggle(product.id)}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.active
                                ? "bg-green-100 text-green-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {product.active ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(product)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label={`Editar ${product.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                              aria-label={`Eliminar ${product.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
