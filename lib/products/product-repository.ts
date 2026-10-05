import { prisma } from "@/lib/db/prisma"
import type { Prisma, product as Product } from "@prisma/client"

export class StockAdjustmentConflictError extends Error {}
export class StockAdjustmentReasonError extends Error {}
export class ProductNotFoundError extends Error {}

type StockAudit = { actorId?: string | null; reason?: string }

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

export async function createProduct(data: Prisma.productUncheckedCreateInput, audit: StockAudit = {}) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.product.create({ data })
    if (created.stock > 0) {
      await tx.stockMovement.create({
        data: {
          productId: created.id,
          createdById: audit.actorId || null,
          type: "ADJUSTMENT",
          quantity: created.stock,
          previousStock: 0,
          newStock: created.stock,
          notes: audit.reason?.slice(0, 255) || "Carga inicial de inventario",
        },
      })
    }
    return created
  })
}

export async function updateProduct(
  id: number,
  data: Prisma.productUncheckedUpdateInput,
  nextStock?: number,
  audit: StockAudit = {},
) {
  if (nextStock === undefined) return prisma.product.update({ where: { id }, data })

  return prisma.$transaction(async (tx) => {
    const current = await tx.product.findUnique({ where: { id }, select: { stock: true } })
    if (!current) throw new ProductNotFoundError("Producto no encontrado")
    if (nextStock !== current.stock && (!audit.reason || audit.reason.trim().length < 5)) {
      throw new StockAdjustmentReasonError("Indicá un motivo de al menos 5 caracteres para cambiar el stock.")
    }

    // The compare-and-set prevents an edit form from overwriting a concurrent sale.
    const updated = await tx.product.updateMany({
      where: { id, stock: current.stock },
      data,
    })
    if (updated.count !== 1) {
      throw new StockAdjustmentConflictError("El stock cambió durante la edición. Recargá el producto y volvé a intentar.")
    }

    if (nextStock !== current.stock) {
      await tx.stockMovement.create({
        data: {
          productId: id,
          createdById: audit.actorId || null,
          type: "ADJUSTMENT",
          quantity: nextStock - current.stock,
          previousStock: current.stock,
          newStock: nextStock,
          notes: audit.reason!.trim().slice(0, 255),
        },
      })
    }
    return tx.product.findUniqueOrThrow({ where: { id } })
  })
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
