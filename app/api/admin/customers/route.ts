import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getRequestAdminSession } from "@/lib/admin-request"

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function customerData(body: Record<string, unknown>) {
  const year = Number(body.vehicleYear)
  return {
    name: typeof body.name === "string" ? body.name.trim() : "",
    phone: optionalText(body.phone),
    email: optionalText(body.email),
    taxId: optionalText(body.taxId),
    address: optionalText(body.address),
    vehiclePlate: optionalText(body.vehiclePlate)?.toUpperCase() || null,
    vehicleBrand: optionalText(body.vehicleBrand),
    vehicleModel: optionalText(body.vehicleModel),
    vehicleYear: Number.isInteger(year) && year >= 1900 && year <= 2100 ? year : null,
    currentAccountEnabled: body.currentAccountEnabled === true,
    notes: optionalText(body.notes),
  }
}

export async function GET(req: Request) {
  if (!(await getRequestAdminSession(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }
  const query = new URL(req.url).searchParams.get("q")?.trim() || ""
  const customers = await prisma.customer.findMany({
    where: {
      active: true,
      ...(query
        ? { OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
            { vehiclePlate: { contains: query } },
          ] }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 300,
    include: {
      _count: { select: { sales: true, workOrders: true } },
      sales: {
        where: {
          OR: [
            { paymentMethod: "CURRENT_ACCOUNT" },
            { payments: { some: { method: "CURRENT_ACCOUNT" } } },
          ],
        },
        select: { id: true },
        take: 1,
      },
    },
  })
  return NextResponse.json(
    customers.map(({ sales, ...customer }) => ({
      ...customer,
      hasCurrentAccount: customer.currentAccountEnabled || sales.length > 0,
    }))
  )
}

export async function POST(req: Request) {
  if (!(await getRequestAdminSession(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const data = customerData(body)
  if (data.name.length < 2) {
    return NextResponse.json({ error: "Ingresá el nombre del cliente." }, { status: 400 })
  }
  const customer = await prisma.customer.create({ data })
  return NextResponse.json(customer, { status: 201 })
}

export async function PATCH(req: Request) {
  if (!(await getRequestAdminSession(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const id = Number(body.id)
  const data = customerData(body)
  if (!Number.isInteger(id) || !data.name) {
    return NextResponse.json({ error: "Cliente inválido." }, { status: 400 })
  }
  const customer = await prisma.customer.update({ where: { id }, data })
  return NextResponse.json(customer)
}

export async function DELETE(req: Request) {
  if (!(await getRequestAdminSession(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }
  const id = Number(new URL(req.url).searchParams.get("id"))
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Cliente inválido." }, { status: 400 })
  }
  await prisma.customer.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
