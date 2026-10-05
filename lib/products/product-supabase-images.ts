import "server-only"

import type { SerializedProduct } from "@/lib/products/product-serialize"
import {
  getSupabaseStorageImageIndex,
  resolveSupabaseProductImage,
} from "@/lib/supabase/product-storage"

export async function preferSupabaseProductImages<T extends SerializedProduct>(
  products: T[]
) {
  // La foto elegida y guardada en MySQL siempre tiene prioridad. Solo los
  // productos sin foto propia necesitan buscar una imagen heredada en Storage.
  if (!products.some((product) => !product.imageUrl || product.thumbnailUrl)) return products

  try {
    const imageIndex = await getSupabaseStorageImageIndex()
    return products.map((product) => {
      if (product.imageUrl && !product.thumbnailUrl) return product

      const imageUrl = resolveSupabaseProductImage(imageIndex, product.sku)
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
