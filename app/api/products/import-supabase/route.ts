import { NextResponse } from "next/server"
import { requireOwnerOrAdmin } from "@/lib/admin-request"
import { prisma } from "@/lib/db/prisma"
import {
  prepareSupabaseProductImport,
  summarizeSupabaseProductImport,
} from "@/lib/products/supabase-import"
import { isTrustedMutationOrigin } from "@/lib/security/request"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = "nodejs"

async function preview(req: Request) {
  if (!(await requireOwnerOrAdmin(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const plan = await prepareSupabaseProductImport()
    return NextResponse.json(summarizeSupabaseProductImport(plan), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[products/import-supabase] Error en vista previa", error)
    return NextResponse.json(
      { error: "No se pudo comparar Supabase con los productos del ERP." },
      { status: 502 },
    )
  }
}

export async function GET(req: Request) {
  return preview(req)
}

export async function POST(req: Request) {
  if (!isTrustedMutationOrigin(req)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
  }
  if (!(await requireOwnerOrAdmin(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (body?.confirm !== true || !/^[a-f0-9]{64}$/.test(body?.fingerprint || "")) {
    return NextResponse.json({ error: "Confirmación inválida" }, { status: 400 })
  }

  try {
    const plan = await prepareSupabaseProductImport()
    if (plan.fingerprint !== body.fingerprint) {
      return NextResponse.json(
        { error: "El catálogo cambió. Revisá nuevamente la vista previa antes de importar." },
        { status: 409 },
      )
    }
    if (plan.conflicts.length) {
      return NextResponse.json(
        { error: "Hay códigos en conflicto. Resolvelos antes de importar." },
        { status: 409 },
      )
    }

    const created = plan.candidates.length
      ? (await prisma.product.createMany({
          data: plan.candidates,
          skipDuplicates: true,
        })).count
      : 0

    return NextResponse.json({
      created,
      skipped: plan.alreadyPresent + plan.candidates.length - created,
      total: plan.total,
      withImage: plan.withImage,
      stockNotice: "El stock se copió como valor inicial; las ventas aún no se sincronizan con Supabase.",
    })
  } catch (error) {
    console.error("[products/import-supabase] Error al importar", error)
    return NextResponse.json(
      { error: "No se pudo completar la importación. No se modificaron productos existentes." },
      { status: 502 },
    )
  }
}
