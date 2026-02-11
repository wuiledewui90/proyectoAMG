import { NextResponse } from "next/server"
import { Decimal, PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { prisma } from "@/lib/db/prisma"
import { isAdminAuthenticated } from "@/lib/admin/server-auth"

type RowError = {
  row: number
  message: string
}

type ImportSummary = {
  created: number
  updated: number
  errors: RowError[]
}

const MAX_ERRORS = 200
const REQUIRED_HEADERS = ["name", "slug", "price"]
const SUPPORTED_HEADERS = new Set([
  "name",
  "description",
  "sku",
  "brand",
  "model",
  "category",
  "compatibility",
  "slug",
  "imageurl",
  "images",
  "price",
  "stock",
  "isactive",
])

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9,.-]/g, "").trim()
  if (!cleaned) return null
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(/\./g, "")
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

function parseBoolean(raw?: string): boolean | undefined {
  if (raw === undefined) return undefined
  const normalized = raw.trim().toLowerCase()
  if (!normalized) return undefined
  if (normalized === "true" || normalized === "1") return true
  if (normalized === "false" || normalized === "0") return false
  return undefined
}

function parseImages(raw?: string): { images: string[]; provided: boolean; error?: string } {
  if (raw === undefined) return { images: [], provided: false }
  const trimmed = raw.trim()
  if (!trimmed) return { images: [], provided: false }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed)
      if (!Array.isArray(parsed)) {
        return { images: [], provided: true, error: "images no es un array" }
      }
      const images = parsed
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length)
      return { images, provided: true }
    } catch {
      return { images: [], provided: true, error: "images JSON invalido" }
    }
  }

  return { images: [trimmed], provided: true }
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]

    if (char === "\"") {
      const nextChar = content[i + 1]
      if (inQuotes && nextChar === "\"") {
        field += "\""
        i += 1
        continue
      }
      inQuotes = !inQuotes
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(field)
      field = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && content[i + 1] === "\n") {
        i += 1
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      continue
    }

    field += char
  }

  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData().catch(() => null)
    const file = formData?.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Archivo CSV requerido" }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "El archivo CSV esta vacio" }, { status: 400 })
    }

    const text = (await file.text()).replace(/^\uFEFF/, "")
    const rows = parseCsv(text)

    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV sin datos" }, { status: 400 })
    }

    const headers = rows[0].map((value) => value.trim().toLowerCase())
    const headerMap = new Map<string, number>()
    headers.forEach((header, index) => {
      if (!header) return
      if (!SUPPORTED_HEADERS.has(header)) return
      headerMap.set(header, index)
    })

    const missing = REQUIRED_HEADERS.filter((header) => !headerMap.has(header))
    if (missing.length) {
      return NextResponse.json(
        { error: `Faltan headers: ${missing.join(", ")}` },
        { status: 400 }
      )
    }

    let created = 0
    let updated = 0
    const errors: RowError[] = []

    for (let i = 1; i < rows.length; i += 1) {
      const rawRow = rows[i]
      const rowNumber = i + 1

      if (rawRow.every((cell) => !cell || !cell.trim())) {
        continue
      }

      const getValue = (key: string) => {
        const index = headerMap.get(key)
        return index === undefined ? "" : rawRow[index] ?? ""
      }

    const name = getValue("name").trim()
    const slug = getValue("slug").trim()
    const priceRaw = getValue("price").trim()

    if (!name || !slug || !priceRaw) {
      if (errors.length < MAX_ERRORS) {
        errors.push({ row: rowNumber, message: "name, slug y price son requeridos" })
      }
      continue
    }

    const price = parsePrice(priceRaw)
    if (price === null) {
      if (errors.length < MAX_ERRORS) {
        errors.push({ row: rowNumber, message: "price invalido" })
      }
      continue
    }

    const stockRaw = getValue("stock").trim()
    const stockValue = stockRaw ? Number.parseInt(stockRaw, 10) : null
    if (stockValue !== null && (!Number.isFinite(stockValue) || stockValue < 0)) {
      if (errors.length < MAX_ERRORS) {
        errors.push({ row: rowNumber, message: "stock invalido" })
      }
      continue
    }

    const isActiveRaw = getValue("isactive")
    const isActiveParsed = parseBoolean(isActiveRaw)
    if (isActiveRaw.trim() && isActiveParsed === undefined) {
      if (errors.length < MAX_ERRORS) {
        errors.push({ row: rowNumber, message: "isActive invalido" })
      }
      continue
    }

    const imagesResult = parseImages(getValue("images"))
    if (imagesResult.error) {
      if (errors.length < MAX_ERRORS) {
        errors.push({ row: rowNumber, message: imagesResult.error })
      }
      continue
    }

    const imageUrl = normalizeOptionalString(getValue("imageurl"))
    const hasImageUrl = imageUrl !== undefined

    const imagesForCreate = imagesResult.images.length
      ? imagesResult.images
      : imageUrl
        ? [imageUrl]
        : []

    const imageUrlForCreate = imageUrl ?? imagesForCreate[0]

    const sku = normalizeOptionalString(getValue("sku"))
    const lookupSku = sku ?? undefined

    try {
      const existing = lookupSku
        ? await prisma.product.findUnique({ where: { sku: lookupSku } })
        : await prisma.product.findUnique({ where: { slug } })

    const baseData = {
      name,
      slug,
      description: normalizeOptionalString(getValue("description")),
      sku,
      brand: normalizeOptionalString(getValue("brand")),
      model: normalizeOptionalString(getValue("model")),
      category: normalizeOptionalString(getValue("category")),
      compatibility: normalizeOptionalString(getValue("compatibility")),
      price: new Decimal(price),
    }

      if (existing) {
        const updateData: Record<string, unknown> = { ...baseData }
        if (stockValue !== null) updateData.stock = stockValue
        if (isActiveParsed !== undefined) updateData.isActive = isActiveParsed

        if (imagesResult.provided || hasImageUrl) {
          const imagesForUpdate = imagesResult.images.length
            ? imagesResult.images
            : imageUrl
              ? [imageUrl]
              : []
          updateData.images = imagesForUpdate
          updateData.imageUrl = imageUrl ?? imagesForUpdate[0]
        }

        await prisma.product.update({ where: { id: existing.id }, data: updateData })
        updated += 1
      } else {
        const createData = {
          ...baseData,
          stock: stockValue ?? 0,
          isActive: isActiveParsed ?? true,
          images: imagesForCreate,
          imageUrl: imageUrlForCreate,
        }
        await prisma.product.create({ data: createData })
        created += 1
      }
    } catch (err) {
      if (errors.length < MAX_ERRORS) {
        if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
          errors.push({ row: rowNumber, message: "SKU o slug ya existe" })
        } else {
          errors.push({ row: rowNumber, message: "Error al guardar la fila" })
        }
      }
    }
    }

    const summary: ImportSummary = { created, updated, errors }
    return NextResponse.json(summary)
  } catch (err) {
    console.error("[csv import] error", err)
    const message = err instanceof Error ? err.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
