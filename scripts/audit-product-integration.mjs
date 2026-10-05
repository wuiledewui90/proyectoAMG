import nextEnv from "@next/env"

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production")

import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { PrismaClient } from "@prisma/client"
import { createClient } from "@supabase/supabase-js"

const prisma = new PrismaClient()

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta la variable ${name}.`)
  return value
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase()
}

try {
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const local = await prisma.product.findMany({
    select: { id: true, sku: true, imageUrl: true },
  })
  const { data, error } = await supabase
    .from(process.env.SUPABASE_PRODUCTS_TABLE?.trim() || "productos")
    .select("id,clave,codigo")
    .range(0, 999)

  if (error) throw error

  const remoteCodes = new Set(
    (data ?? []).flatMap((row) => [normalize(row.codigo), normalize(row.clave)]).filter(Boolean)
  )
  const matches = local.filter((product) => product.sku && remoteCodes.has(normalize(product.sku)))
  const imageFiles = await readdir(join(process.cwd(), "public", "images", "catalog-products", "t"))
  const imageStems = new Set(imageFiles.map((file) => file.replace(/\.[^.]+$/, "").toLowerCase()))
  const imageStem = (value) =>
    String(value ?? "")
      .trim()
      .replace(/[^A-Za-z0-9._-]/g, "_")
      .toLowerCase()
  const linkedCatalogImages = local.filter(
    (product) => product.sku && imageStems.has(imageStem(product.sku))
  ).length

  console.log(
    JSON.stringify(
      {
        mysqlProducts: local.length,
        supabaseProducts: data?.length ?? 0,
        matchingBySku: matches.length,
        mysqlWithImage: local.filter((product) => Boolean(product.imageUrl)).length,
        mysqlWithoutImage: local.filter((product) => !product.imageUrl).length,
        mysqlLinkedCatalogImages: linkedCatalogImages,
        mysqlVisibleImagesAfterLink:
          local.filter((product) => Boolean(product.imageUrl)).length +
          local.filter(
            (product) => !product.imageUrl && product.sku && imageStems.has(imageStem(product.sku))
          ).length,
      },
      null,
      2
    )
  )
} finally {
  await prisma.$disconnect()
}
