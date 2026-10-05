import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getRequestAdminSession } from "@/lib/admin-request"

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}) {
  const session = await getRequestAdminSession(req)
  if (!session || !["ADMIN","SALES"].includes(session.role || "")) return NextResponse.json({error:"No tenés permiso para facturar órdenes."},{status:403})
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({error:"Orden inválida."},{status:400})
  const order = await prisma.workOrder.findUnique({where:{id},include:{customer:true,invoiceDocument:{select:{id:true}},items:{orderBy:{id:"asc"}}}})
  if (!order) return NextResponse.json({error:"La orden no existe."},{status:404})
  if (order.invoiceDocument) return NextResponse.json({id:order.invoiceDocument.id,type:"INVOICE",existing:true})

  const detail = order.items.length ? order.items.map((item)=>({productId:item.productId,description:item.description,quantity:Number(item.quantity),unitPrice:Number(item.unitPrice),subtotal:Number(item.subtotal)})) : [
    ...(Number(order.partsCost)>0?[{productId:null,description:`Repuestos orden #${order.id}`,quantity:1,unitPrice:Number(order.partsCost),subtotal:Number(order.partsCost)}]:[]),
    ...(Number(order.laborCost)>0?[{productId:null,description:`Mano de obra orden #${order.id}`,quantity:1,unitPrice:Number(order.laborCost),subtotal:Number(order.laborCost)}]:[]),
  ]
  const subtotal = detail.reduce((sum,item)=>sum+item.subtotal,0)
  if (!detail.length || subtotal <= 0) return NextResponse.json({error:"Agregá al menos un repuesto o servicio con importe antes de facturar."},{status:400})

  const document = await prisma.$transaction(async(tx)=>{
    const created = await tx.erpDocument.create({data:{type:"INVOICE",status:"DRAFT",customerId:order.customerId,createdById:session.userId||null,customerName:order.customer?.name||"Consumidor final",customerTaxId:order.customer?.taxId||null,customerPhone:order.customer?.phone||null,customerEmail:order.customer?.email||null,customerAddress:order.customer?.address||null,vehicleDescription:order.vehicleDescription,vehiclePlate:order.vehiclePlate,issueDate:new Date(),subtotal,discount:0,taxRate:0,taxAmount:0,total:subtotal,notes:`Factura generada desde la orden de trabajo #${order.id}. ${order.problem}`,terms:"Comprobante interno. Sujeto a revisión antes de emitir.",items:{create:detail}},select:{id:true,type:true}})
    await tx.workOrder.update({where:{id},data:{invoiceDocumentId:created.id}})
    return created
  })
  return NextResponse.json(document,{status:201})
}
