import "server-only"

import { unstable_cache } from "next/cache"
import { getSupabaseServerConfig } from "@/lib/supabase/config"
import { supabaseServer } from "@/lib/supabase/server"

type ProductIdentity = {
  id: string
  clave: string | null
  codigo: string | null
}

type StorageImageIndex = Map<string, string>

function normalizedKeys(value: string | null | undefined) {
  const clean = String(value ?? "").trim().toLowerCase()
  if (!clean) return []

  return Array.from(
    new Set([
      clean,
      clean.replace(/[^a-z0-9._-]/g, "_"),
      clean.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    ].filter(Boolean))
  )
}

function objectStem(name: string) {
  return name.replace(/\.[^.]+$/, "").toLowerCase()
}

async function listRootImageObjects() {
  const { storageBucket } = getSupabaseServerConfig()
  const objects: string[] = []
  const pageSize = 100

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabaseServer.storage
      .from(storageBucket)
      .list("", {
        limit: pageSize,
        offset,
        sortBy: { column: "name", order: "asc" },
      })

    if (error) {
      throw new Error(`No se pudieron listar las imágenes de Supabase Storage (${error.message}).`)
    }

    const page = (data ?? []).filter((item) => Boolean(item.id)).map((item) => item.name)
    objects.push(...page)
    if ((data ?? []).length < pageSize) break
  }

  return objects
}

// Storage changes much less frequently than the product screens are opened.
// Keeping this list in Next's data cache avoids one remote request for every
// page of 100 products loaded by Ventas and Taller.
const getCachedRootImageObjects = unstable_cache(
  listRootImageObjects,
  ["supabase-product-storage-objects-v1"],
  {
    revalidate: 900,
    tags: ["supabase-product-images"],
  },
)

export async function getSupabaseStorageImageIndex(): Promise<StorageImageIndex> {
  const { storageBucket } = getSupabaseServerConfig()
  const imageIndex: StorageImageIndex = new Map()
  const objectNames = await getCachedRootImageObjects()

  for (const objectName of objectNames) {
    const { data } = supabaseServer.storage.from(storageBucket).getPublicUrl(objectName)
    imageIndex.set(objectStem(objectName), data.publicUrl)
  }

  return imageIndex
}

export function resolveSupabaseProductImage(
  imageIndex: StorageImageIndex,
  ...identifiers: Array<string | null | undefined>
) {
  for (const identifier of identifiers) {
    for (const key of normalizedKeys(identifier)) {
      const imageUrl = imageIndex.get(key)
      if (imageUrl) return imageUrl
    }
  }

  return null
}

export async function getSupabaseProductImagesByCode() {
  const { productsTable } = getSupabaseServerConfig()
  const [{ data, error }, imageIndex] = await Promise.all([
    supabaseServer
      .from(productsTable)
      .select("id,clave,codigo")
      .range(0, 999),
    getSupabaseStorageImageIndex(),
  ])

  if (error) {
    throw new Error(`No se pudo relacionar el catálogo con sus imágenes (${error.message}).`)
  }

  const imagesByCode = new Map<string, string>()
  for (const product of (data ?? []) as ProductIdentity[]) {
    const imageUrl = resolveSupabaseProductImage(
      imageIndex,
      product.id,
      product.clave,
      product.codigo
    )
    if (!imageUrl) continue

    for (const identifier of [product.clave, product.codigo]) {
      for (const key of normalizedKeys(identifier)) imagesByCode.set(key, imageUrl)
    }
  }

  return imagesByCode
}

export function findSupabaseProductImageByCode(
  imagesByCode: Map<string, string>,
  code: string | null | undefined
) {
  for (const key of normalizedKeys(code)) {
    const imageUrl = imagesByCode.get(key)
    if (imageUrl) return imageUrl
  }
  return null
}
