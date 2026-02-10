import { Prisma } from "@prisma/client"
import {
  productCreateSchema,
  productUpdateSchema,
  type ProductCreateInput,
  type ProductUpdateInput,
} from "@/lib/products/product-schemas"
import * as repo from "@/lib/products/product-repository"

export class ConflictError extends Error {
  status = 409
}

export class NotFoundError extends Error {
  status = 404
}

function normalizeOptionalString(value: string | undefined) {
  if (value === undefined) return undefined
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

export async function create(input: ProductCreateInput) {
  const parsed = productCreateSchema.parse(input)

  const data: Prisma.ProductCreateInput = {
    name: parsed.name,
    description: normalizeOptionalString(parsed.description),
    sku: normalizeOptionalString(parsed.sku),
    price: new Prisma.Decimal(parsed.price),
    stock: parsed.stock ?? 0,
    isActive: parsed.isActive ?? true,
    imageUrl: normalizeOptionalString(parsed.imageUrl),
  }

  try {
    return await repo.createProduct(data)
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ConflictError("SKU ya existe")
    }
    throw err
  }
}

export async function update(id: number, input: ProductUpdateInput) {
  const parsed = productUpdateSchema.parse(input)

  const data: Prisma.ProductUpdateInput = {
    ...(parsed.name !== undefined ? { name: parsed.name } : {}),
    ...(parsed.description !== undefined
      ? { description: normalizeOptionalString(parsed.description) }
      : {}),
    ...(parsed.sku !== undefined ? { sku: normalizeOptionalString(parsed.sku) } : {}),
    ...(parsed.price !== undefined
      ? { price: new Prisma.Decimal(parsed.price) }
      : {}),
    ...(parsed.stock !== undefined ? { stock: parsed.stock } : {}),
    ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
    ...(parsed.imageUrl !== undefined
      ? { imageUrl: normalizeOptionalString(parsed.imageUrl) }
      : {}),
  }

  try {
    return await repo.updateProduct(id, data)
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new NotFoundError("Producto no encontrado")
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ConflictError("SKU ya existe")
    }
    throw err
  }
}

export async function softDelete(id: number) {
  try {
    return await repo.softDeleteProduct(id)
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new NotFoundError("Producto no encontrado")
    }
    throw err
  }
}
