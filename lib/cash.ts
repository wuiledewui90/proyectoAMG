import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"

export type CashMovementView = {
  id: string
  source: "SALE" | "EXPENSE" | "PAYROLL" | "MANUAL"
  type: "INCOME" | "EXPENSE"
  description: string
  detail: string
  paymentMethod: string
  amount: number
  createdAt: Date
}

export function argentinaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function validBusinessDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    year >= 2000 &&
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

export function cashDateRange(date: string) {
  const start = new Date(`${date}T00:00:00-03:00`)
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) }
}

export async function getCashMovements(date: string, db: Prisma.TransactionClient | typeof prisma = prisma) {
  const { start, end } = cashDateRange(date)
  const period = { gte: start, lt: end }
  const [sales, expenses, session] = await Promise.all([
    db.erpSale.findMany({
      where: { status: "COMPLETED", createdAt: period },
      select: {
        id: true,
        createdAt: true,
        paymentMethod: true,
        total: true,
        customer: { select: { name: true } },
        payments: { select: { method: true, amount: true } },
      },
    }),
    db.erpExpense.findMany({
      where: { expenseDate: period },
      select: { id: true, expenseDate: true, description: true, category: true, paymentMethod: true, amount: true },
    }),
    db.cashSession.findUnique({
      where: { businessDate: date },
      include: {
        movements: {
          include: {
            payroll: {
              select: {
                period: true,
                employee: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),
  ])

  const saleMovements: CashMovementView[] = sales.flatMap((sale) => {
    const payments = sale.payments.length
      ? sale.payments
      : [{ method: sale.paymentMethod, amount: sale.total }]
    return payments.filter((payment) => payment.method !== "CURRENT_ACCOUNT").map((payment, index) => ({
      id: `sale-${sale.id}-${index}`,
      source: "SALE" as const,
      type: "INCOME" as const,
      description: `Venta #${sale.id}`,
      detail: sale.customer?.name || "Consumidor final",
      paymentMethod: payment.method,
      amount: Number(payment.amount),
      createdAt: sale.createdAt,
    }))
  })
  const expenseMovements: CashMovementView[] = expenses.filter((expense) => expense.paymentMethod !== "CURRENT_ACCOUNT").map((expense) => ({
    id: `expense-${expense.id}`,
    source: "EXPENSE",
    type: "EXPENSE",
    description: expense.description,
    detail: expense.category,
    paymentMethod: expense.paymentMethod,
    amount: Number(expense.amount),
    createdAt: expense.expenseDate,
  }))
  const manualMovements: CashMovementView[] = (session?.movements ?? []).map((movement) => ({
    id: `manual-${movement.id}`,
    source: movement.payroll ? "PAYROLL" : "MANUAL",
    type: movement.type === "INCOME" ? "INCOME" : "EXPENSE",
    description: movement.description,
    detail: movement.payroll
      ? `${movement.payroll.employee.firstName} ${movement.payroll.employee.lastName} · período ${movement.payroll.period}`
      : "Movimiento manual",
    paymentMethod: movement.paymentMethod,
    amount: Number(movement.amount),
    createdAt: movement.createdAt,
  }))

  return [...saleMovements, ...expenseMovements, ...manualMovements].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
}

export function summarizeCash(movements: CashMovementView[], openingBalance = 0) {
  const sum = (type: CashMovementView["type"], method?: string) =>
    movements
      .filter((movement) => movement.type === type && (!method || movement.paymentMethod === method))
      .reduce((total, movement) => total + movement.amount, 0)
  const income = sum("INCOME")
  const expense = sum("EXPENSE")
  const cashIncome = sum("INCOME", "CASH")
  const cashExpense = sum("EXPENSE", "CASH")
  return {
    income,
    expense,
    cashIncome,
    cashExpense,
    expectedCash: openingBalance + cashIncome - cashExpense,
    balance: income - expense,
    incomeCount: movements.filter((movement) => movement.type === "INCOME").length,
    expenseCount: movements.filter((movement) => movement.type === "EXPENSE").length,
  }
}
