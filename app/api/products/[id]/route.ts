export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextResponse } from "next/server"
import { z } from "zod"
import * as service from "@/lib/products/product-service"
import { serializeProduct } from "@/lib/products/product-serialize"
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

type RouteContext = {
  params: Promise<{ id: string }>
}

function getIdFromRequest(req: Request, params?: { id?: string }) {
  const pathId = new URL(req.url).pathname.split("/").filter(Boolean).pop()
  return String(params?.id ?? pathId ?? "").trim()
}

function parseId(raw: string) {
  const id = Number.parseInt(raw, 10)
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false as const, raw, id }
  }
  return { ok: true as const, raw, id }
}

function getAdminTokenFromCookieHeader(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

async function ensureAdmin(req: Request) {
  return verifyAdminSessionToken(getAdminTokenFromCookieHeader(req))
}

export async function PUT(req: Request, context: RouteContext) {
  if (!(await ensureAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const params = await context.params
  const rawId = getIdFromRequest(req, params)
  const parsed = parseId(rawId)

  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Invalid id", received: params?.id, raw: parsed.raw, parsed: parsed.id },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const product = await service.update(parsed.id, body)
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

export async function GET(req: Request, context: RouteContext) {
  const params = await context.params
  const rawId = getIdFromRequest(req, params)
  const parsed = parseId(rawId)
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Invalid id", received: params?.id, raw: parsed.raw, parsed: parsed.id },
      { status: 400 }
    )
  }

  try {
    const product = await service.getById(parsed.id)
    return NextResponse.json(serializeProduct(product))
  } catch (err) {
    if (err instanceof service.NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  if (!(await ensureAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const params = await context.params
  const rawId = getIdFromRequest(req, params)
  const parsed = parseId(rawId)
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Invalid id", received: params?.id, raw: parsed.raw, parsed: parsed.id },
      { status: 400 }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const hard = searchParams.get("hard") === "true"
    const product = hard
      ? await service.hardDelete(parsed.id)
      : await service.softDelete(parsed.id)
    return NextResponse.json(serializeProduct(product))
  } catch (err) {
    if (err instanceof service.NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
