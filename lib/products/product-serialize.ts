// lib/products/product-serialize.ts
import type { product as Product } from "@prisma/client"

import { resolveCatalogProductImages } from "@/lib/catalog/product-images"

export type SerializedProduct = Omit<Product, "price" | "cost" | "images"> & {
  price: number
  cost: number
  images: string[]
  thumbnailUrl?: string
  source?: "local" | "supabase"
  externalId?: string
}

export function parseProductImages(images: string | null | undefined, fallback?: string | null) {
  const raw = images?.trim()
  if (!raw) return fallback ? [fallback] : []

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    }
  } catch {
    // Legacy rows may contain a single URL/path instead of JSON.
  }

  return [raw]
}

export function stringifyProductImages(images: string[] | undefined, fallback?: string) {
  const normalized = images?.filter((item) => item.trim().length > 0)
  const values = normalized?.length ? normalized : fallback ? [fallback] : []
  return JSON.stringify(values)
}

export function serializeProduct(p: Product): SerializedProduct {
  const storedImages = parseProductImages(p.images, p.imageUrl)
  const catalogImages = resolveCatalogProductImages(p.sku)
  const hasStoredImage = storedImages.length > 0 || Boolean(p.imageUrl)
  const images = storedImages.length
    ? storedImages
    : p.imageUrl
      ? [p.imageUrl]
      : catalogImages.images

  return {
    ...p,
    price: Number(p.price),
    cost: Number(p.cost),
    images,
    imageUrl: p.imageUrl ?? images[0] ?? null,
    thumbnailUrl: hasStoredImage ? undefined : catalogImages.thumbnailUrl,
    source: "local",
  }
}

export function serializeProducts(items: Product[]): SerializedProduct[] {
  return items.map(serializeProduct)
}
