import "server-only"

import { createHash } from "node:crypto"
import { prisma } from "@/lib/db/prisma"
import { getSupabaseServerConfig } from "@/lib/supabase/config"
import {
  getSupabaseStorageImageIndex,
  resolveSupabaseProductImage,
} from "@/lib/supabase/product-storage"
import { supabaseServer } from "@/lib/supabase/server"
import {
  buildSupabaseImportPlan,
  type SupabaseImportProduct,
} from "@/lib/products/supabase-import-plan"

const PAGE_SIZE = 500
const MAX_PRODUCTS = 10_000
const PRODUCT_COLUMNS = [
  "id", "clave", "codigo", "descripcion", "marca", "aplicacion", "medidas",
  "ubicacion", "stock", "minimo", "costo", "venta", "notas", "serv",
  "tipo", "categoria", "marcas",
].join(",")

async function loadAllSupabaseProducts() {
  const { productsTable } = getSupabaseServerConfig()
  const products: Omit<SupabaseImportProduct, "imageUrl">[] = []

  for (let offset = 0; offset <= MAX_PRODUCTS; offset += PAGE_SIZE) {
    const { data, error } = await supabaseServer
      .from(productsTable)
      .select(PRODUCT_COLUMNS)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw new Error(`No se pudo leer el catálogo de Supabase (${error.code || "sin código"}).`)

    const page = (data || []) as unknown as Omit<SupabaseImportProduct, "imageUrl">[]
    products.push(...page)
    if (products.length > MAX_PRODUCTS) throw new Error("El catálogo supera el límite de importación segura.")
    if (page.length < PAGE_SIZE) break
  }

  return products
}

export async function prepareSupabaseProductImport() {
  const [remoteProducts, imageIndex, existingProducts] = await Promise.all([
    loadAllSupabaseProducts(),
    getSupabaseStorageImageIndex(),
    prisma.product.findMany({
      select: { id: true, sku: true, slug: true },
      orderBy: { id: "asc" },
    }),
  ])

  const withImages: SupabaseImportProduct[] = remoteProducts.map((product) => ({
    ...product,
    imageUrl: resolveSupabaseProductImage(
      imageIndex,
      product.id,
      product.clave,
      product.codigo,
    ),
  }))

  const plan = buildSupabaseImportPlan(withImages, existingProducts)
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ remoteProducts: withImages, existingProducts }))
    .digest("hex")

  return { ...plan, fingerprint }
}

export function summarizeSupabaseProductImport(
  plan: Awaited<ReturnType<typeof prepareSupabaseProductImport>>,
) {
  return {
    total: plan.total,
    alreadyPresent: plan.alreadyPresent,
    toCreate: plan.toCreate,
    withImage: plan.withImage,
    conflicts: plan.conflicts.slice(0, 20),
    conflictCount: plan.conflicts.length,
    fingerprint: plan.fingerprint,
    stockNotice: "El stock se copia una sola vez; no queda sincronizado con Supabase.",
  }
}
