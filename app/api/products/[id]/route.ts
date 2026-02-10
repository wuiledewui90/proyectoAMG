import { NextResponse } from "next/server"
import { z } from "zod"
import * as service from "@/lib/products/product-service"
import { serializeProduct } from "@/lib/products/product-serialize"

function parseId(params: { id: string }) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseId(params)
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  try {
    const product = await service.getById(id)
    return NextResponse.json(serializeProduct(product))
  } catch (err) {
    if (err instanceof service.NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseId(params)
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const product = await service.update(id, body as any)
    return NextResponse.json(serializeProduct(product))
  } catch (err) {
    if (err instanceof service.NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
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

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseId(params)
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  try {
    const product = await service.softDelete(id)
    return NextResponse.json(serializeProduct(product))
  } catch (err) {
    if (err instanceof service.NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
