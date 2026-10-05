import type { Prisma } from "@prisma/client"

export type SupabaseImportProduct = {
  id: string
  clave: string | null
  codigo: string | null
  descripcion: string | null
  marca: string | null
  aplicacion: string | null
  medidas: string | null
  ubicacion: string | null
  stock: number | null
  minimo: number | null
  costo: number | string | null
  venta: number | string | null
  notas: string | null
  serv: boolean | null
  tipo: string | null
  categoria: string | null
  marcas: string[] | string | null
  imageUrl: string | null
}

export type ExistingImportProduct = {
  id: number
  sku: string | null
  slug: string
}

function clean(value: string | null | undefined) {
  return value?.trim() || null
}

function key(value: string | null | undefined) {
  return clean(value)?.toLocaleLowerCase("es") || null
}

function capped(value: string | null | undefined, length = 191) {
  return clean(value)?.slice(0, length) || null
}

function slugPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
}

function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function nonNegativeNumber(value: number | string | null) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function nonNegativeInteger(value: number | null) {
  return Math.min(2_147_483_647, Math.floor(nonNegativeNumber(value)))
}

function categoryFor(product: SupabaseImportProduct) {
  if (clean(product.categoria)) return capped(product.categoria)
  if (product.serv || key(product.tipo) === "servicio") return "Servicios"
  if (key(product.tipo) === "radiador") return "Radiadores"
  return "Repuestos"
}

export function buildSupabaseImportPlan(
  remoteProducts: SupabaseImportProduct[],
  existingProducts: ExistingImportProduct[],
) {
  const existingCodes = new Set(existingProducts.map((product) => key(product.sku)).filter(Boolean))
  const existingSlugs = new Set(existingProducts.map((product) => product.slug))
  const seenRemoteCodes = new Set<string>()
  const candidates: Prisma.productCreateManyInput[] = []
  const conflicts: Array<{ code: string; reason: string }> = []
  let alreadyPresent = 0
  let withImage = 0

  for (const product of remoteProducts) {
    const code = clean(product.codigo) || clean(product.clave)
    if (!code || !clean(product.id)) {
      conflicts.push({ code: code || "Sin código", reason: "Falta código o identificador" })
      continue
    }

    const aliases = [product.codigo, product.clave]
      .map(key)
      .filter((value): value is string => Boolean(value))

    if (aliases.some((alias) => seenRemoteCodes.has(alias))) {
      conflicts.push({ code, reason: "Código repetido en Supabase" })
      continue
    }
    aliases.forEach((alias) => seenRemoteCodes.add(alias))

    if (aliases.some((alias) => existingCodes.has(alias))) {
      alreadyPresent += 1
      continue
    }

    const slug = `supabase-${slugPart(code) || "producto"}-${stableHash(product.id)}`
    if (existingSlugs.has(slug)) {
      conflicts.push({ code, reason: "Slug ya utilizado en el ERP" })
      continue
    }

    const name = capped(product.descripcion) || capped(code) || "Producto"
    const imageUrl = clean(product.imageUrl)
    const brandList = Array.isArray(product.marcas)
      ? product.marcas.map((value) => clean(value)).filter(Boolean).join(", ")
      : clean(product.marcas)
    const application = clean(product.aplicacion)
    const dimensions = clean(product.medidas)

    candidates.push({
      slug,
      name,
      description: clean(product.notas) || application || name,
      sku: capped(code),
      brand: capped(product.marca),
      model: capped(application),
      category: categoryFor(product),
      compatibility: capped([application, dimensions].filter(Boolean).join(" · ")),
      images: JSON.stringify(imageUrl ? [imageUrl] : []),
      imageUrl,
      price: nonNegativeNumber(product.venta),
      stock: nonNegativeInteger(product.stock),
      minimumStock: nonNegativeInteger(product.minimo),
      cost: nonNegativeNumber(product.costo),
      stockType: capped(product.tipo, 40),
      stockCategory: capped(product.categoria, 120),
      brands: capped(brandList, 255),
      application,
      dimensions: capped(dimensions),
      location: capped(product.ubicacion),
      isActive: true,
      isFeatured: false,
      updatedAt: new Date(),
    })

    existingSlugs.add(slug)
    existingCodes.add(key(code)!)
    if (imageUrl) withImage += 1
  }

  return {
    total: remoteProducts.length,
    alreadyPresent,
    toCreate: candidates.length,
    withImage,
    conflicts,
    candidates,
  }
}
