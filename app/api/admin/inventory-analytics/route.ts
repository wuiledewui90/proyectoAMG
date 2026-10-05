import { NextResponse } from "next/server"

import { getRequestAdminSession } from "@/lib/admin-request"
import { getInventoryAnalytics } from "@/lib/products/inventory-analytics"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: Request) {
  const session = await getRequestAdminSession(req)
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "No tenés permiso para ver los costos del inventario." }, { status: 403 })
  }

  const analytics = await getInventoryAnalytics()
  return NextResponse.json(analytics, { headers: { "Cache-Control": "no-store" } })
}
