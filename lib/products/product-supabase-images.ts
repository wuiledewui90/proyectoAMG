import "server-only"

import type { SerializedProduct } from "@/lib/products/product-serialize"
import {
  findSupabaseProductImageByCode,
  getSupabaseProductImagesByCode,
} from "@/lib/supabase/product-storage"

export async function preferSupabaseProductImages<T extends SerializedProduct>(
  products: T[]
) {
  if (products.length === 0) return products

  try {
    const imagesByCode = await getSupabaseProductImagesByCode()
    return products.map((product) => {
      const imageUrl = findSupabaseProductImageByCode(imagesByCode, product.sku)
      if (!imageUrl) return product

      return {
        ...product,
        images: [imageUrl],
        imageUrl,
        thumbnailUrl: imageUrl,
      }
    })
  } catch (error) {
    console.error("[products] No se pudieron relacionar las imágenes de Supabase.", error)
    return products
  }
}

export async function preferSupabaseProductImage<T extends SerializedProduct>(product: T) {
  const [resolved] = await preferSupabaseProductImages([product])
  return resolved
}
