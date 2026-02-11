import { NextResponse } from "next/server"
import { z } from "zod"
import { productListQuerySchema } from "@/lib/products/product-schemas"
import * as service from "@/lib/products/product-service"
import { serializeProduct, serializeProducts } from "@/lib/products/product-serialize"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const wantsPaged = searchParams.has("page") || searchParams.has("limit")

  const parsed = productListQuerySchema.safeParse({
    search: searchParams.get("search") ?? searchParams.get("q") ?? undefined,
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

  const { search, isActive, page, limit } = parsed.data
  const { total, items } = await service.list({ search, isActive, page, limit })

  if (!wantsPaged) {
    return NextResponse.json(serializeProducts(items), {
      headers: { "Cache-Control": "no-store" },
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return NextResponse.json(
    { items: serializeProducts(items), page, limit, total, totalPages },
    { headers: { "Cache-Control": "no-store" } }
  )
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const product = await service.create(body)
    return NextResponse.json(serializeProduct(product))
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
