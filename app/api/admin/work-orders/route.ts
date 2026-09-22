/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getRequestAdminSession } from "@/lib/admin-request"

const statuses = new Set(["OPEN", "DIAGNOSIS", "WAITING_PARTS", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"])
function serialize(order: any) { return { ...order, partsCost: Number(order.partsCost), laborCost: Number(order.laborCost), total: Number(order.total) } }

export async function GET(req: Request) {
  const session = await getRequestAdminSession(req)
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 })

  const orders = await prisma.workOrder.findMany({
    where:
      session.role === "TECHNICIAN"
        ? { assignedToId: session.userId || "__sin_usuario__" }
        : undefined,
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { customer: true, assignedTo: true },
  })
  return NextResponse.json(orders.map(serialize))
}

export async function POST(req: Request) {
  const session = await getRequestAdminSession(req)
  if (!session || !["ADMIN", "SALES"].includes(session.role || "")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const plate = typeof body.vehiclePlate === "string" ? body.vehiclePlate.trim().toUpperCase() : ""
  const problem = typeof body.problem === "string" ? body.problem.trim() : ""
  if (!plate || !problem) return NextResponse.json({ error: "Ingresá patente y trabajo solicitado." }, { status: 400 })
  const partsCost = Math.max(0, Number(body.partsCost) || 0)
  const laborCost = Math.max(0, Number(body.laborCost) || 0)
  const assignedToId = typeof body.assignedToId === "string" && body.assignedToId ? body.assignedToId : null

  if (assignedToId) {
    const mechanic = await prisma.erpUser.findFirst({
      where: { id: assignedToId, role: "TECHNICIAN", active: true },
      select: { id: true },
    })
    if (!mechanic) {
      return NextResponse.json({ error: "Seleccioná un mecánico activo." }, { status: 400 })
    }
  }

  const order = await prisma.workOrder.create({ data: { customerId: Number.isInteger(Number(body.customerId)) ? Number(body.customerId) : null, assignedToId, vehiclePlate: plate, vehicleDescription: body.vehicleDescription?.trim() || null, problem, diagnosis: body.diagnosis?.trim() || null, workPerformed: body.workPerformed?.trim() || null, partsCost, laborCost, total: partsCost + laborCost, estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null }, include: { customer: true, assignedTo: true } })
  return NextResponse.json(serialize(order), { status: 201 })
}

export async function PATCH(req: Request) {
  const session = await getRequestAdminSession(req)
  if (!session || session.role === "VIEWER") return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const id = Number(body.id)
  const status = String(body.status || "")
  if (!Number.isInteger(id) || !statuses.has(status)) return NextResponse.json({ error: "Orden o estado inválido." }, { status: 400 })

  if (session.role === "TECHNICIAN") {
    const assignedOrder = await prisma.workOrder.findUnique({
      where: { id },
      select: { assignedToId: true },
    })
    if (!assignedOrder) {
      return NextResponse.json({ error: "La orden no existe." }, { status: 404 })
    }
    if (!session.userId || assignedOrder.assignedToId !== session.userId) {
      return NextResponse.json({ error: "Esta tarea no está asignada a tu usuario." }, { status: 403 })
    }
  }

  const diagnosis = typeof body.diagnosis === "string" ? body.diagnosis.trim() || null : undefined
  const workPerformed = typeof body.workPerformed === "string" ? body.workPerformed.trim() || null : undefined
  const order = await prisma.workOrder.update({ where: { id }, data: { status: status as any, diagnosis, workPerformed, deliveredAt: status === "DELIVERED" ? new Date() : undefined }, include: { customer: true, assignedTo: true } })
  return NextResponse.json(serialize(order))
}
