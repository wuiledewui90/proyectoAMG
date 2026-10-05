import { NextResponse } from "next/server"
import { z } from "zod"
import { productListQuerySchema } from "@/lib/products/product-schemas"
import * as service from "@/lib/products/product-service"
import { serializeProduct, serializeProducts } from "@/lib/products/product-serialize"
import {
  preferSupabaseProductImage,
  preferSupabaseProductImages,
} from "@/lib/products/product-supabase-images"
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

export const dynamic = "force-dynamic"
export const revalidate = 0

function getAdminTokenFromCookieHeader(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const wantsPaged = searchParams.has("page") || searchParams.has("limit")

  const parsed = productListQuerySchema.safeParse({
    search: searchParams.get("search") ?? searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    isActive: searchParams.get("isActive") ?? searchParams.get("active") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { search, category, brand, isActive, page, limit } = parsed.data
  const { total, items } = await service.list({ search, category, brand, isActive, page, limit })
  const serializedItems = await preferSupabaseProductImages(serializeProducts(items))

  if (!wantsPaged) {
    return NextResponse.json(serializedItems, {
      headers: { "Cache-Control": "no-store" },
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const filterOptions = await service.listFilterOptions()

  return NextResponse.json(
    {
      items: serializedItems,
      page,
      limit,
      total,
      totalPages,
      availableCategories: filterOptions.categories,
      availableBrands: filterOptions.brands,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}

export async function POST(req: Request) {
  const token = getAdminTokenFromCookieHeader(req)
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const product = await service.create(body)
    return NextResponse.json(await preferSupabaseProductImage(serializeProduct(product)))
  } catch (err) {
    if (err instanceof service.ConflictError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: err.issues },
        { status: 400 }
      )
    }
    throw err
  }
}
