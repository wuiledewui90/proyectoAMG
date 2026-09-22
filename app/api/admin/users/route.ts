import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { requireOwnerOrAdmin } from "@/lib/admin-request"

const roles = new Set(["ADMIN", "SALES", "TECHNICIAN", "VIEWER"])
const MAX_ERP_USERS = 6

export async function GET(req: Request) {
  if (!(await requireOwnerOrAdmin(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  const users = await prisma.erpUser.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await requireOwnerOrAdmin(req)
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const username = typeof body.username === "string" ? body.username.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const role = typeof body.role === "string" ? body.role : "VIEWER"

  if (!name || !/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    return NextResponse.json({ error: "Nombre o usuario inválido." }, { status: 400 })
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "La contraseña debe tener entre 8 y 128 caracteres." }, { status: 400 })
  }
  if (!roles.has(role)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 })
  }

  const userCount = await prisma.erpUser.count()
  if (userCount >= MAX_ERP_USERS) {
    return NextResponse.json(
      { error: `Se alcanzó el límite de ${MAX_ERP_USERS} usuarios.` },
      { status: 409 }
    )
  }

  try {
    const user = await prisma.erpUser.create({
      data: {
        name,
        username,
        passwordHash: await bcrypt.hash(password, 12),
        role: role as "ADMIN" | "SALES" | "TECHNICIAN" | "VIEWER",
      },
      select: { id: true, name: true, username: true, role: true, active: true, lastLoginAt: true, createdAt: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ese usuario ya existe." }, { status: 409 })
    }
    throw error
  }
}

export async function PATCH(req: Request) {
  if (!(await requireOwnerOrAdmin(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) return NextResponse.json({ error: "Usuario inválido." }, { status: 400 })

  const data: Prisma.erpUserUpdateInput = {}
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim()
  if (typeof body.active === "boolean") data.active = body.active
  if (typeof body.role === "string" && roles.has(body.role)) {
    data.role = body.role as "ADMIN" | "SALES" | "TECHNICIAN" | "VIEWER"
  }
  if (typeof body.password === "string" && body.password) {
    if (body.password.length < 8 || body.password.length > 128) {
      return NextResponse.json({ error: "La contraseña debe tener entre 8 y 128 caracteres." }, { status: 400 })
    }
    data.passwordHash = await bcrypt.hash(body.password, 12)
  }

  const user = await prisma.erpUser.update({
    where: { id },
    data,
    select: { id: true, name: true, username: true, role: true, active: true, lastLoginAt: true, createdAt: true },
  })
  return NextResponse.json(user)
}

export async function DELETE(req: Request) {
  if (!(await requireOwnerOrAdmin(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Usuario inválido." }, { status: 400 })
  await prisma.erpUser.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
