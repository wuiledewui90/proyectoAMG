import "server-only"

import { cache } from "react"
import { unstable_cache } from "next/cache"
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
import type { SerializedProduct } from "@/lib/products/product-serialize"

function publicProduct(product: SerializedProduct): SerializedProduct {
  // El costo y la ubicación del depósito son datos internos del ERP. Los
  // productos públicos se serializan en HTML y deben excluir esos valores.
  return { ...product, cost: 0, minimumStock: 0, location: null }
}

// MySQL es la única fuente de productos, precios y stock. Las URL de las
// imágenes pueden apuntar al bucket de Supabase, pero no se consulta su tabla.
export const getPublicCatalogProducts = cache(async () => {
  const products = await getCatalogProducts()
  return (await preferSupabaseProductImages(serializeProducts(products))).map(publicProduct)
})

const getCachedPublicFeaturedProducts = unstable_cache(async (limit: number) => {
  const products = await getFeaturedProducts(limit)
  return (await preferSupabaseProductImages(serializeProducts(products))).map(publicProduct)
}, ["public-featured-products-v1"], {
  revalidate: 300,
  tags: ["public-products"],
})

export async function getPublicFeaturedProducts(limit = 4) {
  return getCachedPublicFeaturedProducts(limit)
}

export async function getPublicProductBySlug(slug: string) {
  // Enlaces públicos anteriores usaban el prefijo "producto-". La importación
  // preservó el resto del slug, de modo que esos enlaces pueden seguir abriendo.
  const product = await getProductBySlug(slug)
    ?? (slug.startsWith("producto-")
      ? await getProductBySlug(`supabase-${slug.slice("producto-".length)}`)
      : null)

  return product?.isActive
    ? publicProduct(await preferSupabaseProductImage(serializeProduct(product)))
    : null
}
