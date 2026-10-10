import { NextResponse } from "next/server"

import { getRequestAdminSession } from "@/lib/admin-request"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const session = await getRequestAdminSession(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ stockCategory: "asc" }, { category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stock: true,
      isActive: true,
      category: true,
      stockType: true,
      stockCategory: true,
    },
  })

  return NextResponse.json(
    products.map((product) => ({ ...product, price: Number(product.price) })),
    { headers: { "Cache-Control": "no-store" } },
  )
}
