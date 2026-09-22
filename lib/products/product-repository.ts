import { prisma } from "@/lib/db/prisma"
import type { Prisma, product as Product } from "@prisma/client"

export async function listProducts(params: {
  search?: string
  category?: string
  brand?: string
  isActive?: boolean
  page: number
  limit: number
}) {
  const { search, category, brand, isActive, page, limit } = params

  const where: Prisma.productWhereInput = {
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(category ? { category } : {}),
    ...(brand ? { brand } : {}),
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

export async function getProductFilterOptions() {
  const items = await prisma.product.findMany({
    select: { category: true, brand: true },
  })

  return {
    categories: Array.from(
      new Set(items.map((item) => item.category?.trim()).filter((value): value is string => Boolean(value)))
    ).sort((a, b) => a.localeCompare(b, "es")),
    brands: Array.from(
      new Set(items.map((item) => item.brand?.trim()).filter((value): value is string => Boolean(value)))
    ).sort((a, b) => a.localeCompare(b, "es")),
  }
}

export async function getProductById(id: number) {
  return prisma.product.findUnique({ where: { id } })
}

export async function createProduct(data: Prisma.productUncheckedCreateInput) {
  return prisma.product.create({ data })
}

export async function updateProduct(id: number, data: Prisma.productUncheckedUpdateInput) {
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
  const featured = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  })

  if (featured.length > 0) return featured

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
