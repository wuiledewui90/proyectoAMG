import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { InvalidProductImageError, prepareProductImage } from "@/lib/products/prepare-product-image"
import { isTrustedMutationOrigin } from "@/lib/security/request"
import { getSupabaseServerConfig } from "@/lib/supabase/config"
import { supabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = "nodejs"

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

function getAdminTokenFromCookieHeader(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

function normalizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export async function POST(req: Request) {
  if (!isTrustedMutationOrigin(req)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
  }

  const token = getAdminTokenFromCookieHeader(req)
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Imagen requerida" }, { status: 400 })
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "La imagen no puede superar los 5 MB." },
      { status: 400 }
    )
  }

  let optimized: Buffer
  try {
    optimized = await prepareProductImage(Buffer.from(await file.arrayBuffer()), file.type)
  } catch (error) {
    if (error instanceof InvalidProductImageError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
  if (optimized.length > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "La imagen optimizada supera los 5 MB." }, { status: 413 })
  }

  const baseName = normalizeFileName(file.name) || "producto"
  const objectPath = `erp/${baseName}-${randomUUID()}.webp`
  const { storageBucket } = getSupabaseServerConfig()

  const { error } = await supabaseServer.storage
    .from(storageBucket)
    .upload(objectPath, optimized, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    })

  if (error) {
    return NextResponse.json(
      { error: `No se pudo guardar la imagen en Supabase Storage: ${error.message}` },
      { status: 502 }
    )
  }

  const { data } = supabaseServer.storage.from(storageBucket).getPublicUrl(objectPath)

  return NextResponse.json({
    url: data.publicUrl,
  })
}
