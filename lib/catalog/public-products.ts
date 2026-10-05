import "server-only"

import { cache } from "react"

import {
  getCatalogProducts as getLocalCatalogProducts,
  getFeaturedProducts as getLocalFeaturedProducts,
  getProductBySlug as getLocalProductBySlug,
} from "@/lib/products/product-repository"
import {
  serializeProduct,
  serializeProducts,
  type SerializedProduct,
} from "@/lib/products/product-serialize"
import { getSupabaseServerConfig } from "@/lib/supabase/config"
import {
  getSupabaseStorageImageIndex,
  resolveSupabaseProductImage,
} from "@/lib/supabase/product-storage"
import { supabaseServer } from "@/lib/supabase/server"

type SupabaseProductRow = {
  id: string
  clave: string | null
  codigo: string | null
  descripcion: string | null
  marca: string | null
  aplicacion: string | null
  medidas: string | null
  ubicacion: string | null
  stock: number | null
  minimo: number | null
  costo: number | string | null
  venta: number | string | null
  notas: string | null
  serv: boolean | null
  actualizado: string | null
  tipo: string | null
  categoria: string | null
  marcas: string[] | string | null
}

const PRODUCT_COLUMNS = [
  "id",
  "clave",
  "codigo",
  "descripcion",
  "marca",
  "aplicacion",
  "medidas",
  "ubicacion",
  "stock",
  "minimo",
  "costo",
  "venta",
  "notas",
  "serv",
  "actualizado",
  "tipo",
  "categoria",
  "marcas",
].join(",")

function clean(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized?.length ? normalized : null
}

function cleanList(value: string[] | string | null) {
  if (Array.isArray(value)) {
    const values = value.map(clean).filter((item): item is string => Boolean(item))
    return values.length ? values.join(", ") : null
  }
  return clean(value)
}

function slugPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
}

function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function numericProductId(id: string) {
  const value = stableHash(id) & 0x7fffffff
  return -(value || 1)
}

function resolveCategory(row: SupabaseProductRow) {
  const category = clean(row.categoria)
  if (category) return category

  const type = clean(row.tipo)?.toLowerCase()
  if (row.serv || type === "servicio" || clean(row.marca)?.toLowerCase() === "servicio") {
    return "Servicios"
  }
  if (type === "radiador") return "Radiadores"
  return "Repuestos"
}

function toNumber(value: number | string | null) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function mapSupabaseProduct(
  row: SupabaseProductRow,
  imageIndex: Awaited<ReturnType<typeof getSupabaseStorageImageIndex>>
): SerializedProduct {
  const code = clean(row.codigo) ?? clean(row.clave) ?? row.id
  const name = clean(row.descripcion) ?? code
  const hash = stableHash(row.id).toString(36)
  const slug = `producto-${slugPart(code || name) || "amg"}-${hash}`
  const application = clean(row.aplicacion)
  const dimensions = clean(row.medidas)
  const notes = clean(row.notas)
  const updatedAt = row.actualizado ? new Date(row.actualizado) : new Date(0)
  const imageUrl = resolveSupabaseProductImage(imageIndex, row.id, row.clave, row.codigo)
  const images = imageUrl ? [imageUrl] : []

  return {
    id: numericProductId(row.id),
    name,
    description: notes ?? application ?? `Repuesto ${code} para el sistema de refrigeración.`,
    sku: code,
    brand: clean(row.marca),
    model: null,
    category: resolveCategory(row),
    compatibility: [application, dimensions].filter(Boolean).join(" · ") || null,
    slug,
    images,
    imageUrl,
    thumbnailUrl: imageUrl ?? undefined,
    price: toNumber(row.venta),
    stock: Math.max(0, Number(row.stock ?? 0)),
    minimumStock: Math.max(0, Number(row.minimo ?? 0)),
    cost: 0,
    stockType: clean(row.tipo),
    stockCategory: clean(row.categoria),
    brands: cleanList(row.marcas),
    application,
    dimensions,
    location: clean(row.ubicacion),
    isActive: true,
    isFeatured: false,
    createdAt: updatedAt,
    updatedAt,
    source: "supabase",
    externalId: row.id,
  }
}

const loadSupabaseProducts = cache(async (): Promise<SerializedProduct[]> => {
  const { productsTable } = getSupabaseServerConfig()
  const [{ data, error }, imageIndex] = await Promise.all([
    supabaseServer
      .from(productsTable)
      .select(PRODUCT_COLUMNS)
      .order("codigo", { ascending: true })
      .range(0, 999),
    getSupabaseStorageImageIndex(),
  ])

  if (error) {
    throw new Error(`No se pudo leer el catálogo de Supabase (${error.code ?? "sin código"}).`)
  }

  return ((data ?? []) as unknown as SupabaseProductRow[]).map((row) =>
    mapSupabaseProduct(row, imageIndex)
  )
})

export async function getPublicCatalogProducts() {
  try {
    const products = await loadSupabaseProducts()
    if (products.length) return products
  } catch (error) {
    console.error("[catalog] Supabase no disponible; se usa el catálogo local.", error)
  }

  return serializeProducts(await getLocalCatalogProducts())
}

export async function getPublicFeaturedProducts(limit = 4) {
  try {
    const products = await loadSupabaseProducts()
    const prioritized = products
      .filter((product) => product.images.length > 0)
      .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0))

    if (prioritized.length) return prioritized.slice(0, limit)
  } catch (error) {
    console.error("[catalog] No se pudieron cargar destacados de Supabase.", error)
  }

  return serializeProducts(await getLocalFeaturedProducts(limit))
}

export async function getPublicProductBySlug(slug: string) {
  try {
    const products = await loadSupabaseProducts()
    const product = products.find((item) => item.slug === slug)
    if (product) return product
  } catch (error) {
    console.error("[catalog] No se pudo cargar el detalle desde Supabase.", error)
  }

  const localProduct = await getLocalProductBySlug(slug)
  return localProduct ? serializeProduct(localProduct) : null
}
