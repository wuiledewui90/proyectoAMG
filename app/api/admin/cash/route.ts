import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getRequestAdminSession } from "@/lib/admin-request"
import { argentinaDate, getCashMovements, summarizeCash, validBusinessDate } from "@/lib/cash"
import { prisma } from "@/lib/db/prisma"

const paymentMethods = ["CASH", "TRANSFER", "CARD", "CURRENT_ACCOUNT"] as const

function serializeSession(session: Awaited<ReturnType<typeof findSession>>) {
  if (!session) return null
  return {
    ...session,
    openingBalance: Number(session.openingBalance),
    totalIncome: session.totalIncome === null ? null : Number(session.totalIncome),
    totalExpense: session.totalExpense === null ? null : Number(session.totalExpense),
    cashIncome: session.cashIncome === null ? null : Number(session.cashIncome),
    cashExpense: session.cashExpense === null ? null : Number(session.cashExpense),
    expectedCash: session.expectedCash === null ? null : Number(session.expectedCash),
    countedCash: session.countedCash === null ? null : Number(session.countedCash),
    difference: session.difference === null ? null : Number(session.difference),
  }
}

function findSession(date: string) {
  return prisma.cashSession.findUnique({
    where: { businessDate: date },
    include: {
      openedBy: { select: { name: true } },
      closedBy: { select: { name: true } },
    },
  })
}

export async function GET(req: Request) {
  if (!(await getRequestAdminSession(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }
  const requested = new URL(req.url).searchParams.get("date") || argentinaDate()
  if (!validBusinessDate(requested)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 })
  }
  const session = await findSession(requested)
  const movements = await getCashMovements(requested)
  const liveSummary = summarizeCash(movements, Number(session?.openingBalance ?? 0))
  const hasClosedSnapshot = Boolean(
    session?.closedAt &&
      session.totalIncome !== null &&
      session.totalExpense !== null &&
      session.cashIncome !== null &&
      session.cashExpense !== null &&
      session.expectedCash !== null
  )
  const summary = hasClosedSnapshot && session
    ? {
        ...liveSummary,
        income: Number(session.totalIncome),
        expense: Number(session.totalExpense),
        cashIncome: Number(session.cashIncome),
        cashExpense: Number(session.cashExpense),
        expectedCash: Number(session.expectedCash),
        balance: Number(session.totalIncome) - Number(session.totalExpense),
      }
    : liveSummary
  return NextResponse.json({
    date: requested,
    today: argentinaDate(),
    session: serializeSession(session),
    summary,
    summaryMode: hasClosedSnapshot ? "CLOSED_SNAPSHOT" : "LIVE",
    movements: movements.map((movement) => ({ ...movement, createdAt: movement.createdAt.toISOString() })),
  })
}

export async function POST(req: Request) {
  const admin = await getRequestAdminSession(req)
  if (!admin || !["ADMIN", "SALES"].includes(admin.role || "")) {
    return NextResponse.json({ error: "No tenés permiso para operar la caja." }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || "")
  const date = String(body.date || argentinaDate())
  if (!validBusinessDate(date) || date !== argentinaDate()) {
    return NextResponse.json({ error: "Solo se puede operar la caja del día actual." }, { status: 400 })
  }

  try {
    if (action === "open") {
      const openingBalance = Number(body.openingBalance)
      if (!Number.isFinite(openingBalance) || openingBalance < 0) {
        return NextResponse.json({ error: "Ingresá un fondo inicial válido." }, { status: 400 })
      }
      const created = await prisma.cashSession.create({
        data: { businessDate: date, openingBalance, openedById: admin.userId || null },
      })
      return NextResponse.json({ id: created.id }, { status: 201 })
    }

    const current = await prisma.cashSession.findUnique({ where: { businessDate: date } })
    if (!current) return NextResponse.json({ error: "Primero abrí la caja." }, { status: 400 })

    if (action === "movement") {
      if (current.closedAt) return NextResponse.json({ error: "La caja está cerrada." }, { status: 400 })
      const type = body.type === "INCOME" ? "INCOME" : body.type === "EXPENSE" ? "EXPENSE" : ""
      const amount = Number(body.amount)
      const description = String(body.description || "").trim()
      const paymentMethod = String(body.paymentMethod || "CASH") as (typeof paymentMethods)[number]
      if (!type || !description || !Number.isFinite(amount) || amount <= 0 || !paymentMethods.includes(paymentMethod)) {
        return NextResponse.json({ error: "Completá correctamente el movimiento." }, { status: 400 })
      }
      const movement = await prisma.cashMovement.create({
        data: { sessionId: current.id, type, amount, description, paymentMethod, createdById: admin.userId || null },
      })
      return NextResponse.json({ id: movement.id }, { status: 201 })
    }

    if (action === "close") {
      if (current.closedAt) return NextResponse.json({ error: "La caja ya está cerrada." }, { status: 400 })
      const countedCash = Number(body.countedCash)
      if (!Number.isFinite(countedCash) || countedCash < 0) {
        return NextResponse.json({ error: "Ingresá el efectivo contado." }, { status: 400 })
      }
      const movements = await getCashMovements(date)
      const summary = summarizeCash(movements, Number(current.openingBalance))
      await prisma.cashSession.update({
        where: { id: current.id },
        data: {
          closedAt: new Date(),
          closedById: admin.userId || null,
          totalIncome: summary.income,
          totalExpense: summary.expense,
          cashIncome: summary.cashIncome,
          cashExpense: summary.cashExpense,
          expectedCash: summary.expectedCash,
          countedCash,
          difference: countedCash - summary.expectedCash,
          notes: String(body.notes || "").trim() || null,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "reopen") {
      if (admin.role !== "ADMIN") {
        return NextResponse.json({ error: "Solo un administrador puede reabrir la caja." }, { status: 403 })
      }
      if (!current.closedAt) return NextResponse.json({ error: "La caja ya está abierta." }, { status: 400 })
      await prisma.cashSession.update({
        where: { id: current.id },
        data: {
          closedAt: null,
          closedById: null,
          totalIncome: null,
          totalExpense: null,
          cashIncome: null,
          cashExpense: null,
          expectedCash: null,
          countedCash: null,
          difference: null,
          notes: null,
        },
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Acción inválida." }, { status: 400 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "La caja de hoy ya fue abierta." }, { status: 409 })
    }
    return NextResponse.json({ error: "No se pudo completar la operación de caja." }, { status: 500 })
  }
}
