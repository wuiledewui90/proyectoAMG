import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getRequestAdminSession, requireOwnerOrAdmin } from "@/lib/admin-request"
import { defaultErpSettings, serializeErpSettings } from "@/lib/erp-settings"

function optionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function boundedInteger(value: unknown, min: number, max: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null
}

export async function GET(req: Request) {
  if (!(await getRequestAdminSession(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const settings = await prisma.erpSetting.upsert({
    where: { id: 1 },
    create: defaultErpSettings,
    update: {},
  })

  return NextResponse.json(serializeErpSettings(settings))
}

export async function PUT(req: Request) {
  if (!(await requireOwnerOrAdmin(req))) {
    return NextResponse.json(
      { error: "Solo un administrador puede modificar la configuración." },
      { status: 403 }
    )
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const businessName = optionalText(body.businessName, 160)
  const quoteValidityDays = boundedInteger(body.quoteValidityDays, 1, 365)
  const invoiceDueDays = boundedInteger(body.invoiceDueDays, 0, 365)
  const defaultTaxRate = Number(body.defaultTaxRate)

  if (!businessName) {
    return NextResponse.json({ error: "Ingresá el nombre del negocio." }, { status: 400 })
  }
  if (quoteValidityDays === null || invoiceDueDays === null) {
    return NextResponse.json(
      { error: "Los plazos deben ser números enteros entre 0 y 365 días." },
      { status: 400 }
    )
  }
  if (!Number.isFinite(defaultTaxRate) || defaultTaxRate < 0 || defaultTaxRate > 100) {
    return NextResponse.json(
      { error: "El impuesto predeterminado debe estar entre 0 y 100%." },
      { status: 400 }
    )
  }

  const settings = await prisma.erpSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      businessName,
      tagline: optionalText(body.tagline, 191),
      taxId: optionalText(body.taxId, 40),
      phone: optionalText(body.phone, 40),
      email: optionalText(body.email, 191),
      address: optionalText(body.address, 255),
      whatsapp: optionalText(body.whatsapp, 40),
      quoteValidityDays,
      invoiceDueDays,
      defaultTaxRate,
      defaultTerms: optionalText(body.defaultTerms, 5000),
    },
    update: {
      businessName,
      tagline: optionalText(body.tagline, 191),
      taxId: optionalText(body.taxId, 40),
      phone: optionalText(body.phone, 40),
      email: optionalText(body.email, 191),
      address: optionalText(body.address, 255),
      whatsapp: optionalText(body.whatsapp, 40),
      quoteValidityDays,
      invoiceDueDays,
      defaultTaxRate,
      defaultTerms: optionalText(body.defaultTerms, 5000),
    },
  })

  return NextResponse.json(serializeErpSettings(settings))
}
