/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getRequestAdminSession } from "@/lib/admin-request"

function serialize(expense: any) {
  return { ...expense, amount: Number(expense.amount) }
}

export async function GET(req: Request) {
  if (!(await getRequestAdminSession(req))) return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  const expenses = await prisma.erpExpense.findMany({ orderBy: { expenseDate: "desc" }, take: 300, include: { createdBy: true } })
  return NextResponse.json(expenses.map(serialize))
}

export async function POST(req: Request) {
  const session = await getRequestAdminSession(req)
  if (!session || !["ADMIN", "SALES"].includes(session.role || "")) return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const amount = Number(body.amount)
  const paymentMethod = String(body.paymentMethod || "")
  if (!body.category?.trim() || !body.description?.trim() || !Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Completá categoría, detalle e importe." }, { status: 400 })
  if (!["CASH", "TRANSFER", "CARD", "CURRENT_ACCOUNT"].includes(paymentMethod)) return NextResponse.json({ error: "Medio de pago inválido." }, { status: 400 })
  const expense = await prisma.erpExpense.create({ data: { category: body.category.trim(), description: body.description.trim(), amount, paymentMethod: paymentMethod as "CASH" | "TRANSFER" | "CARD" | "CURRENT_ACCOUNT", createdById: session.userId || null, expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date() }, include: { createdBy: true } })
  return NextResponse.json(serialize(expense), { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await getRequestAdminSession(req)
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  const id = Number(new URL(req.url).searchParams.get("id"))
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Gasto inválido." }, { status: 400 })
  await prisma.erpExpense.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
