import { prisma } from "@/lib/db/prisma"
import type { Product } from "@prisma/client"

export async function listProducts(params: {
  search?: string
  isActive?: boolean
  brand?: string
  category?: string
  page: number
  limit: number
}) {
  const { search, isActive, brand, category, page, limit } = params

  const where: any = {
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(brand ? { brand } : {}),
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { sku: { contains: search } },
            { slug: { contains: search } },
          ],
        }
      : {}),
  }

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return { total, items }
}

export async function getProductById(id: number) {
  return prisma.product.findUnique({ where: { id } })
}

export async function createProduct(data: any) {
  return prisma.product.create({ data })
}

export async function updateProduct(id: number, data: any) {
  return prisma.product.update({ where: { id }, data })
}

export async function softDeleteProduct(id: number) {
  return prisma.product.update({ where: { id }, data: { isActive: false } })
}

export async function deleteProduct(id: number) {
  return prisma.product.delete({ where: { id } })
}

// Home: productos destacados (limitados)
export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  })
}

// Catálogo: todos los productos activos
export async function getCatalogProducts(): Promise<Product[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
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
