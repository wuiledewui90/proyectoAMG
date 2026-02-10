// lib/products/product-serialize.ts
import type { Product } from "@prisma/client"

export type SerializedProduct = Omit<Product, "price" | "images"> & {
  price: number
  images: string[]
}

export function serializeProduct(p: Product): SerializedProduct {
  return {
    ...p,
    price: Number(p.price),
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
  }
}

export function serializeProducts(items: Product[]): SerializedProduct[] {
  return items.map(serializeProduct)
}
