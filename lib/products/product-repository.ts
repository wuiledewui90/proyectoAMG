// lib/products/product-repository.ts
import { prisma } from "@/lib/db/prisma"
import type { Product } from "@prisma/client"

// Home: productos destacados (limitados)
export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { id: "desc" },
    take: limit,
  })
}

// Catálogo: todos los productos activos
export async function getCatalogProducts(): Promise<Product[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { id: "desc" },
  })
}

// Alias por si ya usabas getAllProducts en otras partes
export async function getAllProducts(): Promise<Product[]> {
  return getCatalogProducts()
}

// Detalle: por slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return prisma.product.findUnique({
    where: { slug },
  })
}
