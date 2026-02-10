import { NextResponse } from "next/server"
import { z } from "zod"
import * as service from "@/lib/products/product-service"
import { serializeProduct } from "@/lib/products/product-serialize"

export const dynamic = "force-dynamic"
export const revalidate = 0

function parseId(params: { id: string }) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = parseId(params)
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  try {
    const product = await service.getById(id)
    return NextResponse.json(serializeProduct(product), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (err) {
    if (err instanceof service.NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
