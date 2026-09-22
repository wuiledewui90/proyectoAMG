import { NextResponse } from "next/server"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { z } from "zod"
import * as XLSX from "xlsx"
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { prisma } from "@/lib/db/prisma"
import * as service from "@/lib/products/product-service"
import { serializeProduct } from "@/lib/products/product-serialize"

export const dynamic = "force-dynamic"
export const revalidate = 0

type ImportRow = Record<string, unknown>

const MAX_IMPORT_ROWS = 1000

const columnAliases: Record<string, string> = {
  activo: "isActive",
  active: "isActive",
  categoria: "category",
  category: "category",
  codigo: "sku",
  code: "sku",
  compatibilidad: "compatibility",
  compatibility: "compatibility",
  descripcion: "description",
  description: "description",
  estado: "isActive",
  destacado: "isFeatured",
  destacada: "isFeatured",
  featured: "isFeatured",
  imagen: "imageUrl",
  image: "imageUrl",
  imageurl: "imageUrl",
  isactive: "isActive",
  isfeatured: "isFeatured",
  marca: "brand",
  brand: "brand",
  modelo: "model",
  model: "model",
  nombre: "name",
  name: "name",
  precio: "price",
  price: "price",
  contado: "price",
  sku: "sku",
  slug: "slug",
  stock: "stock",
  urlimagen: "imageUrl",
}

function getAdminTokenFromCookieHeader(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value
  const raw = String(value ?? "")
    .trim()
    .replace(/[\s\u00a0]/g, "")
    .replace(/[^0-9,.-]/g, "")

  const hasComma = raw.includes(",")
  const hasDot = raw.includes(".")
  const normalized =
    hasComma && hasDot
      ? raw.replace(/\./g, "").replace(",", ".")
      : hasComma
        ? /^-?\d{1,3}(,\d{3})+$/.test(raw)
          ? raw.replace(/,/g, "")
          : raw.replace(",", ".")
        : /^\d{1,3}(\.\d{3})+$/.test(raw)
          ? raw.replace(/\./g, "")
          : raw

  if (!normalized) return 0
  return Number(normalized)
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  if (!normalized) return true
  return !["false", "0", "no", "inactivo", "pausado"].includes(normalized)
}

function toStringValue(value: unknown) {
  return String(value ?? "").trim()
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function normalizeCategory(category: string, name: string) {
  const text = normalizeText(`${category} ${name}`)

  if (text.includes("kit") && text.includes("distribucion")) {
    return "Kits de Distribución"
  }

  if (text.includes("bomba")) {
    return "Bombas de Agua"
  }

  if (text.includes("electroventilador") || text.includes("electro ventilador")) {
    return "Electroventiladores"
  }

  if (text.includes("manguera")) {
    return "Mangueras"
  }

  if (text.includes("termostato")) {
    return "Termostatos"
  }

  if (text.includes("tapa")) {
    return "Tapas"
  }

  if (text.includes("correa")) {
    return "Correas"
  }

  if (text.includes("tensor")) {
    return "Tensores"
  }

  if (text.includes("calefaccion")) {
    return "Radiadores de Calefaccion"
  }

  if (category) return category
  return "Radiadores"
}

function normalizeRow(row: ImportRow) {
  const source = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  )

  const isAmgStockWorkbook =
    Object.hasOwn(source, "codigo") &&
    Object.hasOwn(source, "descripcion") &&
    Object.hasOwn(source, "contado")

  if (isAmgStockWorkbook) {
    const sku = toStringValue(source.codigo)
    const name = toStringValue(source.descripcion) || sku
    const stockType = toStringValue(source.tipo)
    const stockCategory = toStringValue(source.categoria)
    const brand = toStringValue(source.marca)
    const allBrands = toStringValue(source.marcas) || brand
    const application = toStringValue(source.aplicacion)
    const dimensions = toStringValue(source.medidas)
    const compatibility = Array.from(
      new Set([allBrands, application, dimensions].filter(Boolean))
    ).join(" · ")

    return {
      slug: slugify([name, sku].filter(Boolean).join(" ")),
      name,
      description: name,
      sku,
      brand: brand || allBrands.split(",")[0]?.trim() || "",
      model: application,
      category:
        stockCategory ||
        (normalizeText(stockType) === "servicio"
          ? "Servicios"
          : normalizeCategory("", `${stockType} ${name}`)),
      compatibility,
      price: toNumber(source.contado),
      stock: toNumber(source.stock),
      minimumStock: toNumber(source.minimo),
      cost: toNumber(source.costo),
      stockType,
      stockCategory,
      brands: allBrands,
      application,
      dimensions,
      location: toStringValue(source.ubicacion),
      imageUrl: "",
      images: [],
      isActive: true,
      isFeatured: false,
    }
  }

  const normalized: ImportRow = {}

  for (const [key, value] of Object.entries(row)) {
    const mappedKey = columnAliases[normalizeHeader(key)]
    if (mappedKey) normalized[mappedKey] = value
  }

  const name = toStringValue(normalized.name) || toStringValue(normalized.description)
  const slug = toStringValue(normalized.slug) || slugify(name)
  const imageUrl = toStringValue(normalized.imageUrl)
  const category = normalizeCategory(toStringValue(normalized.category), name)

  return {
    slug,
    name,
    description: toStringValue(normalized.description),
    sku: toStringValue(normalized.sku),
    brand: toStringValue(normalized.brand),
    model: toStringValue(normalized.model),
    category,
    compatibility: toStringValue(normalized.compatibility),
    price: toNumber(normalized.price),
    stock: toNumber(normalized.stock),
    imageUrl,
    images: imageUrl ? [imageUrl] : [],
    isActive: toBoolean(normalized.isActive),
    isFeatured: normalized.isFeatured ? toBoolean(normalized.isFeatured) : false,
  }
}

function isSummaryRow(row: ImportRow) {
  const source = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  )
  const code = normalizeHeader(toStringValue(source.codigo ?? source.sku))
  return (code === "total" || code === "totales") && !toStringValue(source.descripcion)
}

function getImportErrorMessage(err: unknown) {
  if (err instanceof service.ConflictError || err instanceof service.NotFoundError) {
    return err.message
  }

  if (err instanceof z.ZodError) {
    return err.issues.map((issue) => issue.message).join(", ")
  }

  if (err instanceof PrismaClientKnownRequestError && err.code === "P2000") {
    const column = err.meta?.column_name
    if (column === "description") {
      return "La descripcion es demasiado larga para la base de datos. Ejecuta la migracion nueva y vuelve a importar."
    }
    return `El valor de la columna ${String(column ?? "indicada")} es demasiado largo.`
  }

  if (err instanceof Error) {
    return err.message
  }

  return "Error inesperado"
}

async function findExistingProduct(row: { slug: string; sku: string }) {
  if (row.sku) {
    const product = await prisma.product.findFirst({ where: { sku: row.sku } })
    if (product) return product
  }

  if (row.slug) {
    return prisma.product.findUnique({ where: { slug: row.slug } })
  }

  return null
}

export async function POST(req: Request) {
  const token = getAdminTokenFromCookieHeader(req)
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
  }

  const extension = file.name.split(".").pop()?.toLowerCase()
  if (!extension || !["csv", "xls", "xlsx"].includes(extension)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa .xlsx, .xls o .csv" },
      { status: 400 }
    )
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" })
  const sheetName = workbook.SheetNames[0]
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined

  if (!sheet) {
    return NextResponse.json({ error: "El archivo no tiene hojas para importar" }, { status: 400 })
  }

  const sourceRows = XLSX.utils.sheet_to_json<ImportRow>(sheet, {
    defval: "",
    raw: true,
  })

  const rows = sourceRows
    .map((row, index) => ({
      row,
      rowNumber:
        typeof (row as ImportRow & { __rowNum__?: number }).__rowNum__ === "number"
          ? (row as ImportRow & { __rowNum__: number }).__rowNum__ + 1
          : index + 2,
    }))
    .filter(({ row }) => !isSummaryRow(row))

  if (rows.length === 0) {
    return NextResponse.json({ error: "El archivo no tiene productos" }, { status: 400 })
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    return NextResponse.json(
      { error: `El limite por importacion es ${MAX_IMPORT_ROWS} productos` },
      { status: 400 }
    )
  }

  const result = {
    created: 0,
    updated: 0,
    failed: 0,
    total: rows.length,
    errors: [] as Array<{ row: number; error: string }>,
    items: [] as unknown[],
  }
  const importedSkuOccurrences = new Map<string, number>()

  for (const { row: rawRow, rowNumber } of rows) {
    const payload = normalizeRow(rawRow)
    if (payload.sku) {
      const occurrence = (importedSkuOccurrences.get(payload.sku) ?? 0) + 1
      importedSkuOccurrences.set(payload.sku, occurrence)
      if (occurrence > 1) {
        payload.sku = `${payload.sku}-${occurrence}`
        payload.slug = slugify(`${payload.name} ${payload.sku}`)
      }
    }

    try {
      const existingProduct = await findExistingProduct(payload)
      const product = existingProduct
        ? await service.update(existingProduct.id, payload)
        : await service.create(payload)

      if (existingProduct) {
        result.updated += 1
      } else {
        result.created += 1
      }

      result.items.push(serializeProduct(product))
    } catch (err) {
      result.failed += 1
      result.errors.push({ row: rowNumber, error: getImportErrorMessage(err) })
    }
  }

  return NextResponse.json(result)
}
