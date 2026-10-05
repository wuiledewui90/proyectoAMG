import "server-only"

import { cache } from "react"
import {
  getCatalogProducts,
  getFeaturedProducts,
  getProductBySlug,
} from "@/lib/products/product-repository"
import {
  serializeProduct,
  serializeProducts,
} from "@/lib/products/product-serialize"
import {
  preferSupabaseProductImage,
  preferSupabaseProductImages,
} from "@/lib/products/product-supabase-images"

// MySQL es la única fuente de productos, precios y stock. Las URL de las
// imágenes pueden apuntar al bucket de Supabase, pero no se consulta su tabla.
export const getPublicCatalogProducts = cache(async () => {
  const products = await getCatalogProducts()
  return preferSupabaseProductImages(serializeProducts(products))
})

export async function getPublicFeaturedProducts(limit = 4) {
  const products = await getFeaturedProducts(limit)
  return preferSupabaseProductImages(serializeProducts(products))
}

export async function getPublicProductBySlug(slug: string) {
  // Enlaces públicos anteriores usaban el prefijo "producto-". La importación
  // preservó el resto del slug, de modo que esos enlaces pueden seguir abriendo.
  const product = await getProductBySlug(slug)
    ?? (slug.startsWith("producto-")
      ? await getProductBySlug(`supabase-${slug.slice("producto-".length)}`)
      : null)

  return product?.isActive ? preferSupabaseProductImage(serializeProduct(product)) : null
}
