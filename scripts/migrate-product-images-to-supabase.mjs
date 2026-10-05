import { readFile, stat } from "node:fs/promises"
import path from "node:path"

import { PrismaClient } from "@prisma/client"
import { createClient } from "@supabase/supabase-js"

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta configurar ${name}.`)
  return value
}

function keys(value) {
  const clean = String(value ?? "").trim().toLowerCase()
  if (!clean) return []
  return Array.from(new Set([
    clean,
    clean.replace(/[^a-z0-9._-]/g, "_"),
    clean.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
  ].filter(Boolean)))
}

function safeName(value) {
  return String(value ?? "producto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "producto"
}

async function existingFile(filePath) {
  try {
    const details = await stat(filePath)
    return details.isFile() ? filePath : null
  } catch {
    return null
  }
}

const prisma = new PrismaClient()
const supabaseUrl = required("SUPABASE_URL")
const supabase = createClient(supabaseUrl, required("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
})
const productsTable = process.env.SUPABASE_PRODUCTS_TABLE?.trim() || "productos"
const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "fotos"
const publicRoot = path.resolve(process.cwd(), "public")

try {
  const [{ data: remoteProducts, error: productsError }, { data: objects, error: storageError }, localProducts] =
    await Promise.all([
      supabase.from(productsTable).select("id,clave,codigo").range(0, 999),
      supabase.storage.from(bucket).list("", { limit: 1000 }),
      prisma.product.findMany({ select: { id: true, sku: true, imageUrl: true } }),
    ])

  if (productsError) throw productsError
  if (storageError) throw storageError

  const objectByStem = new Map(
    (objects ?? [])
      .filter((item) => item.id)
      .map((item) => [item.name.replace(/\.[^.]+$/, "").toLowerCase(), item.name])
  )
  const remoteImageByCode = new Map()

  for (const product of remoteProducts ?? []) {
    const candidates = [product.id, product.clave, product.codigo].flatMap(keys)
    const objectName = candidates.map((candidate) => objectByStem.get(candidate)).find(Boolean)
    if (!objectName) continue
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectName)
    for (const code of [product.clave, product.codigo].flatMap(keys)) {
      remoteImageByCode.set(code, data.publicUrl)
    }
  }

  let linked = 0
  let uploaded = 0
  let withoutImage = 0
  let clearedInvalid = 0

  for (const product of localProducts) {
    const linkedUrl = keys(product.sku).map((key) => remoteImageByCode.get(key)).find(Boolean)
    let publicUrl = linkedUrl

    if (!publicUrl && product.imageUrl?.startsWith(`${supabaseUrl}/storage/`)) {
      publicUrl = product.imageUrl
    }

    if (!publicUrl) {
      const localCandidates = []
      if (product.imageUrl?.startsWith("/")) {
        localCandidates.push(path.resolve(publicRoot, product.imageUrl.replace(/^[/\\]+/, "")))
      }
      for (const stem of keys(product.sku)) {
        localCandidates.push(path.resolve(publicRoot, "images", "catalog-products", `${stem}.jpg`))
      }

      let sourcePath = null
      for (const candidate of localCandidates) {
        if (!candidate.startsWith(`${publicRoot}${path.sep}`)) continue
        sourcePath = await existingFile(candidate)
        if (sourcePath) break
      }

      if (sourcePath) {
        const extension = path.extname(sourcePath).toLowerCase().replace(".", "") || "jpg"
        const objectPath = `erp/imported/${safeName(product.sku)}-${product.id}.${extension}`
        const contentType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg"
        const { error } = await supabase.storage.from(bucket).upload(
          objectPath,
          await readFile(sourcePath),
          { contentType, cacheControl: "31536000", upsert: true }
        )
        if (error) throw error
        publicUrl = supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl
        uploaded += 1
      }
    }

    if (!publicUrl) {
      if (product.imageUrl?.startsWith("/")) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: null, images: "[]" },
        })
        clearedInvalid += 1
      }
      withoutImage += 1
      continue
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: publicUrl, images: JSON.stringify([publicUrl]) },
    })
    linked += 1
  }

  console.log(JSON.stringify({ linked, uploaded, withoutImage, clearedInvalid, bucket }, null, 2))
} finally {
  await prisma.$disconnect()
}
