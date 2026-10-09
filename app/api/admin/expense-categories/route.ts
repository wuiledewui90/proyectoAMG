import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

import { getRequestAdminSession } from "@/lib/admin-request"
import { prisma } from "@/lib/db/prisma"

const defaultCategories = [
  "Repuestos",
  "Insumos",
  "Servicios",
  "Herramientas",
  "Impuestos",
  "Otros",
]

function normalizeCategory(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
}

export async function GET(req: Request) {
  if (!(await getRequestAdminSession(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  await prisma.erpExpenseCategory.createMany({
    data: defaultCategories.map((name) => ({ name })),
    skipDuplicates: true,
  })

  const [savedCategories, usedCategories] = await Promise.all([
    prisma.erpExpenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.erpExpense.findMany({ distinct: ["category"], select: { category: true } }),
  ])

  const categories = Array.from(
    new Set([
      ...savedCategories.map((category) => category.name),
      ...usedCategories.map((expense) => expense.category.trim()).filter(Boolean),
    ])
  ).sort((left, right) => left.localeCompare(right, "es"))

  return NextResponse.json(categories, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(req: Request) {
  const session = await getRequestAdminSession(req)
  if (!session || !["ADMIN", "SALES"].includes(session.role || "")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const name = normalizeCategory(body.name)

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "La categoría debe tener entre 2 y 80 caracteres." },
      { status: 400 }
    )
  }

  try {
    const category = await prisma.erpExpenseCategory.create({ data: { name } })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Esa categoría ya existe." }, { status: 409 })
    }
    throw error
  }
}
