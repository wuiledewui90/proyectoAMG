import { Decimal, PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { z } from "zod"
import { productCreateSchema, productUpdateSchema } from "@/lib/products/product-schemas"
import * as repo from "@/lib/products/product-repository"

export class ConflictError extends Error {
  status = 409
}

export class NotFoundError extends Error {
  status = 404
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

export async function list(params: {
  search?: string
  isActive?: boolean
  page: number
  limit: number
}) {
  return repo.listProducts(params)
}

export async function getById(id: number) {
  const product = await repo.getProductById(id)
  if (!product) throw new NotFoundError("Producto no encontrado")
  return product
}

export async function create(input: unknown) {
  const parsed = productCreateSchema.parse(input)

  const normalizedImages =
    parsed.images ??
    (parsed.imageUrl && parsed.imageUrl.trim().length ? [parsed.imageUrl.trim()] : [])

  const data = {
    slug: parsed.slug,
    name: parsed.name,
    description: normalizeOptionalString(parsed.description),
    sku: normalizeOptionalString(parsed.sku),
    price: new Decimal(parsed.price),
    stock: parsed.stock ?? 0,
    isActive: parsed.isActive ?? true,
    brand: normalizeOptionalString(parsed.brand),
    model: normalizeOptionalString(parsed.model),
    category: normalizeOptionalString(parsed.category),
    compatibility: normalizeOptionalString(parsed.compatibility),
    images: normalizedImages,
    imageUrl: normalizeOptionalString(parsed.imageUrl),
  }

  try {
    return await repo.createProduct(data)
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("SKU o slug ya existe")
    }
    if (err instanceof z.ZodError) throw err
    throw err
  }
}

export async function update(id: number, input: unknown) {
  const parsed = productUpdateSchema.parse(input)

  const normalizedImages =
    parsed.images ??
    (parsed.imageUrl !== undefined
      ? parsed.imageUrl && parsed.imageUrl.trim().length
        ? [parsed.imageUrl.trim()]
        : []
      : undefined)

  const data = {
    ...(parsed.slug !== undefined ? { slug: parsed.slug } : {}),
    ...(parsed.name !== undefined ? { name: parsed.name } : {}),
    ...(parsed.description !== undefined
      ? { description: normalizeOptionalString(parsed.description) }
      : {}),
    ...(parsed.sku !== undefined ? { sku: normalizeOptionalString(parsed.sku) } : {}),
    ...(parsed.price !== undefined ? { price: new Decimal(parsed.price) } : {}),
    ...(parsed.stock !== undefined ? { stock: parsed.stock } : {}),
    ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
    ...(parsed.brand !== undefined ? { brand: normalizeOptionalString(parsed.brand) } : {}),
    ...(parsed.model !== undefined ? { model: normalizeOptionalString(parsed.model) } : {}),
    ...(parsed.category !== undefined ? { category: normalizeOptionalString(parsed.category) } : {}),
    ...(parsed.compatibility !== undefined
      ? { compatibility: normalizeOptionalString(parsed.compatibility) }
      : {}),
    ...(normalizedImages !== undefined ? { images: normalizedImages } : {}),
    ...(parsed.imageUrl !== undefined ? { imageUrl: normalizeOptionalString(parsed.imageUrl) } : {}),
  }

  try {
    return await repo.updateProduct(id, data)
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Producto no encontrado")
    }
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("SKU o slug ya existe")
    }
    if (err instanceof z.ZodError) throw err
    throw err
  }
}

export async function softDelete(id: number) {
  try {
    return await repo.softDeleteProduct(id)
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Producto no encontrado")
    }
    throw err
  }
}
