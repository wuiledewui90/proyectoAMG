// lib/products/product-serialize.ts
import type { product as Product } from "@prisma/client"

export type SerializedProduct = Omit<Product, "price" | "images"> & {
  price: number
  images: string[]
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
  return {
    ...p,
    price: Number(p.price),
    images: parseProductImages(p.images, p.imageUrl),
  }
}

export function serializeProducts(items: Product[]): SerializedProduct[] {
  return items.map(serializeProduct)
}
