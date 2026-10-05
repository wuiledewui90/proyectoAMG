/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getRequestAdminSession } from "@/lib/admin-request"

const statuses = new Set(["OPEN", "DIAGNOSIS", "WAITING_PARTS", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"])
const includeOrder = { customer: true, assignedTo: true, invoiceDocument: { select: { id: true, status: true } }, items: { orderBy: { id: "asc" as const } } }

function serialize(order:any) {
  return {
    ...order,
    partsCost:Number(order.partsCost),
    laborCost:Number(order.laborCost),
    total:Number(order.total),
    items:(order.items || []).map((item:any)=>({ ...item, quantity:Number(item.quantity), unitPrice:Number(item.unitPrice), subtotal:Number(item.subtotal) })),
  }
}

function cleanText(value:unknown,max=255) { return typeof value === "string" ? value.trim().slice(0,max) : "" }
function dateValue(value:unknown,fallback:Date|null) { if (!value) return fallback; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? fallback : date }

function parseItems(value:unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry:any)=>{
    const description = cleanText(entry?.description)
    const quantity = Number(entry?.quantity)
    const unitPrice = Number(entry?.unitPrice)
    const productId = Number(entry?.productId)
    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) return []
    return [{ productId:Number.isInteger(productId) && productId > 0 ? productId : null, kind:entry?.kind === "SERVICE" ? "SERVICE" : "PART", description, quantity, unitPrice, subtotal:quantity * unitPrice }]
  })
}

async function validateMechanic(assignedToId:string|null) {
  if (!assignedToId) return true
  return Boolean(await prisma.erpUser.findFirst({ where:{ id:assignedToId,role:"TECHNICIAN",active:true },select:{id:true} }))
}

export async function GET(req:Request) {
  const session = await getRequestAdminSession(req)
  if (!session) return NextResponse.json({error:"No autorizado."},{status:401})
  const orders = await prisma.workOrder.findMany({
    where:session.role === "TECHNICIAN" ? {assignedToId:session.userId || "__sin_usuario__"} : undefined,
    orderBy:{createdAt:"desc"},take:300,include:includeOrder,
  })
  return NextResponse.json(orders.map(serialize))
}

export async function POST(req:Request) {
  const session = await getRequestAdminSession(req)
  if (!session || !["ADMIN","SALES"].includes(session.role || "")) return NextResponse.json({error:"No autorizado."},{status:403})
  const body = await req.json().catch(()=>({}))
  const plate = cleanText(body.vehiclePlate,20).toUpperCase()
  const problem = cleanText(body.problem,5000)
  if (!plate || !problem) return NextResponse.json({error:"Ingresá patente y trabajo solicitado."},{status:400})
  const assignedToId = cleanText(body.assignedToId,191) || null
  if (!(await validateMechanic(assignedToId))) return NextResponse.json({error:"Seleccioná un mecánico activo."},{status:400})
  const items = parseItems(body.items)
  const partsCost = items.length ? items.filter((item)=>item.kind === "PART").reduce((sum,item)=>sum+item.subtotal,0) : Math.max(0,Number(body.partsCost)||0)
  const laborCost = items.length ? items.filter((item)=>item.kind === "SERVICE").reduce((sum,item)=>sum+item.subtotal,0) : Math.max(0,Number(body.laborCost)||0)
  const customerId = Number(body.customerId)
  const order = await prisma.workOrder.create({
    data:{
      customerId:Number.isInteger(customerId) && customerId > 0 ? customerId : null,
      assignedToId,vehiclePlate:plate,vehicleDescription:cleanText(body.vehicleDescription,191)||null,problem,
      partsCost,laborCost,total:partsCost+laborCost,receivedAt:dateValue(body.receivedAt,new Date()) || new Date(),
      estimatedDelivery:dateValue(body.estimatedDelivery,null),
      items:items.length ? {create:items} : undefined,
    },include:includeOrder,
  })
  return NextResponse.json(serialize(order),{status:201})
}

export async function PATCH(req:Request) {
  const session = await getRequestAdminSession(req)
  if (!session || session.role === "VIEWER") return NextResponse.json({error:"No autorizado."},{status:403})
  const body = await req.json().catch(()=>({}))
  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({error:"Orden inválida."},{status:400})

  if (body.action === "details") {
    if (!['ADMIN','SALES'].includes(session.role || "")) return NextResponse.json({error:"No tenés permiso para editar la orden."},{status:403})
    const current = await prisma.workOrder.findUnique({where:{id},select:{invoiceDocumentId:true}})
    if (!current) return NextResponse.json({error:"La orden no existe."},{status:404})
    if (current.invoiceDocumentId) return NextResponse.json({error:"La orden ya fue facturada. Editá el comprobante asociado."},{status:409})
    const plate = cleanText(body.vehiclePlate,20).toUpperCase()
    const problem = cleanText(body.problem,5000)
    const assignedToId = cleanText(body.assignedToId,191) || null
    if (!plate || !problem) return NextResponse.json({error:"Ingresá patente y trabajo solicitado."},{status:400})
    if (!(await validateMechanic(assignedToId))) return NextResponse.json({error:"Seleccioná un mecánico activo."},{status:400})
    const items = parseItems(body.items)
    const partsCost = items.filter((item)=>item.kind === "PART").reduce((sum,item)=>sum+item.subtotal,0)
    const laborCost = items.filter((item)=>item.kind === "SERVICE").reduce((sum,item)=>sum+item.subtotal,0)
    const customerId = Number(body.customerId)
    const order = await prisma.$transaction(async(tx)=>{
      await tx.workOrderItem.deleteMany({where:{workOrderId:id}})
      return tx.workOrder.update({where:{id},data:{customerId:Number.isInteger(customerId)&&customerId>0?customerId:null,assignedToId,vehiclePlate:plate,vehicleDescription:cleanText(body.vehicleDescription,191)||null,problem,partsCost,laborCost,total:partsCost+laborCost,receivedAt:dateValue(body.receivedAt,new Date())||new Date(),estimatedDelivery:dateValue(body.estimatedDelivery,null),items:items.length?{create:items}:undefined},include:includeOrder})
    })
    return NextResponse.json(serialize(order))
  }

  const status = String(body.status || "")
  if (!statuses.has(status)) return NextResponse.json({error:"Estado inválido."},{status:400})
  if (session.role === "TECHNICIAN") {
    const assignedOrder = await prisma.workOrder.findUnique({where:{id},select:{assignedToId:true}})
    if (!assignedOrder) return NextResponse.json({error:"La orden no existe."},{status:404})
    if (!session.userId || assignedOrder.assignedToId !== session.userId) return NextResponse.json({error:"Esta tarea no está asignada a tu usuario."},{status:403})
  }
  const diagnosis = typeof body.diagnosis === "string" ? body.diagnosis.trim() || null : undefined
  const workPerformed = typeof body.workPerformed === "string" ? body.workPerformed.trim() || null : undefined
  const order = await prisma.workOrder.update({where:{id},data:{status:status as any,diagnosis,workPerformed,deliveredAt:status === "DELIVERED" ? new Date() : undefined},include:includeOrder})
  return NextResponse.json(serialize(order))
}
